import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../services/authService';
import { isAuthenticated, getRole } from '../utils/auth';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const { reconnect } = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getRole() === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('email', result.email);
      localStorage.setItem('userId', String(result.userId));
      localStorage.setItem('role', result.role);
      localStorage.setItem('username', result.username || result.email.split('@')[0]);
      reconnect();
      toast.success('Welcome back!');
      navigate(result.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left editorial panel ── */}
      <motion.div
        className="auth-panel-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="auth-panel-brand"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          CF
        </div>
        <div>
          <div className="auth-panel-tagline">
            Wear the<br />attitude.<br />Own the<br />street.
          </div>
          <div className="auth-panel-sub">Street fashion since 2026.</div>
          <div className="auth-panel-badges">
            <span>🔒 Encrypted & Secure</span>
            <span>✦ 10,000+ Members</span>
            <span>◈ Free Returns</span>
          </div>
        </div>
      </motion.div>

      {/* ── Right form panel ── */}
      <motion.div
        className="auth-panel-right"
        style={{ position: 'relative' }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          className="auth-back-btn"
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 24, left: 24 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          ← Back
        </motion.button>

        <motion.div
          className="modal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
          >
            <div className="section-label" style={{ marginBottom: 14 }}>WELCOME BACK</div>
            <h2 className="modal-heading">Sign In</h2>
            <p className="modal-sub">Enter your credentials to continue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <div className="input-float">
              <input
                type="email"
                id="login-email"
                placeholder=" "
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
              />
              <label htmlFor="login-email">Email Address</label>
              <span className="input-float-line" />
            </div>

            <div className="input-float">
              <input
                type={showPw ? 'text' : 'password'}
                id="login-pw"
                placeholder=" "
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
              <label htmlFor="login-pw">Password</label>
              <span className="input-float-line" />
              <button className="pw-toggle" type="button" onClick={() => setShowPw(v => !v)}>
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48 }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22, marginTop: -8 }}>
              <Link to="/forgot-password" className="auth-text-link" style={{ fontSize: 11, color: 'var(--t3)' }}>
                Forgot password?
              </Link>
            </div>

            <motion.button
              className="auth-btn"
              onClick={handleLogin}
              disabled={loading}
              whileHover={!loading ? { scale: 1.015 } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </motion.button>

            <div className="auth-divider"><span>OR</span></div>

            <p className="switch">
              New here?{' '}
              <Link to="/register" style={{ color: 'var(--red)', fontWeight: 700 }}>
                Create account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
