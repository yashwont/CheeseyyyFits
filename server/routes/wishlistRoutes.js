const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', wishlistController.getWishlist);
router.get('/ids', wishlistController.getIds);
router.post('/:productId', wishlistController.toggle);

module.exports = router;
