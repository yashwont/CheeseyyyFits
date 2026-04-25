import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const LINKS = {
  Shop: ['T-Shirts', 'Hoodies', 'Accessories', 'Pants', 'New Arrivals'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Support: ['Contact Us', 'FAQ', 'Shipping', 'Returns', 'Size Guide'],
};

function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleNewsletter = () => {
    if (!email || !email.includes('@')) return toast.error('Enter a valid email');
    toast.success('You\'re on the list! 🔥');
    setEmail('');
  };

  return (
    <motion.footer className="footer" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.8 }}>

      {/* Newsletter */}
      <div className="footer-newsletter">
        <div>
          <h3 className="newsletter-title">JOIN THE MOVEMENT</h3>
          <p className="newsletter-sub">New drops, exclusive offers, and culture — straight to your inbox.</p>
        </div>
        <div className="newsletter-form">
          <input className="newsletter-input" type="email" placeholder="your@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNewsletter()} />
          <motion.button className="newsletter-btn" onClick={handleNewsletter}
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(255,0,0,0.4)' }} whileTap={{ scale: 0.97 }}>
            SUBSCRIBE
          </motion.button>
        </div>
      </div>

      {/* Main footer links */}
      <div className="footer-container">
        <div className="footer-brand">
          <div className="logo" style={{ fontSize: '1.8rem', marginBottom: 12 }}>CF</div>
          <p className="footer-tagline">Wear the attitude.<br />Own the street.</p>
          <div className="footer-socials">
            {['IG', 'TK', 'TW'].map((s) => (
              <motion.span key={s} className="footer-social-btn"
                whileHover={{ background: 'red', color: 'black' }}>
                {s}
              </motion.span>
            ))}
          </div>
        </div>

        {Object.entries(LINKS).map(([group, items]) => (
          <div key={group} className="footer-section">
            <h4>{group}</h4>
            {items.map((item) => (
              <motion.p key={item} className="footer-link"
                onClick={() => item === 'Contact Us' ? navigate('/contact') : navigate('/')}
                whileHover={{ color: 'red', x: 4 }}>
                {item}
              </motion.p>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© 2026 CHEEZEYY FITS — All rights reserved.</p>
        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Cookie Policy</span>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
