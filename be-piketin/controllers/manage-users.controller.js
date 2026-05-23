const Validator = require("fastest-validator");
const v = new Validator();
const { User, Rayon } = require('../models')
const { response } = require('../helpers/response.formatter')
const passwordHash = require('password-hash')

module.exports = {
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
            const { name, sortBy, order, page, limit } = req.query;
            
            const offset = (Number(page)-1) * Number(limit);
            
            const { count, rows } = await User.findAndCountAll({
                attributes: {
                    exclude: ['password'] //! sembunyikan password dri output
                },
                where: {
                    //! Op.in : filter value where dr array ini
                    role: { [Op.in]: ['psrayon', 'kokurikuler']},
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
    }
}