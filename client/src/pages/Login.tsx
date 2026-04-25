import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../services/authService';
import { isAuthenticated, getRole } from '../utils/auth';
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.success('Login successful!');
      navigate(result.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="auth-page">
      <motion.button
        className="auth-back-btn"
        onClick={() => navigate('/')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
        transition={{ duration: 0.3 }}
      >
        ← Back
      </motion.button>

      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Login
        </motion.h2>

        {[
          { placeholder: 'Email', value: email, setter: setEmail, type: 'email' },
          { placeholder: 'Password', value: password, setter: setPassword, type: 'password' },
        ].map(({ placeholder, value, setter, type }, i) => (
          <motion.input
            key={placeholder}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setter(e.target.value)}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
          />
        ))}

        <motion.button
          className="auth-btn"
          onClick={handleLogin}
          disabled={loading}
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,0,0,0.5)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </motion.button>

        <motion.p className="switch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>No account? Register</Link>
        </motion.p>
        <motion.p className="switch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'none' }}>Forgot password?</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default Login;
