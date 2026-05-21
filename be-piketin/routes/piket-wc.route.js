const express = require('express')
const router = express.Router()
const { checkToken, checkRole } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const piketWcController = require('../controllers/piket-wc.controller')

router.post('/', checkToken, checkRole('murid'), upload.none(), piketWcController.createSubmissionWc)
router.get('/', checkToken, checkRole('kokurikuler'), piketWcController.getAllSubmissionsWc)
router.get('/my', checkToken, checkRole('murid'), piketWcController.getMySubmissionWc)
router.put('/:id/status', checkToken, checkRole('kokurikuler'), upload.none(), piketWcController.updateStatusWc)

module.exports = router