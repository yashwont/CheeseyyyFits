const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validate');

router.post('/register', validateRegister, authController.registerUser);
router.post('/login', validateLogin, authController.loginUser);
router.post('/verify', authController.verifyUser);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;
