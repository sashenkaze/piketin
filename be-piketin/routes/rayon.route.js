const express = require('express')
const router = express.Router()
const { checkToken, checkRole } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const rayonController = require('../controllers/rayon.controller')

router.post('/', checkToken, checkRole('administrator'), upload.none(), rayonController.createRayon)
router.get('/', checkToken, checkRole('administrator'), rayonController.getAllRayon)
router.get('/:id', checkToken, checkRole('administrator'), rayonController.getRayonById)
router.put('/:id', checkToken, checkRole('administrator'), upload.none(), rayonController.updateRayon)
router.delete('/:id', checkToken, checkRole('administrator'), rayonController.deleteRayon)

module.exports = router