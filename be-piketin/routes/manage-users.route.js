const express = require('express')
const router = express.Router()
const { checkToken, checkRole } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const manageUsersController = require('../controllers/manage-users.controller')

//! administrator CRUD psrayon & kokurikuler
// route /stats dan /export harus di atas /:id — kalau di bawah, Express salah baca string sebagai nilai id
router.get('/stats', checkToken, checkRole('administrator'), manageUsersController.getUserStats)
router.get('/export', checkToken, checkRole('administrator'), manageUsersController.exportManagedUsers)
router.get('/export-rayons', checkToken, checkRole('administrator'), manageUsersController.exportRayons)
router.post('/', checkToken, checkRole('administrator'), upload.none(), manageUsersController.createManagedUser)
router.get('/', checkToken, checkRole('administrator'), manageUsersController.getAllManagedUsers)
router.get('/:id', checkToken, checkRole('administrator'), manageUsersController.getManagedUserById)
router.put('/:id', checkToken, checkRole('administrator'), upload.none(), manageUsersController.updateManagedUser)
router.delete('/:id', checkToken, checkRole('administrator'), manageUsersController.deleteManagedUser)

module.exports = router
