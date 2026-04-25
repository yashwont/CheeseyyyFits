const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, requireAdmin, upload.single('image'), uploadController.uploadImage);
router.delete('/', authenticate, requireAdmin, uploadController.deleteImage);

module.exports = router;
