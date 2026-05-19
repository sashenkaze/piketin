const express = require('express')
const router = express.Router()

const { checkToken, checkRole } = require('../middlewares/auth')
const userController = require('../controllers/user.controller')
const upload = require('../middlewares/upload')

const exceljs = require('exceljs')

router.post('/', checkToken, checkRole('admin'), upload.none(), userController.createUser)
router.get('/', checkToken, checkRole('admin'), userController.getAllUsers)
//! route export data user (murid)
router.get('/export', checkToken, checkRole('admin'), userController.exportUsers) 
router.get('/:id', checkToken, checkRole('admin'), userController.getUserById)
router.put('/:id', checkToken, checkRole('admin'), upload.none(), userController.updateUser)
router.delete('/:id', checkToken, checkRole('admin'), userController.deleteUser)

module.exports = router
