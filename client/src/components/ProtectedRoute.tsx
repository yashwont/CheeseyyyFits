import { Navigate } from 'react-router-dom';
import { isAuthenticated, getRole, clearAuth } from '../utils/auth';

interface Props {
  children: React.ReactNode;
  role?: 'admin' | 'client';
}

function ProtectedRoute({ children, role }: Props) {
  if (!isAuthenticated()) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }
  if (role && getRole() !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
