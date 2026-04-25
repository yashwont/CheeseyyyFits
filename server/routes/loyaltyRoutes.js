const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/loyaltyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getLoyalty);
router.post('/redeem', ctrl.redeemPoints);

module.exports = router;
