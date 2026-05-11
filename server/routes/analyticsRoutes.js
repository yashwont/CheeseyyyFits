const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/summary', authenticate, requireAdmin, analyticsController.getSummary);
router.get('/search', authenticate, requireAdmin, analyticsController.getSearchAnalytics);

module.exports = router;
