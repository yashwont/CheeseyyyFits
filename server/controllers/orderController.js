const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const { getDB } = require('../config/db');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await cartModel.getByUser(userId);
    if (!items.length) return res.status(400).json({ message: 'Cart is empty' });
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await orderModel.create(userId, total);
    for (const item of items) {
      await orderModel.addItem(order.lastID, item.productId, item.name, item.price, item.quantity, item.size);
    }
    await cartModel.clearCart(userId);
    res.status(201).json({ message: 'Order placed', orderId: order.lastID, total });
  } catch { res.status(500).json({ message: 'Checkout failed' }); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel.getByUser(req.user.userId);
    const withItems = await Promise.all(
      orders.map(async (o) => ({ ...o, items: await orderModel.getItemsByOrder(o.id) }))
    );
    res.json(withItems);
  } catch { res.status(500).json({ message: 'Failed to fetch orders' }); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders();
    const withItems = await Promise.all(
      orders.map(async (o) => ({ ...o, items: await orderModel.getItemsByOrder(o.id) }))
    );
    res.json(withItems);
  } catch { res.status(500).json({ message: 'Failed to fetch orders' }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await orderModel.updateStatus(req.params.id, status);
    res.json({ message: 'Order status updated' });
  } catch { res.status(500).json({ message: 'Failed to update order status' }); }
};

exports.exportCSV = async (req, res) => {
  try {
    const orders = await all(
      `SELECT o.id, u.username, u.email, o.total, o.discount, o.couponCode,
              o.status, o.createdAt,
              GROUP_CONCAT(oi.name || ' x' || oi.quantity, ' | ') as items
       FROM orders o
       JOIN users u ON o.userId = u.id
       LEFT JOIN order_items oi ON oi.orderId = o.id
       GROUP BY o.id
       ORDER BY o.createdAt DESC`
    );
    const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Discount', 'Coupon', 'Status', 'Items', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      `"${(o.username || '').replace(/"/g, '""')}"`,
      o.email,
      o.total,
      o.discount || 0,
      o.couponCode || '',
      o.status,
      `"${(o.items || '').replace(/"/g, '""')}"`,
      o.createdAt,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch { res.status(500).json({ message: 'Export failed' }); }
};
