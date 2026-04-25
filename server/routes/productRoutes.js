const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/export', authenticate, requireAdmin, productController.exportCSV);
router.post('/bulk', authenticate, requireAdmin, productController.bulkAction);
router.get('/', productController.getAll);
router.get('/:id', productController.getOne);
router.get('/:id/related', productController.getFrequentlyBoughtTogether);
router.post('/', authenticate, requireAdmin, productController.create);
router.put('/:id', authenticate, requireAdmin, productController.update);
router.delete('/:id', authenticate, requireAdmin, productController.remove);

module.exports = router;
