const { getDB } = require('../config/db');

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (sql, p = []) => new Promise((res, rej) => getDB().get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

const RETURN_REASONS = ['Wrong size', 'Item damaged', 'Not as described', 'Changed my mind', 'Late delivery', 'Other'];

exports.create = async (req, res) => {
  try {
    const { orderId, reason, details } = req.body;
    if (!orderId || !reason) return res.status(400).json({ message: 'Order ID and reason required' });
    if (!RETURN_REASONS.includes(reason)) return res.status(400).json({ message: 'Invalid reason' });

    const order = await get('SELECT * FROM orders WHERE id = ? AND userId = ?', [orderId, req.user.userId]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['delivered', 'shipped'].includes(order.status))
      return res.status(400).json({ message: 'Can only return delivered or shipped orders' });

    const existing = await get('SELECT id FROM returns WHERE orderId = ? AND userId = ?', [orderId, req.user.userId]);
    if (existing) return res.status(409).json({ message: 'Return request already submitted for this order' });

    const result = await run(
      'INSERT INTO returns (userId, orderId, reason, details) VALUES (?, ?, ?, ?)',
      [req.user.userId, orderId, reason, details || '']
    );
    res.status(201).json({ message: 'Return request submitted', returnId: result.lastID });
  } catch { res.status(500).json({ message: 'Failed to submit return' }); }
};

exports.getMyReturns = async (req, res) => {
  try {
    const returns = await all(
      `SELECT r.*, o.total FROM returns r JOIN orders o ON r.orderId = o.id
       WHERE r.userId = ? ORDER BY r.createdAt DESC`,
      [req.user.userId]
    );
    res.json(returns);
  } catch { res.status(500).json({ message: 'Failed to fetch returns' }); }
};

exports.getAllReturns = async (req, res) => {
  try {
    const returns = await all(
      `SELECT r.*, u.username, u.email, o.total
       FROM returns r JOIN users u ON r.userId = u.id JOIN orders o ON r.orderId = o.id
       ORDER BY r.createdAt DESC`
    );
    res.json(returns);
  } catch { res.status(500).json({ message: 'Failed to fetch returns' }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'approved', 'rejected', 'completed'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    await run('UPDATE returns SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Return status updated' });
  } catch { res.status(500).json({ message: 'Failed to update return' }); }
};

exports.RETURN_REASONS = RETURN_REASONS;
