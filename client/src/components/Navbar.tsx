import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { isAuthenticated, getRole, clearAuth } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';
import MagneticButton from './MagneticButton';

const NAV_LINKS = [
  { label: 'NEW IN', id: 'new' },
  { label: 'OFFERS', id: 'offers' },
  { label: 'SHOP', id: 'shop' },
  { label: 'ABOUT', id: 'about' },
  { label: 'CONTACT', id: 'contact', path: '/contact' },
];

function Navbar({ scrollTo }: { scrollTo: (id: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const role = getRole();
  const { theme, toggle } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.96)']);
  const navBlur = useTransform(scrollY, [0, 80], ['blur(0px)', 'blur(16px)']);
  const navBorderOpacity = useTransform(scrollY, [0, 80], [0, 0.15]);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  // Active section tracker
  useEffect(() => {
    if (location.pathname !== '/') return;
    const els = NAV_LINKS.map((l) => document.getElementById(l.id!)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.4 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [location.pathname]);

  const handleNav = (link: typeof NAV_LINKS[0]) => {
    setMobileOpen(false);
    if (link.path) { navigate(link.path); return; }
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => scrollTo(link.id), 120); }
    else scrollTo(link.id);
  };

  const handleLogout = () => { clearAuth(); navigate('/'); };

  return (
    <>
      {/* Announcement bar */}
      <motion.div
        className="topbar"
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ⚡ Free Worldwide Shipping on orders over $50 &nbsp;·&nbsp;
          Use code <strong>WELCOME10</strong> for 10% off
        </motion.p>
      </motion.div>

      {/* Main nav */}
      <motion.nav
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
        style={{ backgroundColor: navBg, backdropFilter: navBlur }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="logo"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          CF
        </motion.div>

        {/* Desktop nav links */}
        <ul className="nav-links">
          {NAV_LINKS.map((link, i) => (
            <motion.li
              key={link.label}
              className={activeSection === link.id ? 'nav-active' : ''}
              onClick={() => handleNav(link)}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
            >
              <span className="nav-link-text">{link.label}</span>
              {activeSection === link.id && (
                <motion.span
                  className="nav-active-dot"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              )}
            </motion.li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="nav-right">
          <motion.button
            className="theme-toggle"
            onClick={toggle}
            whileHover={{ scale: 1.2, rotate: 20 }}
            whileTap={{ scale: 0.85, rotate: -10 }}
            transition={{ type: 'spring', stiffness: 400 }}
            title="Toggle theme"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </motion.button>

          {authed ? (
            <>
              <MagneticButton className="login-btn" onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')} strength={0.25}>
                Dashboard
              </MagneticButton>
              <MagneticButton className="register-btn" onClick={handleLogout} strength={0.25}>
                Logout
              </MagneticButton>
            </>
          ) : (
            <>
              <MagneticButton className="login-btn" onClick={() => navigate('/login')} strength={0.25}>
                Login
              </MagneticButton>
              <MagneticButton className="register-btn" onClick={() => navigate('/register')} strength={0.25}>
                Register
              </MagneticButton>
            </>
          )}

          {/* Hamburger */}
          <motion.button
            className="hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="ham-line"
                animate={mobileOpen ? {
                  y: i === 0 ? 7 : i === 2 ? -7 : 0,
                  rotate: i === 0 ? 45 : i === 2 ? -45 : 0,
                  opacity: i === 1 ? 0 : 1,
                } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <div className="mobile-drawer-header">
                <span className="logo" onClick={() => { navigate('/'); setMobileOpen(false); }}>CF</span>
                <button className="cart-close" onClick={() => setMobileOpen(false)}>✕</button>
              </div>
              <ul className="mobile-nav-links">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.label}
                    className="mobile-nav-item"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
                    onClick={() => handleNav(link)}
                    whileTap={{ x: 8 }}
                  >
                    {link.label}
                    <motion.span className="mobile-nav-arrow" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                className="mobile-drawer-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {authed ? (
                  <>
                    <button className="register-btn" style={{ width: '100%', marginBottom: 10 }}
                      onClick={() => { navigate(role === 'admin' ? '/admin' : '/dashboard'); setMobileOpen(false); }}>
                      Dashboard
                    </button>
                    <button className="login-btn" style={{ width: '100%' }} onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <button className="register-btn" style={{ width: '100%', marginBottom: 10 }}
                      onClick={() => { navigate('/register'); setMobileOpen(false); }}>Create Account</button>
                    <button className="login-btn" style={{ width: '100%' }}
                      onClick={() => { navigate('/login'); setMobileOpen(false); }}>Sign In</button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
