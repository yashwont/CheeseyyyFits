import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { isAuthenticated } from '../utils/auth';
import MagneticButton from './MagneticButton';

const MARQUEE = ['NEW DROP', 'FREE SHIPPING', 'STREET CULTURE', 'LIMITED STOCK', 'WEAR THE ATTITUDE'];

function Hero() {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const orb1X = useSpring(useTransform(mouseX, [-1, 1], [-60, 60]), { stiffness: 40, damping: 20 });
  const orb1Y = useSpring(useTransform(mouseY, [-1, 1], [-40, 40]), { stiffness: 40, damping: 20 });
  const orb2X = useSpring(useTransform(mouseX, [-1, 1], [80, -80]), { stiffness: 25, damping: 15 });
  const orb2Y = useSpring(useTransform(mouseY, [-1, 1], [60, -60]), { stiffness: 25, damping: 15 });
  const gridX = useSpring(useTransform(mouseX, [-1, 1], [-15, 15]), { stiffness: 80, damping: 25 });
  const gridY = useSpring(useTransform(mouseY, [-1, 1], [-10, 10]), { stiffness: 80, damping: 25 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="hero">
      <div className="hero-grain" />
      <motion.div className="hero-grid" style={{ x: gridX, y: gridY }} />

      <motion.div className="hero-glow hero-glow-1" style={{ x: orb1X, y: orb1Y }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div className="hero-glow hero-glow-2" style={{ x: orb2X, y: orb2Y }}
        animate={{ scale: [1.2, 0.85, 1.2], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />

      <motion.div className="hero-glow hero-glow-3"
        animate={{ y: [0, -30, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />

      <div className="hero-content">
        {/* Season tag */}
        <motion.div className="hero-tag"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          ◈ SS 2026 COLLECTION
        </motion.div>

        {/* Title — two lines, word-level slide-up */}
        <div className="hero-title" aria-label="CHEEZEYY FITS">
          {['CHEEZEYY', 'FITS'].map((word, i) => (
            <div key={word} style={{ overflow: 'hidden', display: 'block', lineHeight: 1 }}>
              <motion.span
                style={{ display: 'block' }}
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.72, delay: 0.2 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Subline */}
        <motion.p className="hero-sub"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.65 }}>
          Wear the attitude. Own the street.
        </motion.p>

        {/* CTAs */}
        <motion.div className="hero-actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.85 }}>
          {authed ? (
            <MagneticButton className="hero-btn" onClick={() => navigate('/dashboard')} strength={0.4}>
              <span className="btn-text">Enter the Shop</span>
              <span className="btn-shine" />
            </MagneticButton>
          ) : (
            <>
              <MagneticButton className="hero-btn" onClick={() => navigate('/register')} strength={0.4}>
                <span className="btn-text">Shop Now</span>
                <span className="btn-shine" />
              </MagneticButton>
              <MagneticButton className="hero-btn-outline" onClick={() => navigate('/login')} strength={0.3}>
                Sign In
              </MagneticButton>
            </>
          )}
        </motion.div>

        {/* Trust pills */}
        <motion.div className="hero-trust"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}>
          {['10K+ Customers', 'Free Returns', 'Worldwide Shipping'].map((item, i) => (
            <motion.span key={item} className="trust-pill"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.08, type: 'spring', stiffness: 280 }}>
              {item}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ opacity: { delay: 1.5, duration: 0.4 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.8 } }}>
        ↓
      </motion.div>

      {/* Marquee */}
      <div className="hero-marquee-wrap">
        <motion.div className="hero-marquee"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="marquee-item">
              {item}<span className="marquee-sep">✦</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
