import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CheckoutPage from './pages/CheckoutPage';
import ProtectedRoute from './components/ProtectedRoute';
import LiveChat from './components/LiveChat';
import SupportPanel from './components/SupportPanel';
import SocialProof from './components/SocialProof';
import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';
import CookieConsent from './components/CookieConsent';
import { getRole, isAuthenticated } from './utils/auth';

const NO_CHAT_ROUTES = ['/login', '/register', '/forgot-password', '/contact', '/checkout'];

function App() {
  const location = useLocation();
  const showChat = !NO_CHAT_ROUTES.includes(location.pathname);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <SocketProvider>
          <ScrollProgress />

          <div className="app">
            <Toaster
              position="top-center"
              toastOptions={{
                style: { background: '#0a0a0a', color: '#fff', border: '1px solid #333' },
                success: { iconTheme: { primary: 'red', secondary: '#000' } },
              }}
            />

            <PageTransition>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </PageTransition>

            {showChat && (
              isAuthenticated() && ['support', 'admin'].includes(getRole())
                ? <SupportPanel />
                : <LiveChat />
            )}
            <SocialProof />
            <CookieConsent />
          </div>
        </SocketProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
