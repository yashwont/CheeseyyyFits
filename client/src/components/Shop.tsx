import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated } from '../utils/auth';

const categories = [
  { label: 'T-SHIRTS', icon: '👕' },
  { label: 'HOODIES', icon: '🧥' },
  { label: 'ACCESSORIES', icon: '🧢' },
];

function Shop() {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  return (
    <section id="shop" className="section">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        SHOP
      </motion.h2>

      <div className="grid">
        {categories.map(({ label, icon }, i) => (
          <motion.div
            key={label}
            className="card"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{
              y: -14,
              scale: 1.06,
              boxShadow: '0 0 28px rgba(255,0,0,0.45), 0 20px 40px rgba(0,0,0,0.6)',
              borderColor: 'red',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: '2rem', marginBottom: 8, display: 'block' }}>{icon}</span>
            {label}
          </motion.div>
        ))}
      </div>

      <motion.button
        className="shop-btn"
        onClick={() => navigate(authed ? '/dashboard' : '/login')}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(255,0,0,0.55)' }}
        whileTap={{ scale: 0.97 }}
        style={{ marginTop: 40 }}
      >
        Shop Now
      </motion.button>
    </section>
  );
}

export default Shop;
