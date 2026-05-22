const Validator = require("fastest-validator");
const v = new Validator();
const { Rayon } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op } = require("sequelize");

module.exports = {
    createRayon: async (req, res) => {
        try {
            const { nama_rayon } = req.body;
            
            const schema = {
                nama_rayon: {type: "string"},
            }
            
            const data = {
                nama_rayon: nama_rayon,
            }
            
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            
            if (await Rayon.findOne({ 
                where: { nama_rayon } 
            })) 
            return res.status(400).json(response(400, "Rayon sudah ada"));
            
            const rayon = await Rayon.create({
                nama_rayon: data.nama_rayon,
            });
            return res.status(201).json(response(201, "created", rayon));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getAllRayon: async (req, res) => {
            try {
                const { nama_rayon, sortBy, order, page, limit } = req.query;
    
                const offset = (Number(page)-1) * Number(limit);
    
                const { count, rows } = await Rayon.findAndCountAll({
                    // cari berdasarkan field name di db dari name req.query
                    where: nama_rayon ? {
                        nama_rayon: {
                            [Op.like]: `%${nama_rayon}%` // mencari yg mirip
                        } 
                    } : {}, // cari berdasarkan field name di db dari name req.query
                    // kl di params postman ada sortBy dan order, jalanin pengurutan, kl gk ada pake default, misal sortBy 'stock' order 'DESC'
                    order: sortBy && order ? [
                        [sortBy, order] 
                    ] : [],
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
        getRayonById: async (req, res) => {
            try {
                // req.params : ambil path dinamis, /users/2. ambil angka 2 (id)
                const { id } = req.params;
                // fingByPk : mencari berdasarkan primary key (id)
                const rayon = await Rayon.findByPk(id);
                // jika data yg dicari tidak ada di db (artinya angka id nya salah)
                if (!rayon) {
                    return res.status(400).json(response(400, "Data [id] not found"));
                }
                return res.status(200).json(response(200, "success", rayon));
            } catch(error) {
                return res.status(500).json(response(500, "Server Error", error.message));
            }
        },
        updateRayon: async (req, res) => {
            try {
                const { id } = req.params;
                const { nama_rayon } = req.body;
    
                const schema = {
                    nama_rayon: {type: "string"},
                }
                const data = {
                    nama_rayon: nama_rayon,
                }
                const validate = v.validate(data, schema);  
                if (validate.length > 0) {
                    return res.status(400).json(response(400, "Validasi Error", validate));
                }
                const rayon = await Rayon.findByPk(id);
                if(!rayon) {
                    return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
                }
                const updateProcess = await rayon.update({
                    nama_rayon: data.nama_rayon,
                });
                const newRayon = await Rayon.findByPk(id);
                return res.status(200).json(response(200, "success", newRayon));
            } catch (error) {
                return res.status(500).json(response(500, "Server Error", error.message));
            }
        },
        deleteRayon: async (req, res) => {
            try {
                const { id } = req.params;
                
                const rayon = await Rayon.findByPk(id);
                if (!rayon) {
                    return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
                }
                const deleteProcess = await Rayon.destroy({
                    where: {id: id}
                });
                return res.status(200).json(response(200, "deleted"));
            } catch (error) {
                return res.status(500).json(response(500, "Server Error", error.message));
            }
        }
}