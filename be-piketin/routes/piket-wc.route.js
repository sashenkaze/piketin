const express = require('express')
const router = express.Router()
const { checkToken, checkRole } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const piketWcController = require('../controllers/piket-wc.controller')

// route /stats harus di atas /:id — kalau di bawah, Express salah baca string "stats" sebagai nilai id
router.get('/stats', checkToken, checkRole('administrator'), piketWcController.getWcStats)
router.post('/', checkToken, checkRole('murid'), upload.none(), piketWcController.createSubmissionWc)
router.get('/', checkToken, checkRole('kokurikuler'), piketWcController.getAllSubmissionsWc)
router.get('/my', checkToken, checkRole('murid'), piketWcController.getMySubmissionWc)
router.put('/:id/status', checkToken, checkRole('kokurikuler'), upload.none(), piketWcController.updateStatusWc)

module.exports = router
