import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPaymentIntent, confirmOrder, fetchCart } from '../api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

type CartItem = {
  id: number; productId: number; name: string;
  price: number; quantity: number; size: string; image: string;
};

function CheckoutForm({ total, onSuccess }: { total: number; onSuccess: (orderId: number) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message ?? 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const result = await confirmOrder(paymentIntent.id);
        onSuccess(result.orderId);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement options={{ layout: 'tabs' }} />
      <motion.button
        type="submit"
        className="checkout-pay-btn"
        disabled={!stripe || loading}
        whileHover={!loading ? { scale: 1.015, boxShadow: '0 0 28px rgba(232,0,13,0.45)' } : {}}
        whileTap={!loading ? { scale: 0.985 } : {}}
        style={{ marginTop: 24 }}
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </motion.button>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);

  const initIntent = async (couponCode?: string) => {
    setLoadingIntent(true);
    try {
      const { clientSecret: cs, subtotal: st, discount: d, total: t, couponApplied: ca } =
        await createPaymentIntent(couponCode);
      setClientSecret(cs);
      setSubtotal(st);
      setDiscount(d);
      setTotal(t);
      if (ca) setCouponApplied(ca);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to initialize checkout');
      navigate('/dashboard');
    } finally {
      setLoadingIntent(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const items = await fetchCart().catch(() => []);
      if (!items.length) { navigate('/dashboard'); return; }
      setCart(items);
      await initIntent();
    };
    init();
  }, [navigate]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const data = await createPaymentIntent(couponInput.trim());
      if (!data.couponApplied) {
        toast.error('Coupon could not be applied');
        return;
      }
      setClientSecret(data.clientSecret);
      setSubtotal(data.subtotal);
      setDiscount(data.discount);
      setTotal(data.total);
      setCouponApplied(data.couponApplied);
      toast.success(`${data.couponApplied.code} applied — $${data.discount.toFixed(2)} off!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponInput('');
    setCouponApplied(null);
    await initIntent();
  };

  if (orderId) {
    return (
      <div className="checkout-success-outer">
        <motion.div
          className="checkout-success"
          initial={{ opacity: 0, y: 32, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
            style={{ marginBottom: 6 }}
          >
            <div className="checkout-order-badge">ORDER CONFIRMED</div>
          </motion.div>

          <motion.div
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.38, type: 'spring', stiffness: 280, damping: 18 }}
          >
            ✓
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52 }}
          >
            <h2>Order Placed!</h2>
            <div className="checkout-order-num">#{String(orderId).padStart(6, '0')}</div>
            <p>Thank you for shopping with CHEEZEYY FITS. You'll receive a confirmation email shortly.</p>
          </motion.div>

          <motion.div
            className="success-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.66 }}
          >
            <motion.button
              className="checkout-pay-btn"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              Continue Shopping
            </motion.button>
            <motion.button
              className="checkout-secondary-btn"
              onClick={() => navigate('/dashboard?tab=orders')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              View My Orders
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* ── Checkout header ── */}
      <motion.div
        className="checkout-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="checkout-logo" onClick={() => navigate('/')}>
          CHEEZEYY FITS
        </span>

        <div className="checkout-progress">
          <div className="cp-step done">
            <div className="cp-num">✓</div>
            <span>Cart</span>
          </div>
          <div className="cp-sep done" />
          <div className="cp-step active">
            <div className="cp-num">2</div>
            <span>Checkout</span>
          </div>
          <div className="cp-sep" />
          <div className="cp-step">
            <div className="cp-num">3</div>
            <span>Confirm</span>
          </div>
        </div>

        <motion.button
          className="auth-back-btn"
          onClick={() => navigate('/dashboard')}
          style={{ position: 'static' }}
          whileHover={{ x: -3 }}
        >
          ← Cart
        </motion.button>
      </motion.div>

      <div className="checkout-layout">
        {/* ── Order Summary ── */}
        <motion.div
          className="checkout-summary"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="checkout-title">ORDER SUMMARY</h2>
          <div className="checkout-items">
            {cart.map(item => (
              <div key={item.id} className="checkout-item">
                {item.image && (
                  <img src={item.image} alt={item.name} className="checkout-item-img" />
                )}
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.name}</p>
                  {item.size && <p className="checkout-item-meta">{item.size}</p>}
                  <p className="checkout-item-meta">Qty: {item.quantity}</p>
                </div>
                <span className="checkout-item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-subtotal">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="checkout-subtotal" style={{ color: 'var(--green)' }}>
              <span>Discount {couponApplied && `(${couponApplied.code})`}</span>
              <span>−${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="checkout-subtotal">
            <span>Shipping</span>
            <span style={{ color: 'var(--green)' }}>Free</span>
          </div>
          <div className="checkout-total-row">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>

          {/* Coupon */}
          <div className="coupon-row">
            {couponApplied ? (
              <div className="coupon-applied">
                <span>
                  🏷 {couponApplied.code} —{' '}
                  {couponApplied.discountType === 'percentage'
                    ? `${couponApplied.discountValue}% off`
                    : `$${couponApplied.discountValue} off`}
                </span>
                <button onClick={handleRemoveCoupon} className="coupon-remove">✕</button>
              </div>
            ) : (
              <div className="coupon-input-row">
                <input
                  className="coupon-input"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button
                  className="coupon-apply-btn"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? '...' : 'APPLY'}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Payment ── */}
        <motion.div
          className="checkout-payment"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <h2 className="checkout-title">PAYMENT</h2>
          <p className="checkout-test-note">
            Test card: <code>4242 4242 4242 4242</code> · any future date · any CVC
          </p>

          {loadingIntent ? (
            <p className="loading-text" style={{ padding: '40px 0' }}>Loading payment form...</p>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: { colorPrimary: '#e8000d', borderRadius: '0px', fontFamily: 'Arial, sans-serif' },
                },
              }}
            >
              <CheckoutForm total={total} onSuccess={id => setOrderId(id)} />
            </Elements>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
