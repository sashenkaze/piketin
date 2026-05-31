const express = require('express')
const router = express.Router()

const { checkToken, checkRole } = require('../middlewares/auth')
const jenispekerjaanController = require('../controllers/jenispekerjaan.controller')
const upload = require('../middlewares/upload')

router.post('/', checkToken, checkRole('psrayon'), upload.none(), jenispekerjaanController.createJp)
//! GET diizinkan untuk psrayon dan murid — murid butuh daftar ini saat isi form absen
router.get('/', checkToken, checkRole(['psrayon', 'murid']), jenispekerjaanController.getAllJp)
router.get('/:id', checkToken, checkRole(['psrayon', 'murid']), jenispekerjaanController.getJpById)
router.put('/:id', checkToken, checkRole('psrayon'), upload.none(), jenispekerjaanController.updateJp)
router.delete('/:id', checkToken, checkRole('psrayon'), jenispekerjaanController.deleteJp)

module.exports = router
