const Validator = require("fastest-validator");
const v = new Validator();
const { User, Rayon } = require('../models')
const { response } = require('../helpers/response.formatter')
const passwordHash = require('password-hash')
const { Op } = require('sequelize');
const exceljs = require('exceljs');

module.exports = {
    //! endpoint baru: hitung jumlah user per role untuk dashboard admin
    // Promise.all : jalankan semua promise secara paralel (bersamaan), bukan satu-satu
    // artinya 3 query COUNT ini jalan sekaligus ke DB, bukan nunggu satu selesai baru query berikutnya
    // hasilnya dikembalikan sebagai array sesuai urutan promise yang dimasukkan
    getUserStats: async (req, res) => {
        try {
            const [psrayonCount, kokurikulerCount, muridCount] = await Promise.all([
                User.count({ where: { role: 'psrayon' } }),
                User.count({ where: { role: 'kokurikuler' } }),
                User.count({ where: { role: 'murid' } }),
            ]);

            return res.status(200).json(response(200, "success", {
                psrayon: psrayonCount,
                kokurikuler: kokurikulerCount,
                murid: muridCount,
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    createManagedUser: async (req, res) => {
        try {
            const { name, email, password, role, rayon_id } = req.body;
            
            const schema = {
                name: {type: "string"},
                email: {type: "string"},
                password: {type: "string"},
                role: {type: "enum", values: ['psrayon', 'kokurikuler']},
                rayon_id: {type: "number", integer: true, positive: true, optional: true}
            }
            
            const data = {
                name,
                email,
                password,
                role,
                rayon_id: role == 'psrayon' ? Number(rayon_id) : null
            }
            
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            
            const existingEmail = await User.findOne({ where: { email: data.email } });
            if (existingEmail) {
                return res.status(400).json(response(400, "Validasi Error", "Email sudah digunakan"));
                }
            
            //! psrayon wajib punya rayon id
            if (data.role === 'psrayon' && !rayon_id) {
                return res.status(400).json(response(400, "Validasi Error", "rayon_id wajib diisi untuk role psrayon"));
            }
            
            const managedUser = await User.create({
                name: data.name,
                email: data.email,
                password: passwordHash.generate(data.password),
                role: data.role,
                rayon_id: data.rayon_id
            });
            
            const { password: _, ...userData } = managedUser.toJSON();
            return res.status(201).json(response(201, "created", userData));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getAllManagedUsers: async (req, res) => {
        try {
            const { name, sortBy, order, page, limit, role } = req.query;
            
            const offset = (Number(page)-1) * Number(limit);

            //! kalau ada query param role, filter by role itu. kalau gak ada, tampilkan psrayon & kokurikuler
            const allowedRoles = ['psrayon', 'kokurikuler'];
            const roleFilter = role && allowedRoles.includes(role)
                ? role
                : { [Op.in]: allowedRoles };
            
            const { count, rows } = await User.findAndCountAll({
                attributes: {
                    exclude: ['password'] //! sembunyikan password dri output
                },
                where: {
                    role: roleFilter,
                    ...(name ? { name: { [Op.like]: `%${name}%` } } : {})
                },
                include: [{ model: Rayon }], // tampilkan data rayon untuk [srayon]
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
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getManagedUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [{ model: Rayon }]
            });
            //! error kl blm login dan bukan
            if (!user || !['psrayon', 'kokurikuler'].includes(user.role)) {
                return res.status(400).json(response(400, "Data [id] not found"));
            }
            return res.status(200).json(response(200, "success", user));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    updateManagedUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role, rayon_id } = req.body;
            
            const schema = {
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "enum", values: ['psrayon', 'kokurikuler'] },
                rayon_id: { type: "number", integer: true, positive: true, optional: true }
            }

            const data = {
                name, email, role,
                rayon_id: role === 'psrayon' ? Number(rayon_id) : null
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }   

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(400).json(response(400, "Data not found"));
            }
            
            await user.update(data);
            const updated = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [{ model: Rayon }]
            })
            return res.status(200).json(response(200, "success", updated));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    deleteManagedUser: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(400).json(response(400, "Data not found"));
            }
            await User.destroy({ where: { id } });
            return res.status(200).json(response(200, "deleted"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! export daftar psrayon & kokurikuler ke excel — untuk admin
    // query param role opsional: kalau ada, filter by role. kalau tidak ada, export semua
    // kolom: id, nama, email, role, nama rayon (kalau psrayon)
    exportManagedUsers: async (req, res) => {
        try {
            const { role } = req.query;

            //! filter by role kalau ada query param, kalau tidak export semua
            const allowedRoles = ['psrayon', 'kokurikuler'];
            const whereRole = role && allowedRoles.includes(role)
                ? role
                : { [Op.in]: allowedRoles };

            const users = await User.findAll({
                where: { role: whereRole },
                attributes: { exclude: ['password'] },
                include: [{ model: Rayon }],
                order: [['role', 'ASC'], ['name', 'ASC']]
            });

            //! nama file dan sheet menyesuaikan role yang diexport
            const sheetName = role === 'psrayon' ? 'Daftar PS Rayon'
                : role === 'kokurikuler' ? 'Daftar Kokurikuler'
                : 'Daftar PS Rayon & Kokurikuler';
            const fileName = role === 'psrayon' ? 'daftar-psrayon.xlsx'
                : role === 'kokurikuler' ? 'daftar-kokurikuler.xlsx'
                : 'daftar-managed-users.xlsx';

            const workbook = new exceljs.Workbook();
            const sheet = workbook.addWorksheet(sheetName);

            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nama', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Nama Rayon', key: 'nama_rayon', width: 25 },
            ];

            //! data dari relasi Rayon tidak bisa langsung di-addRow — perlu diambil manual
            users.forEach(user => {
                const u = user.toJSON();
                sheet.addRow({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    nama_rayon: u.Rayon?.nama_rayon || '-', //* kokurikuler tidak punya rayon
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    //! export daftar rayon ke excel — untuk admin
    // kolom: id, nama rayon
    exportRayons: async (req, res) => {
        try {
            const rayons = await Rayon.findAll({ order: [['id', 'ASC']] });

            const workbook = new exceljs.Workbook();
            const sheet = workbook.addWorksheet('Daftar Rayon');

            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nama Rayon', key: 'nama_rayon', width: 30 },
            ];

            rayons.forEach(rayon => sheet.addRow(rayon.toJSON()));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=daftar-rayon.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}
