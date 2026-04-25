import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api';
import { useTilt } from '../hooks/useTilt';

type Product = { id: number; name: string; price: number; image: string; category: string; badge?: string; unitsSold?: number };

const CATEGORIES = [
  { label: 'T-SHIRTS', icon: '👕', cat: 'T-Shirts', color: '#ff0000' },
  { label: 'HOODIES', icon: '🧥', cat: 'Hoodies', color: '#cc0000' },
  { label: 'PANTS', icon: '👖', cat: 'Pants', color: '#990000' },
  { label: 'ACCESSORIES', icon: '🧢', cat: 'Accessories', color: '#ff3333' },
];

function TiltCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(14);
  return (
    <motion.div
      ref={ref}
      className="featured-card"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      whileHover={{ z: 20, boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,0,0,0.15)' }}
    >
      <div className="featured-img-wrap" style={{ transformStyle: 'preserve-3d' }}>
        {p.image
          ? <img src={p.image} alt={p.name} className="featured-img" />
          : <div className="product-img-placeholder">NO IMAGE</div>}
        {p.badge && <span className={`product-badge badge-${p.badge.toLowerCase().replace(' ', '-')}`}>{p.badge}</span>}
        {/* Glare layer */}
        <div className="tilt-glare" />
      </div>
      <div className="featured-info" style={{ transform: 'translateZ(10px)' }}>
        <p className="featured-cat">{p.category}</p>
        <p className="featured-name">{p.name}</p>
        <p className="featured-price">${p.price.toFixed(2)}</p>
      </div>
    </motion.div>
  );
}

function NewCollection() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts({}).then((products: Product[]) => setFeatured(products.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <section id="new" className="section landing-section">
      <motion.div className="section-label"
        initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        NEW THIS SEASON
      </motion.div>

      <div style={{ overflow: 'hidden' }}>
        <motion.h2
          initial={{ y: '100%' }} whileInView={{ y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          NEW COLLECTION
        </motion.h2>
      </div>

      {/* Category tiles */}
      <div className="category-grid">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            className="category-tile"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 220, damping: 22 }}
            whileHover={{ y: -12, scale: 1.04, borderColor: cat.color, boxShadow: `0 20px 40px rgba(255,0,0,0.2)` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard')}
          >
            <motion.span className="cat-icon"
              whileHover={{ scale: 1.3, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 400 }}>
              {cat.icon}
            </motion.span>
            <span className="cat-label">{cat.label}</span>
            <motion.span className="cat-arrow" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>→</motion.span>
          </motion.div>
        ))}
      </div>

      {/* 3D tilt product grid */}
      {featured.length > 0 && (
        <div className="featured-grid" style={{ perspective: 1200 }}>
          {featured.map((p) => (
            <TiltCard key={p.id} p={p} onClick={() => navigate('/dashboard')} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.3 }}>
        <MagneticButtonLocal label="View All Products" onClick={() => navigate('/dashboard')} />
      </motion.div>
    </section>
  );
}

function MagneticButtonLocal({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      className="shop-btn"
      style={{ marginTop: 40 }}
      onClick={onClick}
      whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(255,0,0,0.5)' }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="btn-text">{label}</span>
      <span className="btn-shine" />
    </motion.button>
  );
}

export default NewCollection;
