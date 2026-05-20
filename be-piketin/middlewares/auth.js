const jwt = require('jsonwebtoken')
const { response } = require('../helpers/response.formatter')
const { auth_secret } = require('../config/base.config')

module.exports = {
    checkToken: async (req, res, next) => {
        const token = req.header("Authorization");
        if (!token) {
            // 401 : err untuk pengguna yg blm llogin (unauthorized)
            return res.status(401).json(response(401, "unauthorized", "Please login and try again!"));
        }

        try {
            // cek token aktif atau nggak (blm expired)
            const check = jwt.verify(token, auth_secret);
            // karena nanti pengguna perlu data identitas pengguna (userId atau yg lain), panggil payload yg dikirim jwt.sign() di logincontroller. data payload tersimpan di const check (hasil verify), data payloaad yg di jwt.sign {userId,name,email}
            req.user = check;
            next();
        } catch(error) {
            // jika terjadi error, ini hubungannya dengan token. jd kasi 401 (suruh login lagi)
            return res.status(401).json(response(401, "unauthorized", "Please login and try again!"));
        }
    },

    // cek role psrayon/user(murid). dipanggil setelah checkToken 
    checkRole: (role) => {
        return (req, res, next) => {
            // kalau role user yg login gak sesuai dengan role yg diizinkan, kasih response 403 dan sebaliknya
            if (req.user.role !== role) {
                return res.status(403).json(response(403, "forbidden", "Access denied!"));
            }
            next();
        }
    }
}