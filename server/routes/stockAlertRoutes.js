const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockAlertController');

router.post('/subscribe', ctrl.subscribe);

module.exports = router;
