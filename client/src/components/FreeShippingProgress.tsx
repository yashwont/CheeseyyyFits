import { motion } from 'framer-motion';

interface Props {
  cartTotal: number;
  threshold?: number;
}

export default function FreeShippingProgress({ cartTotal, threshold = 50 }: Props) {
  const remaining = Math.max(0, threshold - cartTotal);
  const pct = Math.min(100, (cartTotal / threshold) * 100);
  const unlocked = remaining === 0;

  return (
    <div className={`shipping-progress ${unlocked ? 'shipping-progress-done' : ''}`}>
      <div className="shipping-progress-text">
        {unlocked ? (
          <span><strong>FREE SHIPPING UNLOCKED ✓</strong></span>
        ) : (
          <span>Add <strong>${remaining.toFixed(2)}</strong> for FREE shipping</span>
        )}
      </div>
      <div className="shipping-progress-track">
        <motion.div
          className="shipping-progress-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  );
}
