import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchRestockedProducts } from '../api';

type Product = { id: number; name: string; image: string; price: number; category: string };

interface Props {
  onItemClick?: (id: number) => void;
}

export default function RestockedWidget({ onItemClick }: Props) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetchRestockedProducts().then(setItems).catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <motion.div
      className="restocked-widget"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="restocked-header">
        <span className="restocked-pulse" />
        <h3 className="restocked-title">RESTOCKED THIS WEEK</h3>
      </div>
      <div className="restocked-strip">
        {items.map((p) => (
          <motion.div
            key={p.id}
            className="restocked-card"
            whileHover={{ y: -4, borderColor: 'var(--red)' }}
            onClick={() => onItemClick?.(p.id)}
          >
            <span className="restocked-flag">BACK IN STOCK</span>
            {p.image
              ? <img src={p.image} alt={p.name} className="restocked-img" loading="lazy" />
              : <div className="restocked-img restocked-img-empty" />}
            <div className="restocked-info">
              <span className="restocked-name">{p.name}</span>
              <span className="restocked-price">${p.price.toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
