import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSocialProof } from '../api';

type Proof = { username: string; productName: string; createdAt: string };

const timeAgo = (date: string) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function SocialProof() {
  const [items, setItems] = useState<Proof[]>([]);
  const [current, setCurrent] = useState<Proof | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchSocialProof().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const show = () => { setCurrent(items[idx % items.length]); setIdx((i) => i + 1); };
    show();
    const interval = setInterval(show, 6000);
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 4500);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div className="social-proof-container">
      <AnimatePresence>
        {current && (
          <motion.div
            className="social-proof-popup"
            initial={{ opacity: 0, x: -80, y: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <span className="sp-dot" />
            <div>
              <p className="sp-name">{current.username.slice(0, 8)}*** purchased</p>
              <p className="sp-product">{current.productName}</p>
              <p className="sp-time">{timeAgo(current.createdAt)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
