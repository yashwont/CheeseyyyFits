import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'cheezeyy_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Show after small delay so it doesn't compete with page-transition wipe
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, at: Date.now() }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cookie-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cookie-banner-text">
            <p className="cookie-banner-title">COOKIES & PRIVACY</p>
            <p className="cookie-banner-desc">
              We use cookies to remember your cart, recently viewed items, and preferences.
              No tracking pixels, no third-party ads.
            </p>
          </div>
          <div className="cookie-banner-actions">
            <button className="cookie-btn cookie-btn-secondary" onClick={() => accept('essential')}>
              ESSENTIAL ONLY
            </button>
            <button className="cookie-btn cookie-btn-primary" onClick={() => accept('all')}>
              ACCEPT ALL
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
