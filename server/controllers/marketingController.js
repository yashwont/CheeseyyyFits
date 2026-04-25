const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT == 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

exports.sendBlast = async (req, res) => {
  try {
    const { subject, body, segment } = req.body;
    if (!subject || !body) return res.status(400).json({ message: 'Subject and body required' });

    let users;
    if (segment === 'buyers') {
      users = await all(
        `SELECT DISTINCT u.email, u.username FROM users u
         JOIN orders o ON o.userId = u.id WHERE u.isVerified = 1`
      );
    } else if (segment === 'non-buyers') {
      users = await all(
        `SELECT u.email, u.username FROM users u
         WHERE u.isVerified = 1
           AND u.id NOT IN (SELECT DISTINCT userId FROM orders)`
      );
    } else {
      users = await all('SELECT email, username FROM users WHERE isVerified = 1');
    }

    if (!users.length) return res.status(400).json({ message: 'No recipients found' });

    const html = `
      <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#ff0000;letter-spacing:4px;margin-bottom:4px">CHEEZEYY FITS</h1>
        <div style="border-top:1px solid #222;margin:24px 0"></div>
        <div style="color:#ccc;line-height:1.7;white-space:pre-line">${body}</div>
        <div style="border-top:1px solid #222;margin-top:32px;padding-top:16px">
          <a href="http://localhost:5173" style="display:inline-block;padding:12px 32px;background:red;color:black;font-weight:bold;text-decoration:none;letter-spacing:2px">SHOP NOW</a>
        </div>
        <p style="color:#333;font-size:0.75rem;margin-top:24px">© 2026 CHEEZEYY FITS</p>
      </div>`;

    let sent = 0, failed = 0;
    for (const user of users) {
      try {
        await transporter.sendMail({ from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
        sent++;
      } catch { failed++; }
    }

    res.json({ message: `Sent to ${sent} users`, sent, failed, total: users.length });
  } catch (e) {
    console.error('Marketing blast error:', e.message);
    res.status(500).json({ message: 'Failed to send emails' });
  }
};

exports.getSocialProof = async (req, res) => {
  try {
    const recent = await all(
      `SELECT u.username, p.name as productName, o.createdAt
       FROM orders o
       JOIN users u ON o.userId = u.id
       JOIN order_items oi ON oi.orderId = o.id
       JOIN products p ON p.id = oi.productId
       WHERE o.status != 'cancelled'
       ORDER BY o.createdAt DESC
       LIMIT 10`
    );
    res.json(recent);
  } catch { res.status(500).json({ message: 'Failed' }); }
};
