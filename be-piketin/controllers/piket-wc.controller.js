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
// 
module.exports = {
    createSubmissionWc: async (req, res) => {
        try {
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
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

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
                status: 'Pending'
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