import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchActiveSales } from '../api';

type Sale = { id: number; productId: number; name: string; image: string; originalPrice: number; salePrice: number; endsAt: string; stock: number };

const useCountdown = (end: string) => {
  const calc = () => Math.max(0, new Date(end).getTime() - Date.now());
  const [ms, setMs] = useState(calc());
  useEffect(() => {
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
  }, [end]);
  const s = Math.floor(ms / 1000);
  return {
    h: String(Math.floor(s / 3600)).padStart(2, '0'),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
    s: String(s % 60).padStart(2, '0'),
    expired: ms === 0,
  };
};

function SaleCard({ sale }: { sale: Sale }) {
  const { h, m, s, expired } = useCountdown(sale.endsAt);
  if (expired) return null;
  const pct = Math.round((1 - sale.salePrice / sale.originalPrice) * 100);
  return (
    <motion.div className="flash-card"
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(255,0,0,0.3)' }}>
      {sale.image && <img src={sale.image} alt={sale.name} className="flash-card-img" />}
      <div className="flash-card-body">
        <span className="flash-badge">-{pct}% OFF</span>
        <p className="flash-name">{sale.name}</p>
        <div className="flash-prices">
          <span className="flash-original">${sale.originalPrice.toFixed(2)}</span>
          <span className="flash-sale">${sale.salePrice.toFixed(2)}</span>
        </div>
        <div className="flash-countdown">
          <span className="flash-countdown-label">ENDS IN</span>
          <div className="countdown-digits">
            <span>{h}</span><span className="cd-sep">:</span>
            <span>{m}</span><span className="cd-sep">:</span>
            <span>{s}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FlashSalesBanner() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchActiveSales().then(setSales).catch(() => {});
  }, []);

  if (!sales.length) return null;

  return (
    <section className="flash-sales-section">
      <motion.div className="flash-header"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="flash-fire">⚡</span>
        <h2>FLASH SALE</h2>
        <span className="flash-fire">⚡</span>
      </motion.div>
      <div className="flash-grid">
        {sales.map((s) => <SaleCard key={s.id} sale={s} />)}
      </div>
    </section>
  );
}
