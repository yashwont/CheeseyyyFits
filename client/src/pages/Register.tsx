import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser, verifyUser } from '../services/authService';
import { isAuthenticated, getRole } from '../utils/auth';
import toast from 'react-hot-toast';

const DIGIT_COUNT = 6;

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getRole() === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const otp = digits.join('');

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < DIGIT_COUNT - 1) digitRefs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) digitRefs.current[i - 1]?.focus();
    if (e.key === 'Enter' && otp.length === DIGIT_COUNT) handleVerify();
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!text) return;
    const next = Array(DIGIT_COUNT).fill('');
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    digitRefs.current[Math.min(text.length, DIGIT_COUNT - 1)]?.focus();
  };

  const handleRegister = async () => {
    if (!username || !email || !password) return toast.error('Please fill in all fields');
    if (loading) return;
    setLoading(true);
    try {
      await registerUser(username, email, password);
      toast.success('Check your email for the verification code.');
      setStep('otp');
      setTimeout(() => digitRefs.current[0]?.focus(), 320);
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== DIGIT_COUNT) return toast.error('Enter the 6-digit code');
    if (loading) return;
    setLoading(true);
    try {
      await verifyUser(email, otp);
      toast.success('Email verified! You can now login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 36 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.32 } },
    exit: { opacity: 0, x: -36, transition: { duration: 0.2 } },
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
            Join the<br />movement.<br />Own the<br />look.
          </div>
          <div className="auth-panel-sub">Street fashion since 2026.</div>
          <div className="auth-panel-badges">
            <span>✦ 10,000+ Members</span>
            <span>◈ Free Returns</span>
            <span>🔒 Secure Checkout</span>
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
          style={{ position: 'absolute', top: 24, left: 24 }}
          onClick={() => step === 'otp' ? setStep('form') : navigate('/')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          ← {step === 'otp' ? 'Back' : 'Home'}
        </motion.button>

        <motion.div
          className="modal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
        >
          {/* Step indicator */}
          <div className="auth-steps">
            <div className={`auth-step ${step === 'form' ? 'active' : 'done'}`}>
              <div className="auth-step-num">{step === 'form' ? '1' : '✓'}</div>
              <div className="auth-step-label">Details</div>
            </div>
            <div className={`auth-step-line ${step === 'otp' ? 'filled' : ''}`}>
              <div className="auth-step-line-fill" />
            </div>
            <div className={`auth-step ${step === 'otp' ? 'active' : ''}`}>
              <div className="auth-step-num">2</div>
              <div className="auth-step-label">Verify</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div key="form" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <div className="section-label" style={{ marginBottom: 14 }}>CREATE ACCOUNT</div>
                <h2 className="modal-heading">Join Us</h2>
                <p className="modal-sub">Start your streetwear journey</p>

                <div className="input-float">
                  <input
                    type="text" id="reg-username" placeholder=" "
                    value={username} onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    autoComplete="username"
                  />
                  <label htmlFor="reg-username">Username</label>
                  <span className="input-float-line" />
                </div>

                <div className="input-float">
                  <input
                    type="email" id="reg-email" placeholder=" "
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    autoComplete="email"
                  />
                  <label htmlFor="reg-email">Email Address</label>
                  <span className="input-float-line" />
                </div>

                <div className="input-float">
                  <input
                    type={showPw ? 'text' : 'password'} id="reg-pw" placeholder=" "
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    autoComplete="new-password"
                  />
                  <label htmlFor="reg-pw">Password</label>
                  <span className="input-float-line" />
                  <button className="pw-toggle" type="button" onClick={() => setShowPw(v => !v)}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                <motion.button
                  className="auth-btn" onClick={handleRegister} disabled={loading}
                  whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.985 } : {}}
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </motion.button>

                <div className="auth-divider"><span>OR</span></div>

                <p className="switch">
                  Already a member?{' '}
                  <Link to="/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Sign in</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <div className="section-label" style={{ marginBottom: 14 }}>VERIFY EMAIL</div>
                <h2 className="modal-heading">Check Inbox</h2>
                <p className="modal-sub">
                  We sent a 6-digit code to<br />
                  <strong style={{ color: 'var(--t2)' }}>{email}</strong>
                </p>

                <div className="otp-grid">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { digitRefs.current[i] = el; }}
                      className="otp-digit"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleDigitKey(i, e)}
                      onPaste={i === 0 ? handleDigitPaste : undefined}
                    />
                  ))}
                </div>

                <motion.button
                  className="auth-btn" onClick={handleVerify}
                  disabled={loading || otp.length < DIGIT_COUNT}
                  whileHover={!loading && otp.length === DIGIT_COUNT ? { scale: 1.015 } : {}}
                  whileTap={!loading && otp.length === DIGIT_COUNT ? { scale: 0.985 } : {}}
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                </motion.button>

                <p className="switch" style={{ marginTop: 16 }}>
                  Didn't receive it?{' '}
                  <button
                    className="link-btn"
                    onClick={() => { setStep('form'); setDigits(Array(DIGIT_COUNT).fill('')); }}
                  >
                    Go back & resend
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Register;
