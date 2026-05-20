const express = require('express')
const router = express.Router()

const { checkToken, checkRole } = require('../middlewares/auth')
const userController = require('../controllers/user.controller')
const upload = require('../middlewares/upload')

const exceljs = require('exceljs')

router.post('/', checkToken, checkRole('psrayon'), upload.none(), userController.createUser)
router.get('/', checkToken, checkRole('psrayon'), userController.getAllUsers)
//! route export data user (murid)
router.get('/export', checkToken, checkRole('psrayon'), userController.exportUsers) 
router.get('/:id', checkToken, checkRole('psrayon'), userController.getUserById)
router.put('/:id', checkToken, checkRole('psrayon'), upload.none(), userController.updateUser)
router.delete('/:id', checkToken, checkRole('psrayon'), userController.deleteUser)

module.exports = router
