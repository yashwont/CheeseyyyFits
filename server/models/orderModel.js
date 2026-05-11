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

const orderModel = {
  create: (userId, total, discount = 0, couponCode = null, paymentIntentId = null, status = 'confirmed', paymentMethod = 'stripe') =>
    run(
      'INSERT INTO orders (userId, total, discount, couponCode, status, stripePaymentIntentId, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, total, discount, couponCode, status, paymentIntentId, paymentMethod]
    ),

  addItem: (orderId, productId, name, price, quantity, size) =>
    run(
      'INSERT INTO order_items (orderId, productId, name, price, quantity, size) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, productId, name, price, quantity, size ?? null]
    ),

  getByUser: (userId) =>
    all('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [userId]),

  getItemsByOrder: (orderId) =>
    all('SELECT * FROM order_items WHERE orderId = ?', [orderId]),

  getAllOrders: () =>
    all(
      `SELECT o.*, u.username, u.email
       FROM orders o JOIN users u ON o.userId = u.id
       ORDER BY o.createdAt DESC`
    ),

  updateStatus: (id, status) =>
    run('UPDATE orders SET status = ? WHERE id = ?', [status, id]),

  findById: (id) => get('SELECT * FROM orders WHERE id = ?', [id]),
};

module.exports = orderModel;
