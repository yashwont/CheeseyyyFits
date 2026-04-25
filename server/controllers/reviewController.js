const reviewModel = require('../models/reviewModel');
const productModel = require('../models/productModel');

exports.getReviews = async (req, res) => {
  try {
    const [reviews, summary] = await Promise.all([
      reviewModel.getByProduct(req.params.productId),
      reviewModel.getSummary(req.params.productId),
    ]);
    res.json({ reviews, avgRating: Math.round(summary.avgRating * 10) / 10, total: summary.total });
  } catch { res.status(500).json({ message: 'Failed to fetch reviews' }); }
};

exports.upsertReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await reviewModel.upsert(req.user.userId, productId, rating, comment || '');
    const summary = await reviewModel.getSummary(productId);
    res.json({ message: 'Review saved', avgRating: Math.round(summary.avgRating * 10) / 10, total: summary.total });
  } catch { res.status(500).json({ message: 'Failed to save review' }); }
};

exports.deleteReview = async (req, res) => {
  try {
    await reviewModel.delete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete review' }); }
};

exports.deleteMyReview = async (req, res) => {
  try {
    await reviewModel.deleteByUser(req.user.userId, req.params.productId);
    res.json({ message: 'Review deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete review' }); }
};
