const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validate');

router.get('/export', authenticate, requireAdmin, productController.exportCSV);
router.post('/bulk', authenticate, requireAdmin, productController.bulkAction);
router.get('/autocomplete', productController.autocomplete);
router.post('/search-track', productController.trackSearch);
router.get('/restocked', productController.getRestocked);
router.get('/', productController.getAll);
router.get('/:id', productController.getOne);
router.get('/:id/related', productController.getFrequentlyBoughtTogether);
router.post('/', authenticate, requireAdmin, validateProduct, productController.create);
router.put('/:id', authenticate, requireAdmin, validateProduct, productController.update);
router.delete('/:id', authenticate, requireAdmin, productController.remove);

module.exports = router;
