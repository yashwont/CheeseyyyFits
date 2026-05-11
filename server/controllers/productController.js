const productModel = require('../models/productModel');
const { notifyRestocked } = require('./stockAlertController');
const { getDB } = require('../config/db');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
  });

exports.getAll = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, size } = req.query;
    const products = await productModel.findAll({
      search, category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      size,
    });
    res.json(products);
  } catch { res.status(500).json({ message: 'Failed to fetch products' }); }
};

exports.getOne = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch { res.status(500).json({ message: 'Failed to fetch product' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, price, image, category, size, stock, model3dUrl } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required' });
    const result = await productModel.create({ name, description, price, image, category, size, stock, model3dUrl });
    res.status(201).json({ message: 'Product created', productId: result.lastID });
  } catch { res.status(500).json({ message: 'Failed to create product' }); }
};

exports.update = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, description, price, image, category, size, stock, model3dUrl } = req.body;
    const wasOutOfStock = product.stock === 0;
    const newStock = stock ?? product.stock;

    await productModel.update(req.params.id, {
      name: name ?? product.name,
      description: description ?? product.description,
      price: price ?? product.price,
      image: image ?? product.image,
      category: category ?? product.category,
      size: size ?? product.size,
      stock: newStock,
      model3dUrl: model3dUrl !== undefined ? model3dUrl : (product.model3dUrl ?? null),
    });

    // Trigger back-in-stock alerts if stock went from 0 to positive
    if (wasOutOfStock && newStock > 0) {
      notifyRestocked(req.params.id, product.name).catch(console.error);
      run(`UPDATE products SET lastRestockedAt = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]).catch(() => {});
    }

    // Trigger price-drop alerts if price went down
    if (price !== undefined && price < product.price) {
      const { notifyPriceDrop } = require('./priceAlertController');
      notifyPriceDrop(req.params.id, product.name, price).catch(console.error);
    }

    res.json({ message: 'Product updated' });
  } catch { res.status(500).json({ message: 'Failed to update product' }); }
};

exports.remove = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await productModel.delete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete product' }); }
};

exports.getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { id } = req.params;
    // Find products that appear in same orders as this product, ranked by co-occurrence
    const related = await all(
      `SELECT p.id, p.name, p.price, p.image, p.category, p.size, p.stock,
              COUNT(*) as coCount
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.orderId = oi2.orderId AND oi2.productId != oi1.productId
       JOIN products p ON p.id = oi2.productId
       WHERE oi1.productId = ?
       GROUP BY oi2.productId
       ORDER BY coCount DESC
       LIMIT 4`,
      [id]
    );
    res.json(related);
  } catch { res.status(500).json({ message: 'Failed to fetch related products' }); }
};

exports.bulkAction = async (req, res) => {
  try {
    const { ids, action, value } = req.body;
    if (!ids?.length || !action) return res.status(400).json({ message: 'ids and action required' });

    if (action === 'discount') {
      const pct = parseFloat(value);
      if (isNaN(pct) || pct <= 0 || pct >= 100) return res.status(400).json({ message: 'Invalid discount percentage' });
      for (const id of ids) {
        const p = await productModel.findById(id);
        if (p) await productModel.update(id, { ...p, price: Math.round(p.price * (1 - pct / 100) * 100) / 100 });
      }
      res.json({ message: `${pct}% discount applied to ${ids.length} products` });

    } else if (action === 'category') {
      await run(
        `UPDATE products SET category = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
        [value, ...ids]
      );
      res.json({ message: `Category updated for ${ids.length} products` });

    } else if (action === 'delete') {
      await run(
        `DELETE FROM products WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      res.json({ message: `${ids.length} products deleted` });

    } else {
      res.status(400).json({ message: 'Unknown action' });
    }
  } catch { res.status(500).json({ message: 'Bulk action failed' }); }
};

exports.getRestocked = async (req, res) => {
  try {
    const products = await all(
      `SELECT p.*, COALESCE(r.avgRating, 0) as avgRating
       FROM products p
       LEFT JOIN (
         SELECT productId, AVG(rating) as avgRating FROM reviews GROUP BY productId
       ) r ON r.productId = p.id
       WHERE p.lastRestockedAt >= datetime('now', '-7 days') AND p.stock > 0
       ORDER BY p.lastRestockedAt DESC LIMIT 8`
    );
    res.json(products);
  } catch { res.status(500).json({ message: 'Failed to fetch restocked products' }); }
};

exports.autocomplete = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 1) return res.json({ products: [], trending: [] });

    const term = q.toLowerCase();
    const products = await all(
      `SELECT id, name, category, price, image FROM products
       WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?
       ORDER BY (CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END), name
       LIMIT 6`,
      [`%${term}%`, `%${term}%`, `${term}%`]
    );

    const trending = await all(
      `SELECT query FROM trending_searches
       WHERE LOWER(query) LIKE ? ORDER BY count DESC LIMIT 4`,
      [`${term}%`]
    );

    res.json({ products, trending: trending.map((t) => t.query) });
  } catch {
    res.json({ products: [], trending: [] });
  }
};

exports.trackSearch = async (req, res) => {
  try {
    const q = (req.body.q || '').trim().toLowerCase().slice(0, 80);
    if (q.length < 2) return res.json({ ok: true });
    await run(`INSERT OR IGNORE INTO trending_searches (query, count) VALUES (?, 0)`, [q]);
    await run(`UPDATE trending_searches SET count = count + 1, updatedAt = CURRENT_TIMESTAMP WHERE query = ?`, [q]);
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY createdAt DESC');
    const headers = ['ID', 'Name', 'Category', 'Size', 'Price', 'Stock', 'Description', 'Image', 'Created At'];
    const rows = products.map((p) => [
      p.id, `"${(p.name || '').replace(/"/g, '""')}"`,
      p.category || '', p.size || '',
      p.price, p.stock,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.image || '',
      p.createdAt,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch { res.status(500).json({ message: 'Export failed' }); }
};
