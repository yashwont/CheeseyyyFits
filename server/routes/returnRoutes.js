const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/returnController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.post('/', ctrl.create);
router.get('/my', ctrl.getMyReturns);
router.get('/', requireAdmin, ctrl.getAllReturns);
router.patch('/:id/status', requireAdmin, ctrl.updateStatus);

module.exports = router;
