const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const all = (sql, p = []) => new Promise((res, rej) => getDB().all(sql, p, (e, r) => e ? rej(e) : res(r)));
const run = (sql, p = []) => new Promise((res, rej) => getDB().run(sql, p, function(e) { e ? rej(e) : res(this); }));

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT == 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

exports.subscribe = async (req, res) => {
  try {
    const { email, productId } = req.body;
    if (!email || !productId) return res.status(400).json({ message: 'Email and productId required' });
    await run(
      'INSERT OR IGNORE INTO stock_alerts (email, productId) VALUES (?, ?)',
      [email, productId]
    );
    res.json({ message: 'You will be notified when this item is back in stock' });
  } catch { res.status(500).json({ message: 'Failed to subscribe' }); }
};

exports.notifyRestocked = async (productId, productName) => {
  try {
    const alerts = await all(
      'SELECT * FROM stock_alerts WHERE productId = ? AND notified = 0',
      [productId]
    );
    if (!alerts.length) return;

    for (const alert of alerts) {
      await transporter.sendMail({
        from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
        to: alert.email,
        subject: `${productName} is back in stock!`,
        html: `
          <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <h1 style="color:#ff0000;letter-spacing:4px">CHEEZEYY FITS</h1>
            <h2 style="color:white;margin:20px 0 10px">It's Back!</h2>
            <p style="color:#888">"${productName}" you were watching is back in stock. Grab it before it sells out again.</p>
            <a href="http://localhost:5173/dashboard" style="display:inline-block;margin-top:24px;padding:12px 32px;background:red;color:black;font-weight:bold;text-decoration:none;letter-spacing:2px">SHOP NOW</a>
            <p style="color:#444;font-size:0.75rem;margin-top:32px">You received this because you signed up for a stock alert.</p>
          </div>`,
      }).catch((e) => console.error('Stock alert email failed:', e.message));

      await run('UPDATE stock_alerts SET notified = 1 WHERE id = ?', [alert.id]);
    }
  } catch (e) { console.error('Stock alert notify error:', e.message); }
};
