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
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchSocialProof().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length || dismissed) return;
    const show = () => {
      setCurrent(items[idx % items.length]);
      setIdx(i => i + 1);
    };
    // First show after 4s, then every 14s
    const initial = setTimeout(show, 4000);
    return () => clearTimeout(initial);
  }, [items, dismissed]);

  useEffect(() => {
    if (!current || dismissed) return;
    // Show for 3.5s then hide, next show in 14s
    const hide = setTimeout(() => setCurrent(null), 3500);
    const next = setTimeout(() => {
      if (!dismissed) {
        setCurrent(items[idx % items.length]);
        setIdx(i => i + 1);
      }
    }, 14000);
    return () => { clearTimeout(hide); clearTimeout(next); };
  }, [current, dismissed]);

  if (dismissed) return null;

  return (
    <div className="sp-wrap">
      <AnimatePresence>
        {current && (
          <motion.div
            className="sp-toast"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="sp-live" />
            <div className="sp-body">
              <span className="sp-text">
                <strong>{current.username.slice(0, 6)}***</strong> bought{' '}
                <strong>{current.productName}</strong>
              </span>
              <span className="sp-when">{timeAgo(current.createdAt)}</span>
            </div>
            <button
              className="sp-dismiss"
              onClick={() => { setCurrent(null); setDismissed(true); }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
