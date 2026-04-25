import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

const VALUES = [
  { icon: '🔥', title: 'Street Born', desc: 'Born from underground culture. Every piece is designed to make a statement.' },
  { icon: '✂', title: 'Premium Quality', desc: 'Heavyweight fabrics, reinforced stitching. Built to outlast trends.' },
  { icon: '🌍', title: 'Global Reach', desc: 'We ship worldwide. The attitude knows no borders.' },
  { icon: '♻', title: 'Responsible', desc: 'Ethical production, sustainable packaging. Style without compromise.' },
];

function StatCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(end, 2000);
  return (
    <motion.div
      ref={ref as any}
      className="stat-item"
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
    >
      <motion.span className="stat-value">
        {count.toLocaleString()}{suffix}
      </motion.span>
      <span className="stat-label">{label}</span>
    </motion.div>
  );
}

function About() {
  return (
    <section id="about" className="section dark landing-section">
      <motion.div className="section-label"
        initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        OUR STORY
      </motion.div>

      <div style={{ overflow: 'hidden' }}>
        <motion.h2
          initial={{ y: '100%' }} whileInView={{ y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          ABOUT
        </motion.h2>
      </div>

      <motion.p className="about-desc"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.7 }}>
        CHEEZEYY FITS is not just clothing — it's identity, attitude, and street culture.
        Born from the underground, made for the bold.
      </motion.p>

      {/* Live counting stats */}
      <div className="stats-row">
        <StatCounter end={10000} suffix="+" label="Customers" />
        <StatCounter end={500} suffix="+" label="Products" />
        <StatCounter end={50} suffix="+" label="Countries" />
        <StatCounter end={4} suffix=".8★" label="Avg Rating" />
      </div>

      {/* Value cards */}
      <div className="values-grid">
        {VALUES.map(({ icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="value-card"
            initial={{ opacity: 0, y: 40, rotateX: -15 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, scale: 1.03, borderColor: 'rgba(255,0,0,0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <motion.span className="value-icon"
              whileHover={{ scale: 1.4, rotate: -10 }}
              transition={{ type: 'spring', stiffness: 400 }}>
              {icon}
            </motion.span>
            <h4 className="value-title">{title}</h4>
            <p className="value-desc">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default About;
