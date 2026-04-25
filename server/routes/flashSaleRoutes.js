const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/flashSaleController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/active', ctrl.getActive);
router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.patch('/:id/toggle', authenticate, requireAdmin, ctrl.toggle);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
