const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');

exports.getCart = async (req, res) => {
  try {
    const items = await cartModel.getByUser(req.user.userId);
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock === 0) return res.status(400).json({ message: 'This item is out of stock' });

    // Check how many are already in cart for this product+size combo
    const existing = await cartModel.getItemByProduct(req.user.userId, productId, size ?? null);
    const currentQty = existing?.quantity ?? 0;
    const requestedTotal = currentQty + quantity;

    if (requestedTotal > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} in stock. You already have ${currentQty} in your cart.`,
        available: product.stock - currentQty,
      });
    }

    await cartModel.addItem(req.user.userId, productId, quantity, size);
    res.json({ message: 'Item added to cart' });
  } catch {
    res.status(500).json({ message: 'Failed to add item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ message: 'quantity must be >= 1' });

    const item = await cartModel.getItem(req.params.id, req.user.userId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });

    // Validate against current stock
    const product = await productModel.findById(item.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} in stock`,
        available: product.stock,
      });
    }

    await cartModel.updateQuantity(req.params.id, req.user.userId, quantity);
    res.json({ message: 'Quantity updated' });
  } catch {
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const item = await cartModel.getItem(req.params.id, req.user.userId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });

    await cartModel.removeItem(req.params.id, req.user.userId);
    res.json({ message: 'Item removed' });
  } catch {
    res.status(500).json({ message: 'Failed to remove item' });
  }
};
