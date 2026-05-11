import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { forgotPassword, resetPassword } from '../api';

type Step = 'email' | 'code';

const DIGIT_COUNT = 6;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < DIGIT_COUNT - 1) digitRefs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) digitRefs.current[i - 1]?.focus();
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

  const handleSend = async () => {
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('Reset code sent if that email exists');
      setStep('code');
      setTimeout(() => digitRefs.current[0]?.focus(), 320);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (code.length < DIGIT_COUNT) return toast.error('Enter the full 6-digit code');
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match');
    if (newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await resetPassword(email, code, newPwd);
      toast.success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 36 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.32 } },
    exit: { opacity: 0, x: -36, transition: { duration: 0.2 } },
  };

  const panelCopy = {
    email: {
      tagline: 'Forgot\nyour\npassword?',
      sub: 'No stress. We\'ll get you back in seconds.',
    },
    code: {
      tagline: 'Check\nyour\ninbox.',
      sub: 'Enter the reset code and set a new password.',
    },
  };

  const copy = panelCopy[step];

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
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-panel-tagline" style={{ whiteSpace: 'pre-line' }}>
                {copy.tagline}
              </div>
              <div className="auth-panel-sub">{copy.sub}</div>
            </motion.div>
          </AnimatePresence>
          <div className="auth-panel-badges">
            <span>🔒 Secure Recovery</span>
            <span>✦ 2-Minute Process</span>
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
          onClick={() => step === 'code' ? setStep('email') : navigate('/login')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          ← {step === 'code' ? 'Back' : 'Back to Login'}
        </motion.button>

        <motion.div
          className="modal"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
        >
          {/* Step indicator */}
          <div className="auth-steps">
            <div className={`auth-step ${step === 'email' ? 'active' : 'done'}`}>
              <div className="auth-step-num">{step === 'email' ? '1' : '✓'}</div>
              <div className="auth-step-label">Email</div>
            </div>
            <div className={`auth-step-line ${step === 'code' ? 'filled' : ''}`}>
              <div className="auth-step-line-fill" />
            </div>
            <div className={`auth-step ${step === 'code' ? 'active' : ''}`}>
              <div className="auth-step-num">2</div>
              <div className="auth-step-label">Reset</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div key="email" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <div className="section-label" style={{ marginBottom: 14 }}>ACCOUNT RECOVERY</div>
                <h2 className="modal-heading">Find Account</h2>
                <p className="modal-sub">Enter the email tied to your account</p>

                <div className="input-float">
                  <input
                    type="email" id="fp-email" placeholder=" "
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    autoComplete="email"
                  />
                  <label htmlFor="fp-email">Email Address</label>
                  <span className="input-float-line" />
                </div>

                <motion.button
                  className="auth-btn" onClick={handleSend} disabled={loading}
                  whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.985 } : {}}
                >
                  <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                </motion.button>

                <div className="auth-divider"><span>OR</span></div>

                <p className="switch">
                  Remembered it?{' '}
                  <span
                    style={{ color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/login')}
                  >
                    Back to login
                  </span>
                </p>
              </motion.div>
            ) : (
              <motion.div key="code" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <div className="section-label" style={{ marginBottom: 14 }}>RESET PASSWORD</div>
                <h2 className="modal-heading">New Password</h2>
                <p className="modal-sub">
                  Code sent to{' '}
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

                <div className="input-float">
                  <input
                    type={showPw ? 'text' : 'password'} id="fp-newpw" placeholder=" "
                    value={newPwd} onChange={e => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                  />
                  <label htmlFor="fp-newpw">New Password</label>
                  <span className="input-float-line" />
                  <button className="pw-toggle" type="button" onClick={() => setShowPw(v => !v)}>
                    {showPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                <div className="input-float">
                  <input
                    type={showPw ? 'text' : 'password'} id="fp-confirmpw" placeholder=" "
                    value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                    autoComplete="new-password"
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                  />
                  <label htmlFor="fp-confirmpw">Confirm Password</label>
                  <span className="input-float-line" />
                </div>

                <motion.button
                  className="auth-btn" onClick={handleReset}
                  disabled={loading || code.length < DIGIT_COUNT}
                  whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.985 } : {}}
                >
                  <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
