const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketingController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/social-proof', ctrl.getSocialProof);
router.post('/blast', authenticate, requireAdmin, ctrl.sendBlast);

module.exports = router;
