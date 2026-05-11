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
    const { email, productId, thresholdPrice } = req.body;
    if (!email || !productId || !thresholdPrice)
      return res.status(400).json({ message: 'email, productId, and thresholdPrice required' });

    await run(
      `INSERT INTO price_alerts (email, productId, thresholdPrice) VALUES (?, ?, ?)
       ON CONFLICT(email, productId) DO UPDATE SET thresholdPrice = excluded.thresholdPrice, notified = 0`,
      [email, productId, thresholdPrice]
    );
    res.json({ message: `We'll email you when this drops below $${thresholdPrice}` });
  } catch { res.status(500).json({ message: 'Failed to subscribe to price drop' }); }
};

exports.notifyPriceDrop = async (productId, productName, newPrice) => {
  try {
    const alerts = await all(
      'SELECT * FROM price_alerts WHERE productId = ? AND notified = 0 AND thresholdPrice >= ?',
      [productId, newPrice]
    );
    if (!alerts.length) return;

    for (const alert of alerts) {
      await transporter.sendMail({
        from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
        to: alert.email,
        subject: `Price drop alert: ${productName} is now $${newPrice}`,
        html: `
          <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <h1 style="color:#ff0000;letter-spacing:4px">CHEEZEYY FITS</h1>
            <h2 style="color:white;margin:20px 0 10px">Price Drop!</h2>
            <p style="color:#888">"${productName}" just dropped to <strong style="color:#33cc33">$${newPrice}</strong> — your alert threshold of $${alert.thresholdPrice} has been triggered.</p>
            <a href="http://localhost:5173/dashboard" style="display:inline-block;margin-top:24px;padding:12px 32px;background:red;color:black;font-weight:bold;text-decoration:none;letter-spacing:2px">SHOP NOW</a>
            <p style="color:#444;font-size:0.75rem;margin-top:32px">You received this because you signed up for a price drop alert.</p>
          </div>`,
      }).catch((e) => console.error('Price drop email failed:', e.message));

      await run('UPDATE price_alerts SET notified = 1 WHERE id = ?', [alert.id]);
    }
  } catch (e) { console.error('Price drop notify error:', e.message); }
};
