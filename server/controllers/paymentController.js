const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');
const couponModel = require('../models/couponModel');
const { validateCoupon } = require('./couponController');
const { awardPoints } = require('./loyaltyController');
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

const sendThankYouEmail = async (email, username, orderId, items, total, discount) => {
  const itemRows = items.map((i) =>
    `<tr><td style="padding:6px 0;color:#ccc">${i.name}${i.size ? ` (${i.size})` : ''}</td>
     <td style="padding:6px 0;color:#ccc;text-align:right">x${i.quantity}</td>
     <td style="padding:6px 0;color:#ff0000;text-align:right">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('');

  await transporter.sendMail({
    from: `"CHEEZEYY FITS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${orderId} Confirmed — Thanks for shopping with us!`,
    html: `
      <div style="background:#0a0a0a;color:white;padding:40px;font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#ff0000;letter-spacing:4px;margin-bottom:4px">CHEEZEYY FITS</h1>
        <p style="color:#555;margin-bottom:32px">ORDER CONFIRMED</p>
        <h2 style="color:white;font-size:1.1rem">Hi ${username},</h2>
        <p style="color:#888;margin:12px 0 24px">Your order <strong style="color:white">#${orderId}</strong> has been confirmed and is being prepared.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #222;margin-bottom:16px">
          ${itemRows}
        </table>
        ${discount > 0 ? `<p style="color:#33cc33;text-align:right;margin:0">Discount: -$${discount.toFixed(2)}</p>` : ''}
        <p style="color:white;font-weight:bold;font-size:1.1rem;text-align:right;border-top:1px solid #222;padding-top:12px;margin-top:8px">
          Total: <span style="color:#ff0000">$${total.toFixed(2)}</span>
        </p>
        <p style="color:#555;font-size:0.8rem;margin-top:40px;text-align:center">
          You'll get another email when your order ships.<br>CHEEZEYY FITS — Wear the attitude.
        </p>
      </div>`,
  });
};

const decreaseStock = (productId, quantity) =>
  new Promise((resolve, reject) => {
    // Only decrease if stock >= quantity — prevents overselling
    getDB().run(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantity, productId, quantity],
      function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error(`Insufficient stock for product ${productId}`));
        resolve(this);
      }
    );
  });

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { couponCode } = req.body;

    const items = await cartModel.getByUser(userId);
    if (!items.length) return res.status(400).json({ message: 'Cart is empty' });

    // Validate stock for every cart item before charging
    for (const item of items) {
      const product = await new Promise((resolve, reject) => {
        getDB().get('SELECT name, stock FROM products WHERE id = ?', [item.productId], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `"${item.name}" only has ${product?.stock ?? 0} left in stock but your cart has ${item.quantity}. Please update your cart.`,
          productId: item.productId,
        });
      }
    }

    let subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const result = await validateCoupon(couponCode, subtotal);
      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }
      discount = result.discount;
      appliedCoupon = result.coupon;
    }

    const total = Math.max(subtotal - discount, 0);
    const amountInCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String(userId),
        couponCode: appliedCoupon?.code ?? '',
        discount: String(discount),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal,
      discount,
      total,
      couponApplied: appliedCoupon ? { code: appliedCoupon.code, discountType: appliedCoupon.discountType, discountValue: appliedCoupon.discountValue } : null,
    });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not completed' });
    if (paymentIntent.metadata.userId !== String(userId))
      return res.status(403).json({ message: 'Unauthorized' });

    const items = await cartModel.getByUser(userId);
    if (!items.length) return res.status(400).json({ message: 'Cart already processed' });

    // Final stock gate — catches race conditions between payment and fulfillment
    for (const item of items) {
      const row = await new Promise((resolve, reject) => {
        getDB().get('SELECT stock FROM products WHERE id = ?', [item.productId], (err, r) => {
          if (err) reject(err); else resolve(r);
        });
      });
      if (!row || row.stock < item.quantity) {
        return res.status(400).json({
          message: `Sorry, "${item.name}" sold out while you were checking out. Please update your cart.`,
          productId: item.productId,
        });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = parseFloat(paymentIntent.metadata.discount ?? '0');
    const couponCode = paymentIntent.metadata.couponCode || null;
    const total = Math.max(subtotal - discount, 0);

    const order = await orderModel.create(userId, total, discount, couponCode, paymentIntentId);

    for (const item of items) {
      await orderModel.addItem(order.lastID, item.productId, item.name, item.price, item.quantity, item.size);
      await decreaseStock(item.productId, item.quantity);
      // Emit real-time stock update
      const updatedStock = await new Promise((resolve) => {
        getDB().get('SELECT stock FROM products WHERE id = ?', [item.productId], (_, row) => resolve(row?.stock ?? 0));
      });
      req.app.locals.io?.emit('stock_update', { productId: item.productId, stock: updatedStock });
    }

    if (couponCode) await couponModel.incrementUse(couponCode);
    await cartModel.clearCart(userId);
    // Award loyalty points (non-blocking)
    awardPoints(userId, total).catch((e) => console.error('Loyalty points error:', e.message));

    // Send thank you email (non-blocking)
    getDB().get('SELECT username, email FROM users WHERE id = ?', [userId], (err, user) => {
      if (!err && user) {
        sendThankYouEmail(user.email, user.username, order.lastID, items, total, discount)
          .catch((e) => console.error('Thank you email failed:', e.message));
      }
    });

    res.status(201).json({ message: 'Order placed', orderId: order.lastID, total });
  } catch (err) {
    console.error('Confirm order error:', err.message);
    res.status(500).json({ message: 'Failed to confirm order' });
  }
};

exports.webhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'payment_intent.succeeded') {
    console.log('PaymentIntent succeeded via webhook:', event.data.object.id);
  }
  res.json({ received: true });
};
