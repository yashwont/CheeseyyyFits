const { getDB } = require('../config/db');

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });

const productModel = {
  create: (data) => {
    const { name, description, price, image, category, size, stock, model3dUrl, images } = data;
    return run(
      'INSERT INTO products (name, description, price, image, category, size, stock, model3dUrl, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, image, category, size, stock ?? 0, model3dUrl ?? null, images ?? null]
    );
  },

  findAll: ({ search, category, minPrice, maxPrice, size } = {}) => {
    // ... (logic remains same, just ensuring p.* is selected which includes images)
    const conditions = [];
    const params = [];

    if (search) {
      // Fuzzy: split into words, each word must match somewhere
      const words = search.trim().split(/\s+/);
      words.forEach((w) => {
        conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
        params.push(`%${w}%`, `%${w}%`, `%${w}%`);
      });
    }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (minPrice !== undefined) { conditions.push('price >= ?'); params.push(minPrice); }
    if (maxPrice !== undefined) { conditions.push('price <= ?'); params.push(maxPrice); }
    if (size) { conditions.push('size LIKE ?'); params.push(`%${size}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    // Attach badge logic, best seller rank, reviews, and active flash sale price
    return all(
      `SELECT p.*,
        CASE
          WHEN p.createdAt >= datetime('now', '-7 days') THEN 'New Arrival'
          WHEN p.stock = 0 THEN NULL
          ELSE NULL
        END as badge,
        COALESCE(bs.unitsSold, 0) as unitsSold,
        COALESCE(r.avgRating, 0) as avgRating,
        COALESCE(r.reviewCount, 0) as reviewCount,
        fs.salePrice,
        fs.saleEndsAt
       FROM products p
       LEFT JOIN (
         SELECT productId, SUM(quantity) as unitsSold
         FROM order_items oi JOIN orders o ON oi.orderId = o.id
         WHERE o.status != 'cancelled'
         GROUP BY productId
       ) bs ON bs.productId = p.id
       LEFT JOIN (
         SELECT productId, AVG(rating) as avgRating, COUNT(*) as reviewCount
         FROM reviews GROUP BY productId
       ) r ON r.productId = p.id
       LEFT JOIN (
         SELECT productId, MIN(salePrice) as salePrice, MIN(endsAt) as saleEndsAt
         FROM flash_sales
         WHERE active = 1 AND datetime(startsAt) <= datetime('now') AND datetime(endsAt) > datetime('now')
         GROUP BY productId
       ) fs ON fs.productId = p.id
       ${where}
       ORDER BY p.createdAt DESC`,
      params
    );
  },

  findById: (id) => get('SELECT * FROM products WHERE id = ?', [id]),

  update: (id, data) => {
    const { name, description, price, image, category, size, stock, model3dUrl, images } = data;
    return run(
      'UPDATE products SET name=?, description=?, price=?, image=?, category=?, size=?, stock=?, model3dUrl=?, images=? WHERE id=?',
      [name, description, price, image, category, size, stock, model3dUrl ?? null, images ?? null, id]
    );
  },

  delete: (id) => run('DELETE FROM products WHERE id = ?', [id]),
};

module.exports = productModel;
