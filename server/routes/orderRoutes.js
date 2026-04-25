const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.post('/checkout', orderController.checkout);
router.get('/my', orderController.getMyOrders);
router.get('/export', requireAdmin, orderController.exportCSV);
router.get('/', requireAdmin, orderController.getAllOrders);
router.patch('/:id/status', requireAdmin, orderController.updateStatus);

module.exports = router;
