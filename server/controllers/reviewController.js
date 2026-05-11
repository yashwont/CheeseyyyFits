const reviewModel = require('../models/reviewModel');
const productModel = require('../models/productModel');
const { getDB } = require('../config/db');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const [reviews, summary] = await Promise.all([
      reviewModel.getByProduct(productId),
      reviewModel.getSummary(productId),
    ]);

    // Cross-check userIds against order_items for verified-buyer flag
    const buyerRows = await all(
      `SELECT DISTINCT o.userId
       FROM orders o JOIN order_items oi ON oi.orderId = o.id
       WHERE oi.productId = ? AND o.status != 'cancelled'`,
      [productId]
    );
    const buyerIds = new Set(buyerRows.map((r) => r.userId));
    const enriched = reviews.map((r) => ({ ...r, isVerifiedBuyer: buyerIds.has(r.userId) }));

    res.json({ reviews: enriched, avgRating: Math.round(summary.avgRating * 10) / 10, total: summary.total });
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
