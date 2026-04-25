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

const cartModel = {
  getByUser: (userId) =>
    all(
      `SELECT ci.id, ci.quantity, ci.size,
              p.id as productId, p.name, p.price, p.image, p.category, p.stock
       FROM cart_items ci
       JOIN products p ON ci.productId = p.id
       WHERE ci.userId = ?`,
      [userId]
    ),

  addItem: (userId, productId, quantity, size) =>
    run(
      `INSERT INTO cart_items (userId, productId, quantity, size)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(userId, productId, size) DO UPDATE SET quantity = quantity + excluded.quantity`,
      [userId, productId, quantity, size ?? null]
    ),

  updateQuantity: (id, userId, quantity) =>
    run('UPDATE cart_items SET quantity = ? WHERE id = ? AND userId = ?', [quantity, id, userId]),

  removeItem: (id, userId) =>
    run('DELETE FROM cart_items WHERE id = ? AND userId = ?', [id, userId]),

  clearCart: (userId) =>
    run('DELETE FROM cart_items WHERE userId = ?', [userId]),

  getItem: (id, userId) =>
    get('SELECT * FROM cart_items WHERE id = ? AND userId = ?', [id, userId]),

  getItemByProduct: (userId, productId, size) =>
    get(
      'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND (size = ? OR (size IS NULL AND ? IS NULL))',
      [userId, productId, size, size]
    ),
};

module.exports = cartModel;
