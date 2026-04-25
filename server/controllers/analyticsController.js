const { getDB } = require('../config/db');

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => { if (err) reject(err); else resolve(row || {}); });
  });

exports.getSummary = async (req, res) => {
  try {
    const [revenue, orders, users, topProducts, dailyRevenue, statusBreakdown] = await Promise.all([
      get(`SELECT COALESCE(SUM(total - COALESCE(discount,0)), 0) as total,
                  COALESCE(SUM(discount), 0) as totalDiscount
           FROM orders WHERE status != 'cancelled'`),

      get(`SELECT COUNT(*) as total,
                  SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) as confirmed,
                  SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) as processing,
                  SUM(CASE WHEN status='shipped' THEN 1 ELSE 0 END) as shipped,
                  SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as delivered,
                  SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled
           FROM orders`),

      get(`SELECT COUNT(*) as total,
                  SUM(CASE WHEN isVerified=1 THEN 1 ELSE 0 END) as verified
           FROM users WHERE role != 'admin'`),

      all(`SELECT p.name, p.image, p.category,
                  SUM(oi.quantity) as unitsSold,
                  SUM(oi.quantity * oi.price) as revenue
           FROM order_items oi
           JOIN products p ON oi.productId = p.id
           JOIN orders o ON oi.orderId = o.id
           WHERE o.status != 'cancelled'
           GROUP BY oi.productId
           ORDER BY revenue DESC
           LIMIT 5`),

      all(`SELECT DATE(createdAt) as date,
                  SUM(total - COALESCE(discount,0)) as revenue,
                  COUNT(*) as orders
           FROM orders
           WHERE status != 'cancelled'
             AND createdAt >= DATE('now', '-30 days')
           GROUP BY DATE(createdAt)
           ORDER BY date ASC`),

      all(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
    ]);

    res.json({ revenue, orders, users, topProducts, dailyRevenue, statusBreakdown });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};
