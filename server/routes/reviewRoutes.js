const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', reviewController.getReviews);
router.post('/', authenticate, reviewController.upsertReview);
router.delete('/mine', authenticate, reviewController.deleteMyReview);
router.delete('/:id', authenticate, requireAdmin, reviewController.deleteReview);

module.exports = router;
