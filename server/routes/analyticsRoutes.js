const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/summary', authenticate, requireAdmin, analyticsController.getSummary);

module.exports = router;
