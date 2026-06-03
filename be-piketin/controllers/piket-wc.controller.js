const Validator = require("fastest-validator");
const v = new Validator();
const { SubmissionWc, User } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

//! helper: hitung nomor minggu dalam tahun dari tanggal tertentu
const getWeekNumber = (date) => {
    // hitungan per tahun. 1 Januari, 0 = januari di js
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    //! Math.ceil: bulatkan keatas. Pakai ini krn per minggu dihitung dr sdh msk hari ke brp, bukan brp minggu penuh
    return Math.ceil((
        (date - startOfYear) // selisih milidetik hari ini - 1 jan
        // 86400000: jumlah milidetik sehari (1000ms x 60s x 60m x 24h)
        / 86400000 // ubah ms ke hari
        //! getDay(): mengambil nomor hari dalam seminggu 0-6 (minggu-sabtu)
        + startOfYear.getDay() 
        + 1) // + 1 supaya pas hari pertama di satu minggu, sdh dihitung masuk minggu baru dan tidak menunggu hari esok
        / 7);
};

module.exports = {

    //! endpoint stats dashboard kokurikuler
    // return: { stats, murid_minggu_bukan_hari_ini, murid_hari_ini, pending_submissions }
    getKokurikulerDashboard: async (req, res) => {
        try {
            const now = new Date();
            const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const hariIni = namaHari[now.getDay()];

            //! hitung minggu ke berapa sekarang dalam siklus 4 minggu
            // sama persis dengan logika di createSubmissionWc
            const mingguSekarang = getWeekNumber(now);
            const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1;

            //! ambil semua murid
            const semuaMurid = await User.findAll({
                where: { role: 'murid' },
                attributes: ['id', 'name', 'nis', 'hari_wc', 'minggu_ke', 'tugas_wc'],
            });

            //! filter murid yang terjadwal minggu ini sesuai siklus
            const muridMingguIni = semuaMurid.filter(u => u.minggu_ke === minggukeSiklus);

            //! filter murid yang terjadwal hari ini DAN minggu ini
            const muridHariIni = muridMingguIni.filter(u => u.hari_wc === hariIni);

            //! murid minggu ini tp bukan hari ini
            const muridMingguBukanHariIni = muridMingguIni.filter(u => u.hari_wc !== hariIni);

            //! ambil submission wc yg masih pending
            const pendingSubmissions = await SubmissionWc.findAll({
                where: { status: 'Pending' },
                include: [{ model: User, as: 'User', attributes: ['id', 'name', 'nis'] }],
                order: [['createdAt', 'DESC']],
                limit: 20, //* batasi 20 supaya tidak terlalu berat
            });

            return res.status(200).json(response(200, "success", {
                stats: {
                    total_murid: semuaMurid.length,
                    murid_minggu_ini: muridMingguIni.length,
                    murid_hari_ini: muridHariIni.length,
                },
                murid_minggu_bukan_hari_ini: muridMingguBukanHariIni,
                murid_hari_ini: muridHariIni,
                pending_submissions: pendingSubmissions,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! stats piket WC minggu ini untuk chart kanan dashboard psrayon
    getWcStatsByRayon: async (req, res) => {
        try {
            const rayonId = req.user.rayon_id;
            const now = new Date();

            //! hitung siklus minggu sekarang — sama persis dengan logika createSubmissionWc
            const mingguSekarang = getWeekNumber(now);
            const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1;

            //! hitung range minggu ini: Senin s/d Minggu
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            //! ambil murid di rayon ini yang terjadwal piket WC minggu ini
            const muridTerjadwal = await User.findAll({
                where: { role: 'murid', rayon_id: rayonId, minggu_ke: minggukeSiklus },
                attributes: ['id'],
            });

            const total = muridTerjadwal.length;
            let sudahWc = 0;

            //! untuk setiap murid terjadwal, cek submission WC terbaru minggu ini
            for (const murid of muridTerjadwal) {
                const latest = await SubmissionWc.findOne({
                    where: {
                        user_id: murid.id,
                        tanggal_piket: { [Op.between]: [startOfWeek, endOfWeek] }
                    },
                    order: [['createdAt', 'DESC']],
                });
                //* hitung sudah WC kalau Accepted atau Pending (sudah submit, menunggu review)
                if (latest && (latest.status === 'Accepted' || latest.status === 'Pending')) {
                    sudahWc++;
                }
            }

            const belumWc = total - sudahWc;

            return res.status(200).json(response(200, "success", {
                sudah_wc: sudahWc,
                belum_wc: belumWc < 0 ? 0 : belumWc,
                total,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! endpoint baru: hitung jumlah submission WC per status untuk dashboard admin
    getWcStats: async (req, res) => {
        try {
            //! hitung range minggu ini: Senin s/d Minggu
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Minggu, 1=Senin, dst
            //! getDay() 0=Minggu, kita mau Senin sebagai awal minggu
            // kalau hari ini Minggu (0), mundur 6 hari. selain itu mundur (dayOfWeek - 1) hari
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            //! ambil semua murid
            const semuaMurid = await User.findAll({
                where: { role: 'murid' },
                attributes: ['id'],
            });

            //! untuk setiap murid, ambil submission terbaru minggu ini
            // ini supaya kalau decline lalu submit ulang, yang dihitung hanya yang terbaru
            let pending = 0, accepted = 0, declined = 0;

            for (const murid of semuaMurid) {
                const latest = await SubmissionWc.findOne({
                    where: {
                        user_id: murid.id,
                        tanggal_piket: { [Op.between]: [startOfWeek, endOfWeek] }
                    },
                    order: [['createdAt', 'DESC']], // ambil yang paling baru
                });
                if (!latest) continue; //* belum submit minggu ini, skip
                if (latest.status === 'Pending') pending++;
                else if (latest.status === 'Accepted') accepted++;
                else if (latest.status === 'Declined') declined++;
            }

            return res.status(200).json(response(200, "success", {
                pending,
                accepted,
                declined,
                total: pending + accepted + declined,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    createSubmissionWc: async (req, res) => {
        try {
            const { kondisi } = req.body;

            const schema = {
                kondisi: { 
                type: "enum", 
                values: ["Bersih dan Rapi", "Bersih", "Kurang Bersih"] 
                },
            };
            
            const data = {
                kondisi: kondisi
            }

            const validate = v.validate( data , schema);

            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            const user = await User.findByPk(req.user.userId);
            if (!user) return res.status(400).json(response(400, "User not found"));

            //! validasi hari piket WC
            const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            // sabtu minggu ikut disertakan karena untuk menghitung 
            const hariIni = namaHari[new Date().getDay()];
            if (user.hari_wc !== hariIni) {
                return res.status(400).json(response(400, `Bukan hari piket WC kamu. Jadwal kamu: ${user.hari_wc}`));
            }

            //! validasi minggu kesekian dalam siklus 4 minggu
            //! ((mingguSekarang - 1) % 4) + 1
            //  hasil selalu 1, 2, 3, atau 4 dan berulang
            const mingguSekarang = getWeekNumber(new Date());
            const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1;
            if (user.minggu_ke !== minggukeSiklus) {
                return res.status(400).json(response(400, `Bukan minggu piket WC kamu. Minggu piket kamu: ke-${user.minggu_ke} dalam siklus 4 minggu`));
            }

            //! cek apakah sudah submit minggu ini
            const now = new Date();
            const dayOfWeek = now.getDay();

            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() + diffToMonday);
            startOfWeek.setHours(0,0,0,0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);

            const existing = await SubmissionWc.findOne({
                where: {
                    user_id: req.user.userId,
                    tanggal_piket: { [Op.between]: [startOfWeek, endOfWeek] },
                    status: { [Op.ne]: 'Declined' }
                }
            });
            if (existing) {
                return res.status(400).json(response(400, "Kamu sudah submit piket WC minggu ini"));
            }

            const submission = await SubmissionWc.create({
                user_id: req.user.userId,
                tanggal_piket: new Date().toISOString().split('T')[0],
                //! tugas otomatis dari profil murid, bukan input manual
                tugas: user.tugas_wc,
                status: 'Pending',
                kondisi: kondisi,
            });

            return res.status(201).json(response(201, "created", submission));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getAllSubmissionsWc: async (req, res) => {
        try {
            const { page, limit, status } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            const { count, rows } = await SubmissionWc.findAndCountAll({
                where: status ? { status } : {},
                include: [
                    { model: User, as: 'User', attributes: { exclude: ['password'] } },
                    //! as: 'Reviewer' harus sama dengan alias di model SubmissionWc
                    // pakai alias karena SubmissionWc punya 2 relasi ke tabel users
                    // sequelize bingung yg mana kemana jadi pakai alias untuk kasih arahan 
                    { model: User, as: 'Reviewer', attributes: ['id', 'name'] }
                ],
                order: [['createdAt', 'DESC']],
                offset: Number(offset),
                limit: Number(limit),
            });

            const formatPagination = {
                data: rows,
                limit, rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count, page,
            };
            return res.status(200).json(response(200, "success", formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getMySubmissionWc: async (req, res) => {
        try {
            const { page, limit } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            const { count, rows } = await SubmissionWc.findAndCountAll({
                where: { user_id: req.user.userId },
                order: [['createdAt', 'DESC']],
                offset: Number(offset),
                limit: Number(limit),
            });

            const formatPagination = {
                data: rows,
                limit, rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count, page,
            };
            return res.status(200).json(response(200, "success", formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    updateStatusWc: async (req, res) => {
        try {
            const { id } = req.params;
            const { action, kondisi, alasan_decline } = req.body;

            const submission = await SubmissionWc.findByPk(id);
            if (!submission) return res.status(400).json(response(400, "Submission not found"));
            if (submission.status !== 'Pending') {
                return res.status(400).json(response(400, "Submission sudah diproses sebelumnya"));
            }

            let updateData = { reviewed_by: req.user.userId };

            if (action === 'accept') {
                if (!kondisi) return res.status(400).json(response(400, "Validasi Error", "kondisi wajib diisi saat accept"));
                updateData.status = 'Accepted';
                updateData.kondisi = kondisi;
            } else if (action === 'decline') {
                if (!alasan_decline) return res.status(400).json(response(400, "Validasi Error", "alasan_decline wajib diisi"));
                updateData.status = 'Declined';
                updateData.alasan_decline = alasan_decline;
            } else {
                return res.status(400).json(response(400, "Validasi Error", "action harus 'accept' atau 'decline'"));
            }

            await submission.update(updateData);
            const updated = await SubmissionWc.findByPk(id, {
                include: [
                    { model: User, as: 'User', attributes: { exclude: ['password'] } },
                    { model: User, as: 'Reviewer', attributes: ['id', 'name'] }
                ]
            });
            return res.status(200).json(response(200, "success", updated));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
};
