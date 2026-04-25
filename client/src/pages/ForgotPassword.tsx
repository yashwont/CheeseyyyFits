import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { forgotPassword, resetPassword } from '../api';

type Step = 'email' | 'code';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('Reset code sent if that email exists');
      setStep('code');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!code) return toast.error('Enter the code');
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match');
    if (newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await resetPassword(email, code, newPwd);
      toast.success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Reset failed');
    } finally { setLoading(false); }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="auth-page">
      <motion.button className="auth-back-btn" onClick={() => step === 'code' ? setStep('email') : navigate('/login')}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -4 }}>
        ← {step === 'code' ? 'Back' : 'Back to Login'}
      </motion.button>

      <motion.div className="modal" initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div key="email" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <h2 style={{ marginBottom: 8 }}>Forgot Password</h2>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 20 }}>
                Enter your email and we'll send a reset code.
              </p>
              <motion.input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} />
              <motion.button className="auth-btn" onClick={handleSend} disabled={loading}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,0,0,0.5)' }} whileTap={{ scale: 0.97 }}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="code" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <h2 style={{ marginBottom: 8 }}>Reset Password</h2>
              <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 20 }}>
                Code sent to <strong style={{ color: '#ccc' }}>{email}</strong>
              </p>
              <motion.input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)}
                maxLength={6} style={{ letterSpacing: '6px', textAlign: 'center', fontSize: '1.1rem' }}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} />
              <motion.input type="password" placeholder="New password" value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 }} />
              <motion.input type="password" placeholder="Confirm new password" value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }} />
              <motion.button className="auth-btn" onClick={handleReset} disabled={loading}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,0,0,0.5)' }} whileTap={{ scale: 0.97 }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
