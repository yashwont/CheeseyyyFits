const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const { getDB } = require('../config/db');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT == 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (sql, p = []) => new Promise((res, rej) => getDB().get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

const RETURN_REASONS = ['Wrong size', 'Item damaged', 'Not as described', 'Changed my mind', 'Late delivery', 'Other'];

const STATUS_LABELS = {
  pending:   { label: 'Pending Review', color: '#888' },
  approved:  { label: 'Approved — Refund Issued', color: '#33cc33' },
  rejected:  { label: 'Rejected', color: '#ff4444' },
  completed: { label: 'Completed', color: '#4af' },
};

const sendReturnStatusEmail = async (email, username, returnId, orderId, status, total) => {
  const { label, color } = STATUS_LABELS[status] || { label: status, color: '#888' };
  const extra = status === 'approved'
    ? `<p style="color:#33cc33;margin:16px 0">A full refund of <strong>$${total.toFixed(2)}</strong> has been issued to your original payment method. It may take 5–10 business days to appear.</p>`
    : status === 'rejected'
    ? `<p style="color:#888;margin:16px 0">Unfortunately your return request was not approved. If you have questions, please contact our support team.</p>`
    : '';

  await transporter.sendMail({
    from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Return #${returnId} Update — ${label}`,
    html: `
      <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#ff0000;letter-spacing:4px;margin-bottom:4px">CHEEZEYY FITS</h1>
        <p style="color:#555;margin-bottom:32px">RETURN UPDATE</p>
        <h2 style="color:white;font-size:1.1rem">Hi ${username},</h2>
        <p style="color:#888;margin:12px 0">Your return request <strong style="color:white">Return #${returnId}</strong> for <strong style="color:white">Order #${orderId}</strong> has been updated.</p>
        <div style="border:1px solid #222;padding:16px 20px;margin:24px 0">
          <p style="margin:0;font-size:0.8rem;color:#555;letter-spacing:2px;text-transform:uppercase">Status</p>
          <p style="margin:6px 0 0;font-size:1.1rem;font-weight:bold;color:${color}">${label}</p>
        </div>
        ${extra}
        <p style="color:#555;font-size:0.8rem;margin-top:40px;text-align:center">
          CHEEZEYY FITS — Wear the attitude.
        </p>
      </div>`,
  });
};

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

    const ret = await get(
      `SELECT r.*, o.total, o.stripePaymentIntentId, u.email, u.username
       FROM returns r
       JOIN orders o ON r.orderId = o.id
       JOIN users u ON r.userId = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!ret) return res.status(404).json({ message: 'Return not found' });

    let refunded = !!ret.stripeRefundId;

    // Issue Stripe refund once when first approved
    if (status === 'approved' && !ret.stripeRefundId) {
      if (!ret.stripePaymentIntentId) {
        // Order predates payment intent tracking — just approve without refund
        console.warn(`Return #${req.params.id}: no stripePaymentIntentId on order, approving without refund`);
      } else {
        try {
          const refund = await stripe.refunds.create({ payment_intent: ret.stripePaymentIntentId });
          await run('UPDATE returns SET stripeRefundId = ? WHERE id = ?', [refund.id, req.params.id]);
          refunded = true;
        } catch (e) {
          console.error('Stripe refund error:', e.message);
          return res.status(500).json({ message: `Stripe refund failed: ${e.message}` });
        }
      }
    }

    await run('UPDATE returns SET status = ? WHERE id = ?', [status, req.params.id]);

    sendReturnStatusEmail(ret.email, ret.username, ret.id, ret.orderId, status, ret.total)
      .catch((e) => console.error('Return status email failed:', e.message));

    res.json({ message: 'Return status updated', refunded });
  } catch (e) {
    console.error('Update return status error:', e);
    res.status(500).json({ message: 'Failed to update return' });
  }
};

exports.RETURN_REASONS = RETURN_REASONS;
