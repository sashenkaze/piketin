const Validator = require("fastest-validator");
const v = new Validator();
const { User, Submission, JenisPekerjaan, SubmissionPekerjaan, sequelize} = require('../models');
const { response } = require('../helpers/response.formatter')
const { Op } = require("sequelize");
const exceljs = require('exceljs')

module.exports = {
    //! stats piket rayon hari ini — untuk pie chart dashboard admin
    // endpoint: GET /submissions/piket-stats
    // return: { sudah_piket, belum_piket, total } — semua murid, bukan per rayon
    getPiketRayonStats: async (req, res) => {
        try {
            const tanggalHariIni = new Date().toISOString().split('T')[0];

            //! hitung total semua murid di sistem
            const totalMurid = await User.count({ where: { role: 'murid' } });

            //! hitung murid yang sudah Accepted hari ini (semua rayon)
            const sudahPiket = await Submission.count({
                where: { status: 'Accepted', tanggal_piket: tanggalHariIni }
            });

            const belumPiket = totalMurid - sudahPiket;

            return res.status(200).json(response(200, "success", {
                sudah_piket: sudahPiket,
                belum_piket: belumPiket < 0 ? 0 : belumPiket,
                total: totalMurid,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! stats piket rayon minggu ini — untuk pie chart dashboard admin (chart kanan)
    // endpoint: GET /submissions/piket-stats-week
    // return: { sudah_piket, belum_piket, total } — semua murid, per submission terbaru minggu ini
    // PENTING: per user hanya dihitung submission terbaru — kalau decline lalu submit ulang,
    //          yang lama (Declined) diabaikan, yang baru (Pending/Accepted) yang dihitung
    getPiketRayonStatsWeek: async (req, res) => {
        try {
            //! hitung range minggu ini: Senin s/d Minggu
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            //! ambil semua murid — filter rayon_id kalau ada (untuk psrayon), kalau tidak ada ambil semua (admin)
            const rayonFilter = req.user.rayon_id ? { rayon_id: req.user.rayon_id } : {};
            const semuaMurid = await User.findAll({
                where: { role: 'murid', ...rayonFilter },
                attributes: ['id'],
            });

            const totalMurid = semuaMurid.length;
            let sudahPiket = 0;

            //! untuk setiap murid, ambil submission terbaru minggu ini
            // kalau decline lalu submit ulang, yang dihitung hanya yang terbaru
            for (const murid of semuaMurid) {
                const latest = await Submission.findOne({
                    where: {
                        user_id: murid.id,
                        tanggal_piket: { [Op.between]: [startOfWeek, endOfWeek] }
                    },
                    order: [['createdAt', 'DESC']],
                });
                //! hitung sebagai sudah piket kalau Accepted atau Pending (sudah submit, menunggu)
                if (latest && (latest.status === 'Accepted' || latest.status === 'Pending')) {
                    sudahPiket++;
                }
            }

            const belumPiket = totalMurid - sudahPiket;

            return res.status(200).json(response(200, "success", {
                sudah_piket: sudahPiket,
                belum_piket: belumPiket < 0 ? 0 : belumPiket,
                total: totalMurid,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    createSubmission: async (req, res) => {
        //! transaction dimulai sebelum try, karena kalau gagal di tengah harus rollback
        //! sequelize.transaction() : membuat sesi query jd semua query di dalem ini harus sukses semua atau batal semua
        const t = await sequelize.transaction();
        try {
            const { status_piket, kondisi, catatan, pekerjaan_ids } = req.body;

            //! cek file upload — hanya wajib kalau status_piket = Piket
            //! kalau Tidak Piket, foto tidak diperlukan
            if (status_piket === 'Piket') {
                if (!req.files || !req.files['foto_sebelum'] || !req.files['foto_sesudah']) {
                    await t.rollback();
                    return res.status(400).json(response(400, "Validasi Error", "Foto sebelum dan sesudah wajib diupload" ));
                }
            }

            const schema = {
                status_piket: { type: "enum", values: ["Piket", "Tidak Piket"] },
                kondisi: { type: "enum", values: ["Bersih dan Rapi", "Bersih", "Kurang"] },
            }
            const data = {
                status_piket: status_piket,
                kondisi: kondisi,
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            //! ambil data user dari jwt payload yg disimpan checktoken di req.user
            //! req.user.userId : di set waktu jwt.sign() di logincontroller
            const user = await User.findByPk(req.user.userId);
            if (!user) {
                await t.rollback();
                return res.status(400).json(response(400, "User not found"));
            }

            //! getDay() return angka: 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
            const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const hariIni = namaHari[new Date().getDay()];
            if (user.jadwal_piket !== hariIni) {
                await t.rollback();
                return res.status(400).json(response(400, `Bukan jadwal piket kamu. Jadwal kamu: ${user.jadwal_piket}`));
            }

            //! cek 1 submission per hari, kalau sudah ada yg Pending/Accepted hari ini, tolak
            //! toISOString() : ambil bagian tgl saja dr datetime ke format YYYY-MM-DD
            const tanggalHariIni = new Date().toISOString().split('T')[0]; 
            const existingSubmission = await Submission.findOne({
                where: {
                    user_id: req.user.userId,
                    tanggal_piket: tanggalHariIni,
                    status: { [Op.ne]: 'Declined' } // Op.ne : not equal — kalau Declined boleh submit baru
                }
            });
            if (existingSubmission) {
                await t.rollback();
                return res.status(400).json(response(400, "Kamu sudah submit absen hari ini"));
            }

            //! foto hanya diambil kalau ada (Piket), kalau g pike foto null
            const fotoSebelum = req.files?.['foto_sebelum']?.[0]?.filename || null;
            const fotoSesudah = req.files?.['foto_sesudah']?.[0]?.filename || null;

            //! { transaction: t } : query ini masuk dalam sesi transaction
            //! kalau query berikutnya gagal, ini ikut di-rollback
            const submission = await Submission.create({
                user_id: req.user.userId,
                tanggal_piket: tanggalHariIni,
                status_piket: data.status_piket,
                kondisi: data.kondisi,
                catatan: catatan || null,
                foto_sebelum: fotoSebelum,
                foto_sesudah: fotoSesudah,
                status: 'Pending'
            }, { transaction: t });

            //! pekerjaan_ids bisa array (kalau pilih banyak) atau string (kalau pilih 1)
            //! Array.isArray() : cek apakah sudah berbentuk array atau belum
            const ids = Array.isArray(pekerjaan_ids) ? pekerjaan_ids : [pekerjaan_ids];

            //! map() ini ubah array ids jadi array object siap insert
            const spData = ids.map(id => ({
                submission_id: submission.id,
                pekerjaan_id: Number(id),
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            //! bulkCreate — insert banyak baris sekaligus (kebalikan dari create yg hanya 1 baris)
            //! ini bagian kedua dari transaction — kalau ini gagal, submission di atas ikut di-rollback
            await SubmissionPekerjaan.bulkCreate(spData, { transaction: t });

            //! commit, tandai transaction selesai dan semua perubahan disimpan permanen
            await t.commit();

            // ambil hasil lengkap dengan relasi
            const result = await Submission.findByPk(submission.id, {
                include: [
                    { model: User, attributes: { exclude: ['password'] } },
                    { model: JenisPekerjaan }
                ]
            });
            return res.status(201).json(response(201, "created", result));
        } catch(error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message)
            );
        }
    },
    getAllSubmissions: async (req, res) => {
        try {
            const { page, limit, status } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            //! kalau psrayon, filter submission hanya dari murid di rayon yang sama
            // kalau administrator, ambil semua submission tanpa filter rayon
            const rayonFilter = req.user.rayon_id ? { rayon_id: req.user.rayon_id } : {};

            const { count, rows } = await Submission.findAndCountAll({
                where: status ? { status } : {},
                offset: Number(offset),
                limit: Number(limit),
                include: [
                    {
                        model: User,
                        attributes: { exclude: ['password'] },
                        where: rayonFilter.rayon_id ? { rayon_id: rayonFilter.rayon_id } : undefined
                    },
                    { model: JenisPekerjaan }
                ],
                order: [['createdAt', 'DESC']]
            });

            const formatPagination = {
                data: rows,
                limit: limit,
                rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count,
                page: page,
            };
            return res.status(200).json(response(200, "success", formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getMySubmission: async (req, res) => {
        try {
            const { page, limit } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            const { count, rows } = await Submission.findAndCountAll({
                //! filter berdasarkan user yg sedang login, bukan semua data. Jadi mengecek user mana yg sedang login dan hanya mengambil data itu
                where: { user_id: req.user.userId },
                offset: Number(offset),
                limit: Number(limit),
                include: [{ model: JenisPekerjaan }],
                order: [['createdAt', 'DESC']]
            });

            const formatPagination = {
                data: rows,
                limit: limit,
                rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count,
                page: page,
            };
            return res.status(200).json(response(200, "success", formatPagination));
        } catch {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { action, alasan_decline } = req.body; // action: psrayon melakukan accept atau decline submission murid

            const submission = await Submission.findByPk(id);
            if (!submission) {
                return res.status(400).json(response(400, "Submission not found"));
            }

            //! cek status kalau udh bukan pending, tolak perubahan
            if (submission.status !== 'Pending') {
                return res.status(400).json(response(400, "Submission sudah diproses sebelumnya"));
            }

            //! tentukan status baru berdasarkan action dari psrayon
            let newStatus;
            if (action === 'accept') {
                newStatus = 'Accepted';
            } else if (action === 'decline') {
                if (!alasan_decline) {
                    return res.status(400).json(response(400, "Validasi Error", "Alasan decline wajib diisi"));
                }
                newStatus = 'Declined';
            } else {
                return res.status(400).json(response(400, "Validasi Error", "action harus 'accept' atau 'decline'"));
            }

            await Submission.update({
                status: newStatus,
                alasan_decline: action === 'decline' ? alasan_decline : null
            }, { where: { id } });

            const updated = await Submission.findByPk(id, {
                include: [
                    { model: User, attributes: { exclude: ['password'] } },
                    { model: JenisPekerjaan }
                ]
            });
            return res.status(200).json(response(200, "success", updated));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    //! untuk export data submission murid sbg psrayon ke excel
    exportSubmissions: async (req, res) => {
        try {
        const submissions = await Submission.findAll({
            include: [
                { model: User, attributes: ['name', 'nis'] },
                { model: JenisPekerjaan, attributes: ['nama_pekerjaan'] }
            ],

            order: [['createdAt', 'DESC']]
        });

        //! exceljs.Workbook() : bawaan package exceljs utk membuat file excel baru di memory
        // 1 workbook = 1 file
        const workbook = new exceljs.Workbook();
        
        //! addWorksheet() : menambah sheet/tab baru di dalam file excel
        const sheet = workbook.addWorksheet('Histori Submission');

        //! addRow() : menambah 1 baris data ke sheet
        // key di sheet.columns dicocokin ke key object yang dilempar ke addRow()
        // toJSON() : ubah sequelize instance ke json dulu sebelum dimasukkan
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nama Murid', key: 'nama', width: 25 },
            { header: 'NIS', key: 'nis', width: 20 },
            { header: 'Tanggal Piket', key: 'tanggal_piket', width: 20 },
            { header: 'Status Piket', key: 'status_piket', width: 15 },
            { header: 'Kondisi', key: 'kondisi', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Alasan Decline', key: 'alasan_decline', width: 30 },
        ];

        submissions.forEach(sub => {
            const s = sub.toJSON();

            //! addRow dgn object manual karena data ini dr relasi User & JenisPekerjaan, bukan data dr tabel tunggal
            // data tdk bisa langsung di pass ke excel, perlu diambil dari nested object dulu
            // s.User?.name : optional chaining (?.). jd kalau s.User null/undefined, tidak error, di return undefined
            sheet.addRow({
                id: s.id,
                nama: s.User?.name,
                nis: s.User?.nis,
                tanggal_piket: s.tanggal_piket,
                status_piket: s.status_piket,
                kondisi: s.kondisi,
                status: s.status,
                alasan_decline: s.alasan_decline || '-',
            });
        });

        //! setHeader : response supaya browser/postman tau ini tuh file excel dan bukan json
        // Content-Type : memberitahu tipe file yang dikirim berupa format excel
        // Content-Disposition : memberitahu browser untuk download file, bukan tampilkan di layar
        // 'attachment' = download, filename = nama file hasil download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=histori-submission.xlsx');

        //! workbook.xlsx.write(res) : tulis isi file excel lgsg ke response HTTP
        // res di sini sbg tempat tujuan stream file dr exceljs td
        await workbook.xlsx.write(res);

        //! res.end() : tanda buat response selesai dikirim. wajib dipanggil setelah write() karena write() ga otomatis nutup response
        // tanpa ini, koneksi HTTP tidak pernah ditutup dan file tidak selesai terdownload
        res.end();
    } catch (error) {
        return res.status(500).json(response(500, "Server Error", error.message));
    }
    }
}