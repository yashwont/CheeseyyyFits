import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated } from '../utils/auth';

const CATS = [
  { num: '01', label: 'T-SHIRTS',     sub: 'Essential cuts, bold graphics' },
  { num: '02', label: 'HOODIES',      sub: 'Oversized. Heavy. Legendary.' },
  { num: '03', label: 'ACCESSORIES',  sub: 'Finish the look' },
];

function Shop() {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const dest = authed ? '/dashboard' : '/login';

  return (
    <section id="shop" className="section shop-section">
      <div className="shop-header">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          EXPLORE BY CATEGORY
        </motion.div>
        <div style={{ overflow: 'hidden' }}>
          <motion.h2
            className="shop-heading"
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            SHOP
          </motion.h2>
        </div>
      </div>

      <div className="shop-cats">
        {CATS.map(({ num, label, sub }, i) => (
          <motion.div
            key={label}
            className="shop-cat-tile"
            data-num={num}
            onClick={() => navigate(dest)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <div className="shop-cat-num">{num}</div>
              <div className="shop-cat-name">{label}</div>
              <div className="shop-cat-sub">{sub}</div>
            </div>
            <div className="shop-cat-cta">
              <span>Shop now</span>
              <span className="shop-cat-arrow">→</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        style={{ textAlign: 'center' }}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          className="shop-btn"
          onClick={() => navigate(dest)}
          whileHover={{ scale: 1.03, boxShadow: '0 0 36px rgba(232,0,13,0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="btn-text">Enter the Store</span>
        </motion.button>
      </motion.div>
    </section>
  );
}

export default Shop;
