const Validator = require("fastest-validator");
const v = new Validator();
const { User } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op, where } = require("sequelize");
const passwordHash = require('password-hash')
const exceljs = require('exceljs')

module.exports = {
    createUser: async (req, res) => {
        try{
            // ambil input payload (req.body)
            const { name, nis, email, password, jadwal_piket } = req.body;

            // validasi
            const schema = {
                name: {type: "string"},
                nis: {type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                role: {type: "string"},
                jadwal_piket: {type: "enum", values: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']}
            }
            // menyiapkan data yg akan divalidasi
            const data = {
                name: name, // fieldDatabase : namaDariReq
                nis: nis,
                email: email,
                password: password,
                role: 'murid',
                jadwal_piket: jadwal_piket
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // jika hasil validate ada error...
                return res.status(400).json(response(400, "Validasi Error", validate));
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
            return res.status(200).json(response(200, "success", user));
        } catch(error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, nis, email, password, jadwal_piket } = req.body;

            const schema = {
                name: {type: "string"},
                nis: {type: "string"},
                email: {type: "string"},
                jadwal_piket: {type: "enum", values: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']},
            }
            const data = {
            name: name,
            nis: nis,
            email: email,
            jadwal_piket: jadwal_piket
            }
            const validate = v.validate(data, schema);  
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            const user = await User.findByPk(id);
            if(!user) {
                return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
            }
            const updateProcess = await user.update({
                name: data.name,
                nis: data.nis,
                email: data.email,
                jadwal_piket: data.jadwal_piket,
                rayon_id: req.user.rayon_id,
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
            const deleteProcess = await User.destroy({
                where: {id: id}
            });
            return res.status(200).json(response(200, "deleted"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    //! untuk export data akun murid sbg psrayon ke excel
    exportUsers: async (req, res) => {
        try {
            const users = await User.findAll({
                where: { 
                    role: 'murid',
                    rayon_id: req.user.rayon_id
                },
                attributes: { exclude: ['password'] }
            });

            //! exceljs.Workbook() : bawaan package exceljs utk membuat file excel baru di memory
            // 1 workbook = 1 file
            const workbook = new exceljs.Workbook();

            //! addWorksheet() : menambah sheet/tab baru di dalam file excel
            const sheet = workbook.addWorksheet('Daftar Murid'); // parameter Daftar Murid hanya untuk nama sheet yg akan muncul nanti

            //! sheet.columns : bawaan exceljs utk define kolom header excel
            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nama', key: 'name', width: 25 },
                { header: 'NIS', key: 'nis', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Jadwal Piket', key: 'jadwal_piket', width: 15 },
            ]

            //! addRow() : menambah 1 baris data ke sheet
            // key di sheet.columns dicocokin ke key object yang dilempar ke addRow()
            // toJSON() : ubah sequelize instance ke json dulu sebelum dimasukkan
            users.forEach(user => sheet.addRow(user.toJSON()));

            //! setHeader : response supaya browser/postman tau ini tuh file excel dan bukan json
            // Content-Type : memberitahu tipe file yang dikirim berupa format excel
            // Content-Disposition : memberitahu browser untuk download file, bukan tampilkan di layar
            // 'attachment' = download, filename = nama file hasil download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=daftar-murid.xlsx');

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