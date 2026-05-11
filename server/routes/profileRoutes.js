const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.use(authenticate);

router.get('/me', profileController.getProfile);
router.patch('/me', profileController.updateProfile);
router.patch('/me/password', profileController.changePassword);
router.post('/me/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);

// Admin-only user management
router.get('/users', requireAdmin, profileController.getAllUsers);
router.patch('/users/:id/role', requireAdmin, profileController.updateUserRole);

module.exports = router;
