const Validator = require("fastest-validator");
const v = new Validator();
const { JenisPekerjaan } = require('../models')
const { response } = require('../helpers/response.formatter')
const { Op } = require("sequelize");

module.exports = {
    createJp: async (req, res) => {
        try{
            // ambil input payload (req.body)
            const { nama_pekerjaan } = req.body;

            // validasi
            const schema = {
                nama_pekerjaan: {type: "string"},
            }
            // menyiapkan data yg akan divalidasi
            const data = {
                nama_pekerjaan: nama_pekerjaan, // fieldDatabase : namaDariReq
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // jika hasil validate ada error...
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            //! kalau buat data baru dengan nama sama
            if (await JenisPekerjaan.findOne({ 
                where: { nama_pekerjaan } 
            })) 
            return res.status(400).json(response(400, "Pekerjaan sudah ada"));

            // proses menyimpan data melalui ORM sequelize
            const jp = await JenisPekerjaan.create({
                nama_pekerjaan: data.nama_pekerjaan,
            });
            return res.status(201).json(response(201, "created", jp));
        } catch(error) {
            // penanganan error kode di try
            // res : parameter func func untuk untuk memberikan response (hasil)
            // response : method dari helpers formatter untuk format hasil outputnya, output dalam bentuk json
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    getAllJp: async (req, res) => {
        try {
            const { nama_pekerjaan, sortBy, order, page, limit } = req.query;

            const offset = (Number(page)-1) * Number(limit);

            const { count, rows } = await JenisPekerjaan.findAndCountAll({
                // cari berdasarkan field name di db dari name req.query
                where: nama_pekerjaan ? {
                    nama_pekerjaan: {
                        [Op.like]: `%${nama_pekerjaan}%` // mencari yg mirip
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
    getJpById: async (req, res) => {
        try {
            // req.params : ambil path dinamis, /jenis-pekerjaan/2. ambil angka 2 (id)
            const { id } = req.params;
            // findByPk : mencari berdasarkan primary key (id)
            const jp = await JenisPekerjaan.findByPk(id);
            // jika data yg dicari tidak ada di db (artinya angka id nya salah)
            if (!jp) {
                return res.status(400).json(response(400, "Data [id] not found"));
            }
            return res.status(200).json(response(200, "success", jp));
        } catch(error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    updateJp: async (req, res) => {
        try {
            const { id } = req.params;
            const { nama_pekerjaan } = req.body;

            const schema = {
                nama_pekerjaan: {type: "string"},
            }
            const data = {
                nama_pekerjaan: nama_pekerjaan,
            }
            const validate = v.validate(data, schema);  
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            const jp = await JenisPekerjaan.findByPk(id);
            if(!jp) {
                return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
            }
            const updateProcess = await jp.update({
                nama_pekerjaan: data.nama_pekerjaan,
            });
            const newJp = await JenisPekerjaan.findByPk(id);
            return res.status(200).json(response(200, "success", newJp));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
    deleteJp: async (req, res) => {
        try {
            const { id } = req.params;

            const jp = await JenisPekerjaan.findByPk(id);
            if (!jp) {
                return res.status(400).json(response(400, 'Validasi Error', "Data not found"));
            }
            const deleteProcess = await JenisPekerjaan.destroy({
                where: {id: id}
            });
            return res.status(200).json(response(200, "deleted"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}