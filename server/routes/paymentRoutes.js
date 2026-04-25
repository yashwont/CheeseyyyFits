const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Webhook must receive raw body — mounted separately in index.js
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

router.post('/create-intent', authenticate, paymentController.createPaymentIntent);
router.post('/confirm', authenticate, paymentController.confirmOrder);

module.exports = router;
