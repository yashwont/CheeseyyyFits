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

const reviewModel = {
  getByProduct: (productId) =>
    all(
      `SELECT r.*, u.username
       FROM reviews r JOIN users u ON r.userId = u.id
       WHERE r.productId = ?
       ORDER BY r.createdAt DESC`,
      [productId]
    ),

  getSummary: (productId) =>
    get(
      `SELECT COALESCE(AVG(rating), 0) as avgRating, COUNT(*) as total
       FROM reviews WHERE productId = ?`,
      [productId]
    ),

  findByUser: (userId, productId) =>
    get('SELECT * FROM reviews WHERE userId = ? AND productId = ?', [userId, productId]),

  upsert: (userId, productId, rating, comment) =>
    run(
      `INSERT INTO reviews (userId, productId, rating, comment) VALUES (?, ?, ?, ?)
       ON CONFLICT(userId, productId) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, createdAt = CURRENT_TIMESTAMP`,
      [userId, productId, rating, comment]
    ),

  delete: (id) => run('DELETE FROM reviews WHERE id = ?', [id]),

  deleteByUser: (userId, productId) =>
    run('DELETE FROM reviews WHERE userId = ? AND productId = ?', [userId, productId]),
};

module.exports = reviewModel;
