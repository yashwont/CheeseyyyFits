const { getDB } = require('../config/db');

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => { if (err) reject(err); else resolve(row || null); });
  });

const wishlistModel = {
  getByUser: (userId) =>
    all(
      `SELECT w.id, w.productId, p.name, p.price, p.image, p.category, p.size, p.stock,
              COALESCE(AVG(r.rating), 0) as avgRating, COUNT(r.id) as reviewCount
       FROM wishlist w
       JOIN products p ON w.productId = p.id
       LEFT JOIN reviews r ON r.productId = p.id
       WHERE w.userId = ?
       GROUP BY w.id`,
      [userId]
    ),

  find: (userId, productId) =>
    get('SELECT id FROM wishlist WHERE userId = ? AND productId = ?', [userId, productId]),

  add: (userId, productId) =>
    run('INSERT OR IGNORE INTO wishlist (userId, productId) VALUES (?, ?)', [userId, productId]),

  remove: (userId, productId) =>
    run('DELETE FROM wishlist WHERE userId = ? AND productId = ?', [userId, productId]),

  getProductIds: (userId) =>
    all('SELECT productId FROM wishlist WHERE userId = ?', [userId]).then((rows) =>
      rows.map((r) => r.productId)
    ),
};

module.exports = wishlistModel;
