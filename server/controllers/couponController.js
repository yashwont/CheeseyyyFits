const couponModel = require('../models/couponModel');

const validateCoupon = async (code, orderTotal) => {
  const coupon = await couponModel.findByCode(code);
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };
  if (!coupon.active) return { valid: false, message: 'Coupon is no longer active' };
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt))
    return { valid: false, message: 'Coupon has expired' };
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses)
    return { valid: false, message: 'Coupon usage limit reached' };
  if (orderTotal < coupon.minOrder)
    return { valid: false, message: `Minimum order of $${coupon.minOrder.toFixed(2)} required` };

  const discount =
    coupon.discountType === 'percentage'
      ? Math.min((orderTotal * coupon.discountValue) / 100, orderTotal)
      : Math.min(coupon.discountValue, orderTotal);

  return { valid: true, coupon, discount: Math.round(discount * 100) / 100 };
};

exports.validate = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code required' });
    const result = await validateCoupon(code, orderTotal ?? 0);
    if (!result.valid) return res.status(400).json({ message: result.message });
    res.json({
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discount: result.discount,
    });
  } catch { res.status(500).json({ message: 'Failed to validate coupon' }); }
};

exports.getAll = async (req, res) => {
  try { res.json(await couponModel.getAll()); }
  catch { res.status(500).json({ message: 'Failed to fetch coupons' }); }
};

exports.create = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrder, maxUses, expiresAt } = req.body;
    if (!code || !discountValue) return res.status(400).json({ message: 'Code and discount value required' });
    if (!['percentage', 'fixed'].includes(discountType))
      return res.status(400).json({ message: 'discountType must be percentage or fixed' });
    await couponModel.create({ code, discountType, discountValue, minOrder, maxUses, expiresAt });
    res.status(201).json({ message: 'Coupon created' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: 'Failed to create coupon' });
  }
};

exports.toggle = async (req, res) => {
  try {
    await couponModel.toggle(req.params.id);
    res.json({ message: 'Coupon status toggled' });
  } catch { res.status(500).json({ message: 'Failed to toggle coupon' }); }
};

exports.remove = async (req, res) => {
  try {
    await couponModel.delete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch { res.status(500).json({ message: 'Failed to delete coupon' }); }
};

module.exports.validateCoupon = validateCoupon;
