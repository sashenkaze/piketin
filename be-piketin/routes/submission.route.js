const express = require('express')
const router = express.Router()

const { checkToken, checkRole } = require('../middlewares/auth')
const submissionController = require('../controllers/submission.controller')
const upload = require('../middlewares/upload')

//! upload.fields() : upload lebih dari 1 file sekaligus dgn nama field beda
//! berbeda dr upload.single() untuk 1 file aja
router.post('/', checkToken, checkRole('murid'), upload.fields([
    { name: 'foto_sebelum', maxCount: 1 },
    { name: 'foto_sesudah', maxCount: 1 },
]), submissionController.createSubmission)
router.get('/', checkToken, checkRole('psrayon'), submissionController.getAllSubmissions)
router.get('/my', checkToken, checkRole('murid'), submissionController.getMySubmission)
//! route export dan stats harus di atas /:id — kalau di bawah, Express salah baca string sebagai id
router.get('/piket-stats', checkToken, checkRole('administrator'), submissionController.getPiketRayonStats)
router.get('/export', checkToken, checkRole('psrayon'), submissionController.exportSubmissions)
router.put('/:id/status', checkToken, checkRole('psrayon'), upload.none(), submissionController.updateStatus)

module.exports = router