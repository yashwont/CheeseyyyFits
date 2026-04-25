const wishlistModel = require('../models/wishlistModel');

exports.getWishlist = async (req, res) => {
  try {
    const items = await wishlistModel.getByUser(req.user.userId);
    res.json(items);
  } catch { res.status(500).json({ message: 'Failed to fetch wishlist' }); }
};

exports.toggle = async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await wishlistModel.find(req.user.userId, productId);
    if (existing) {
      await wishlistModel.remove(req.user.userId, productId);
      res.json({ wishlisted: false });
    } else {
      await wishlistModel.add(req.user.userId, productId);
      res.json({ wishlisted: true });
    }
  } catch { res.status(500).json({ message: 'Failed to update wishlist' }); }
};

exports.getIds = async (req, res) => {
  try {
    const ids = await wishlistModel.getProductIds(req.user.userId);
    res.json(ids);
  } catch { res.status(500).json({ message: 'Failed to fetch wishlist ids' }); }
};
