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

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    getDB().run(sql, params, function (e) { e ? reject(e) : resolve(this); })
  );

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    getDB().get(sql, params, (e, r) => (e ? reject(e) : resolve(r || null)))
  );

/**
 * Core fulfillment logic — called by both webhook and confirmOrder.
 * Returns { orderId, total, alreadyFulfilled } or throws on hard errors.
 * Idempotent: safe to call twice for the same paymentIntentId.
 */
const fulfillStripeOrder = async (paymentIntent, io) => {
  const paymentIntentId = paymentIntent.id;
  const userId = parseInt(paymentIntent.metadata.userId, 10);
  const discount = parseFloat(paymentIntent.metadata.discount ?? '0');
  const couponCode = paymentIntent.metadata.couponCode || null;

  // Idempotency — if the order already exists, nothing to do
  const existing = await dbGet('SELECT id, total FROM orders WHERE stripePaymentIntentId = ?', [paymentIntentId]);
  if (existing) return { orderId: existing.id, total: existing.total, alreadyFulfilled: true };

  const items = await cartModel.getByUser(userId);
  if (!items.length) throw Object.assign(new Error('Cart already processed'), { cartEmpty: true });

  // Final stock gate
  for (const item of items) {
    const row = await dbGet('SELECT stock FROM products WHERE id = ?', [item.productId]);
    if (!row || row.stock < item.quantity) {
      throw Object.assign(
        new Error(`Sorry, "${item.name}" sold out while you were checking out.`),
        { productId: item.productId, stockError: true }
      );
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(subtotal - discount, 0);

  await dbRun('BEGIN');
  let orderId;
  try {
    const order = await orderModel.create(userId, total, discount, couponCode, paymentIntentId);
    orderId = order.lastID;
    for (const item of items) {
      await orderModel.addItem(orderId, item.productId, item.name, item.price, item.quantity, item.size);
      await decreaseStock(item.productId, item.quantity);
    }
    if (couponCode) await couponModel.incrementUse(couponCode);
    await cartModel.clearCart(userId);
    await dbRun('COMMIT');
  } catch (e) {
    await dbRun('ROLLBACK').catch(() => {});
    throw e;
  }

  // Non-blocking post-commit side-effects
  for (const item of items) {
    getDB().get('SELECT stock FROM products WHERE id = ?', [item.productId], (_, row) => {
      io?.emit('stock_update', { productId: item.productId, stock: row?.stock ?? 0 });
    });
  }
  awardPoints(userId, total).catch((e) => console.error('Loyalty points error:', e.message));
  getDB().get('SELECT username, email FROM users WHERE id = ?', [userId], (err, user) => {
    if (!err && user) {
      sendThankYouEmail(user.email, user.username, orderId, items, total, discount)
        .catch((e) => console.error('Thank you email failed:', e.message));
    }
  });

  return { orderId, total, alreadyFulfilled: false };
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { couponCode } = req.body;

    const items = await cartModel.getByUser(userId);
    if (!items.length) return res.status(400).json({ message: 'Cart is empty' });

    for (const item of items) {
      const product = await dbGet('SELECT name, stock FROM products WHERE id = ?', [item.productId]);
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
      if (!result.valid) return res.status(400).json({ message: result.message });
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
      couponApplied: appliedCoupon
        ? { code: appliedCoupon.code, discountType: appliedCoupon.discountType, discountValue: appliedCoupon.discountValue }
        : null,
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

    const { orderId, total } = await fulfillStripeOrder(paymentIntent, req.app.locals.io);
    res.status(201).json({ message: 'Order placed', orderId, total });
  } catch (err) {
    if (err.stockError) return res.status(400).json({ message: err.message, productId: err.productId });
    if (err.cartEmpty) return res.status(400).json({ message: 'Cart already processed' });
    console.error('Confirm order error:', err.message);
    res.status(500).json({ message: 'Failed to confirm order' });
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Respond to Stripe immediately — fulfillment runs async
  res.json({ received: true });

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    fulfillStripeOrder(paymentIntent, req.app.locals.io).then(({ orderId, alreadyFulfilled }) => {
      if (!alreadyFulfilled) console.log(`Webhook fulfilled order #${orderId} for PI ${paymentIntent.id}`);
    }).catch((err) => {
      console.error(`Webhook fulfillment failed for PI ${paymentIntent.id}:`, err.message);
    });
  }
};
