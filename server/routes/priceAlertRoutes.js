const express = require('express');
const router = express.Router();
const priceAlertController = require('../controllers/priceAlertController');

router.post('/subscribe', priceAlertController.subscribe);

module.exports = router;
