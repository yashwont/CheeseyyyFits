import { motion } from 'framer-motion';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

interface Props {
  onItemClick?: (id: number) => void;
}

export default function RecentlyViewed({ onItemClick }: Props) {
  const { items, clear } = useRecentlyViewed();

  if (!items.length) return null;

  return (
    <motion.div
      className="recently-viewed"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rv-header">
        <h3 className="rv-title">RECENTLY VIEWED</h3>
        <button className="rv-clear" onClick={clear}>CLEAR</button>
      </div>
      <div className="rv-strip">
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="rv-card"
            whileHover={{ y: -3, borderColor: 'var(--red)' }}
            onClick={() => onItemClick?.(item.id)}
          >
            {item.image
              ? <img src={item.image} alt={item.name} className="rv-img" loading="lazy" />
              : <div className="rv-img rv-img-empty" />}
            <div className="rv-info">
              <span className="rv-name">{item.name}</span>
              <span className="rv-price">${item.price.toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
