import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, verifyUser } from '../services/authService'; // Import service functions

/* 🔥 UPDATED AUTH MODAL WITH OTP FLOW AND TOKEN HANDLING */
function AuthModal({ mode, close, switchMode }: any) {
  const navigate = useNavigate(); // Use navigate hook for routing

  // Internal state for the modal's form and step
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form'); // State to manage form or OTP view
  const [otp, setOtp] = useState(''); // State for OTP input

  // Reset form and step when the modal opens or mode changes
  useEffect(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    setOtp('');
    setStep('form'); // Always start with the form
  }, [mode]); // Dependency array includes 'mode' to reset when login/register switch

  // 🔴 LOGIN handler
  const handleLogin = async () => {
    try {
      const loginResult = await loginUser(email, password); // Use service function
      
      // Store the token and user info (e.g., in localStorage or context)
      // For demonstration, we'll log it and proceed with navigation.
      console.log('Login successful, received token:', loginResult.token);
      localStorage.setItem('authToken', loginResult.token); // Store token
      localStorage.setItem('userEmail', loginResult.email); // Store email or other user info
      localStorage.setItem('userId', loginResult.userId);
      localStorage.setItem('userRole', loginResult.role);

      // Navigate based on user role
      if (loginResult.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      close(); // Close modal on successful login

    } catch (err) {
      alert(err.message); // Display error message from the service
    }
  };

  // 🔴 REGISTER handler
  const handleRegister = async () => {
    try {
      await registerUser(username, email, password); // Use service function
      setStep('otp'); // Move to OTP step
      setOtp(''); // Clear OTP input for the next step
    } catch (err) {
      alert(err.message); // Display error message from the service
    }
  };

  // 🔴 VERIFY OTP handler
  const handleVerify = async () => {
    try {
      await verifyUser(email, otp); // Use service function
      alert('Email verified! You can now login');
      setStep('form'); // Reset to form step
      switchMode(); // Switch to login mode after verification
      close(); // Close modal after successful verification
    } catch (err) {
      alert(err.message); // Display error message from the service
    }
  };

  // Combined handler for the main action button
  const handleAuthSubmit = () => {
    if (step === 'otp') {
      handleVerify();
    } else if (mode === 'login') {
      handleLogin();
    } else { // mode === 'register'
      handleRegister();
    }
  };

  return (
    <div className="modal-overlay" onClick={step === 'otp' ? undefined : close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>

        {step === 'form' ? (
          <>
            {mode === 'register' && (
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="auth-btn"
              onClick={handleAuthSubmit}
            >
              {mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </>
        ) : ( // step === 'otp'
          <>
            <p>Please enter the verification code sent to {email}</p>
            <input
              placeholder="OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              className="auth-btn"
              onClick={handleAuthSubmit} // This will call handleVerify
            >
              Verify OTP
            </button>
          </>
        )}

        <p onClick={() => {
          switchMode(); // Switch mode first
          // Reset step and form fields when switching modes
          setStep('form');
          setUsername('');
          setEmail('');
          setPassword('');
          setOtp('');
        }} className="switch">
          {mode === 'login'
            ? 'No account? Register'
            : 'Already have account? Login'}
        </p>

      </div>
    </div>
  );
}

export default AuthModal;
