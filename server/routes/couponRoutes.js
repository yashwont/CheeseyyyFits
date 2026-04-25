const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/validate', authenticate, couponController.validate);
router.get('/', authenticate, requireAdmin, couponController.getAll);
router.post('/', authenticate, requireAdmin, couponController.create);
router.patch('/:id/toggle', authenticate, requireAdmin, couponController.toggle);
router.delete('/:id', authenticate, requireAdmin, couponController.remove);

module.exports = router;
