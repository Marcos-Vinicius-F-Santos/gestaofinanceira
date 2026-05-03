import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../shared/LoadingState';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, loading, mustChangePassword, role } = useAuth();

  if (loading) {
    return <LoadingState fullScreen label="Verificando acesso..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
