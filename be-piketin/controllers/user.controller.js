const Validator = require("fastest-validator");
const v = new Validator();
const { User, Submission } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op, where } = require("sequelize");
const passwordHash = require('password-hash')
const exceljs = require('exceljs')

module.exports = {
    //! stats untuk dashboard psrayon
    // endpoint: GET /users/stats
    // return: jumlah murid di rayon ini + jumlah submission pending hari ini
    getUserStats: async (req, res) => {
        try {
            const rayonId = req.user.rayon_id;
            const tanggalHariIni = new Date().toISOString().split('T')[0];

            //! Promise.all: 2 query jalan paralel, lebih efisien dari serial
            const [muridCount, pendingCount] = await Promise.all([
                // hitung murid di rayon psrayon ini
                User.count({ where: { role: 'murid', rayon_id: rayonId } }),
                // hitung submission pending hari ini dari murid rayon ini
                Submission.count({
                    where: { status: 'Pending', tanggal_piket: tanggalHariIni },
                    include: [{
                        model: User,
                        where: { rayon_id: rayonId },
                        attributes: []
                    }]
                })
            ]);

            return res.status(200).json(response(200, "success", {
                murid: muridCount,
                pending: pendingCount,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! stats piket hari ini untuk pie chart dashboard psrayon
    // endpoint: GET /users/piket-stats
    // return: { sudah_piket, belum_piket, total } — murid di rayon ini hari ini
    getPiketStats: async (req, res) => {
        try {
            const rayonId = req.user.rayon_id;
            const tanggalHariIni = new Date().toISOString().split('T')[0];

            //! ambil semua murid di rayon ini
            const totalMurid = await User.count({ where: { role: 'murid', rayon_id: rayonId } });

            //! hitung murid yang sudah submit Accepted hari ini
            const sudahPiket = await Submission.count({
                where: { status: 'Accepted', tanggal_piket: tanggalHariIni },
                include: [{
                    model: User,
                    where: { rayon_id: rayonId },
                    attributes: []
                }]
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

    createUser: async (req, res) => {
        try{
            // ambil input payload (req.body)
            const { name, nis, email, password, jadwal_piket, minggu_ke, hari_wc, tugas_wc } = req.body;

            // validasi
            const schema = {
                name: {type: "string"},
                nis: {type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                role: {type: "string"},
                jadwal_piket: {type: "enum", values: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']},
                minggu_ke: { type: "number", integer: true, min: 1, max: 4 },
                hari_wc: { type: "enum", values: ['Senin','Selasa','Rabu','Kamis','Jumat']},
                tugas_wc: { type: "enum", values: ['A','B'] }
            }
            // menyiapkan data yg akan divalidasi
            const data = {
                name: name, // fieldDatabase : namaDariReq
                nis: nis,
                email: email,
                password: password,
                role: 'murid',
                jadwal_piket: jadwal_piket,
                minggu_ke: Number(minggu_ke),
                //! iseng nyoba, kl nama properti obj dan variabel sama — JS otomatis baca kek hari_wc: hari_wc 
                hari_wc,
                tugas_wc
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // jika hasil validate ada error...
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            
            //! validasi email tidak double
            const existingEmail = await User.findOne({ where: { email: data.email } });
            if (existingEmail) {
                return res.status(400).json(response(400, "Validasi Error", "Email sudah digunakan"));
            }

            // proses menyimpan data melalui ORM sequelize
            const user = await User.create({
                name: data.name,
                nis: data.nis,
                email: data.email,
                password: passwordHash.generate(data.password),
                role: 'murid',
                jadwal_piket: data.jadwal_piket,
                rayon_id: req.user.rayon_id,
                minggu_ke: data.minggu_ke,
                hari_wc: data.hari_wc,
                tugas_wc: data.tugas_wc,
            });
            const { password: _, ...userData } = user.toJSON();
            //! password dipisah (direname jadi _ lalu diabaikan)
            //! sisanya dikumpulkan ke userData
            //! hasilnya userData berisi semua field KECUALI password
            return res.status(201).json(response(201, "created", userData));
        } catch(error) {
            // penanganan error kode di try
            // res : parameter func func untuk untuk memberikan response (hasil)
            // response : method dari helpers formatter untuk format hasil outputnya, output dalam bentuk json
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const { name, sortBy, order, page, limit } = req.query;

            const offset = (Number(page)-1) * Number(limit);

            const { count, rows } = await User.findAndCountAll({
                attributes: {
                    exclude: ['password'] //! sembunyikan password dri output
                },
                // cari berdasarkan field name di db dari name req.query
                where: {
                    role: 'murid',
                    rayon_id: req.user.rayon_id,
                    //! filter name hanya kalau ada, digabung ke where utama
                    ...(name ? { name: { [Op.like]: `%${name}%` } } : {})
                },
                // kl di params postman ada sortBy dan order, jalanin pengurutan, kl gk ada pake default, misal sortBy 'stock' order 'DESC'
                order: sortBy && order ? [[sortBy, order]] : [],
                offset: Number(offset),
                limit: Number(limit),
            });

            const formatPagination = {
                data: rows,
                limit: limit,
                rows: (Number(offset)+1) + "-" + (Number(offset)+rows.length),
                total: count,
                page: page, // sedang di halaman ke berapa
            }
            return res.status(200).json(response(200, "success", formatPagination));
        } catch(error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getUserById: async (req, res) => {
        try {
            // req.params : ambil path dinamis, /users/2. ambil angka 2 (id)
            const { id } = req.params;
            // fingByPk : mencari berdasarkan primary key (id)
            const user = await User.findByPk(id, {
                attributes: {
                    exclude: ['password'] //! sembunyikan password dri output
                }
            });
            // jika data yg dicari tidak ada di db (artinya angka id nya salah)
            if (!user) {
                return res.status(400).json(response(400, "Data [id] not found"));
            }
            if (user.rayon_id !== req.user.rayon_id) {
                return res.status(403).json(response(403, "forbidden", "You can't access students whose Rayon's different than yours!"));
            }
            return res.status(200).json(response(200, "success", user));
        } catch(error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, nis, email, password, jadwal_piket, minggu_ke, hari_wc, tugas_wc } = req.body;

            const schema = {
                name: {type: "string"},
                nis: {type: "string"},
                email: {type: "string"},
                jadwal_piket: {type: "enum", values: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']},
                minggu_ke: { type: "number", integer: true, min: 1, max: 4 },
                hari_wc: { type: "enum", values: ['Senin','Selasa','Rabu','Kamis','Jumat']},
                tugas_wc: { type: "enum", values: ['A','B'] }
            }
            const data = {
            name: name,
            nis: nis,
            email: email,
            jadwal_piket: jadwal_piket,
            minggu_ke: Number(minggu_ke),
                //! iseng nyoba, kl nama properti obj dan variabel sama — JS otomatis baca kek hari_wc: hari_wc 
                hari_wc,
                tugas_wc
            }
            const validate = v.validate(data, schema);  
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            const user = await User.findByPk(id);
            if(!user) {
                return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
            }
            if (user.rayon_id !== req.user.rayon_id) {
                return res.status(403).json(response(403, "forbidden", "You can't access students whose Rayon's different than yours!"));
            }
            const updateProcess = await user.update({
                name: data.name,
                nis: data.nis,
                email: data.email,
                jadwal_piket: data.jadwal_piket,
                rayon_id: req.user.rayon_id,
                minggu_ke: data.minggu_ke,
                hari_wc: data.hari_wc,
                tugas_wc: data.tugas_wc,
            });
            const newUser = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            });
            return res.status(200).json(response(200, "success", newUser));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
            }
            if (user.rayon_id !== req.user.rayon_id) {
                return res.status(403).json(response(403, "forbidden", "You can't access students whose Rayon's different than yours!"));
            }
            const deleteProcess = await User.destroy({
                where: {id: id}
            });
            return res.status(200).json(response(200, "deleted"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    //! untuk export data akun murid sbg psrayon ke excel
    // kolom: id, nama, nis, email, jadwal piket, minggu ke, hari wc, tugas wc
    exportUsers: async (req, res) => {
        try {
            const users = await User.findAll({
                where: { 
                    role: 'murid',
                    rayon_id: req.user.rayon_id
                },
                attributes: { exclude: ['password'] }
            });

            const workbook = new exceljs.Workbook();
            const sheet = workbook.addWorksheet('Daftar Murid');

            //! tambah kolom minggu_ke, hari_wc, tugas_wc dibanding versi lama
            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nama', key: 'name', width: 25 },
                { header: 'NIS', key: 'nis', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Jadwal Piket', key: 'jadwal_piket', width: 15 },
                { header: 'Minggu Ke', key: 'minggu_ke', width: 12 },
                { header: 'Hari WC', key: 'hari_wc', width: 15 },
                { header: 'Tugas WC', key: 'tugas_wc', width: 12 },
            ];

            users.forEach(user => sheet.addRow(user.toJSON()));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=daftar-murid.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}