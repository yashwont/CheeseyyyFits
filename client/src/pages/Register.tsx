import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser, verifyUser } from '../services/authService';
import { isAuthenticated, getRole } from '../utils/auth';
import toast from 'react-hot-toast';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getRole() === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleRegister = async () => {
    if (!username || !email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await registerUser(username, email, password);
      toast.success('Check your email for the verification code.');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) return toast.error('Enter the verification code');
    setLoading(true);
    try {
      await verifyUser(email, otp);
      toast.success('Email verified! You can now login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="auth-page">
      <motion.button
        className="auth-back-btn"
        onClick={() => step === 'otp' ? setStep('form') : navigate('/')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
        transition={{ duration: 0.3 }}
      >
        ← {step === 'otp' ? 'Back to form' : 'Back'}
      </motion.button>

      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
              <h2 style={{ marginBottom: 20 }}>Register</h2>
              {[
                { placeholder: 'Username', value: username, setter: setUsername, type: 'text' },
                { placeholder: 'Email', value: email, setter: setEmail, type: 'email' },
                { placeholder: 'Password', value: password, setter: setPassword, type: 'password' },
              ].map(({ placeholder, value, setter, type }, i) => (
                <motion.input
                  key={placeholder}
                  type={type}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                />
              ))}
              <motion.button
                className="auth-btn"
                onClick={handleRegister}
                disabled={loading}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,0,0,0.5)' }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </motion.button>
              <p className="switch">
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Already have account? Login
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="otp" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
              <h2 style={{ marginBottom: 10 }}>Verify Email</h2>
              <motion.p
                style={{ color: '#aaa', margin: '10px 0 20px', fontSize: '0.85rem', lineHeight: 1.5 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Enter the code sent to <strong style={{ color: 'white' }}>{email}</strong>
              </motion.p>
              <motion.input
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{ letterSpacing: '6px', fontSize: '1.2rem', textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              />
              <motion.button
                className="auth-btn"
                onClick={handleVerify}
                disabled={loading}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,0,0,0.5)' }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Register;
