const express = require('express')
const router = express.Router()
const { checkToken, checkRole } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const manageUsersController = require('../controllers/manage-users.controller')

//! administrator CRUD psrayon & kokurikuler
// router.post('/', checkToken, checkRole('administrator'), upload.none(), manageUsersController.createManagedUser)
// router.get('/', checkToken, checkRole('administrator'), manageUsersController.getAllManagedUsers)
// router.get('/:id', checkToken, checkRole('administrator'), manageUsersController.getManagedUserById)
// router.put('/:id', checkToken, checkRole('administrator'), upload.none(), manageUsersController.updateManagedUser)
// router.delete('/:id', checkToken, checkRole('administrator'), manageUsersController.deleteManagedUser)

module.exports = router