import { motion } from 'framer-motion';

const STEPS = [
  { key: 'confirmed', label: 'Ordered', icon: '📦' },
  { key: 'processing', label: 'Packing', icon: '🏭' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '✓' },
];

const STATUS_INDEX: Record<string, number> = {
  confirmed: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1,
};

export default function OrderProgress({ status }: { status: string }) {
  if (status === 'cancelled') {
    return <p className="order-cancelled-label">ORDER CANCELLED</p>;
  }

  const current = STATUS_INDEX[status] ?? 0;

  return (
    <div className="order-progress">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.key} className="progress-step-wrap">
            <div className={`progress-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              <motion.div
                className="progress-dot"
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {done ? step.icon : <span className="progress-dot-num">{i + 1}</span>}
              </motion.div>
              <span className="progress-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="progress-line-wrap">
                <div className="progress-line-bg" />
                <motion.div
                  className="progress-line-fill"
                  initial={{ width: 0 }}
                  animate={{ width: i < current ? '100%' : '0%' }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
