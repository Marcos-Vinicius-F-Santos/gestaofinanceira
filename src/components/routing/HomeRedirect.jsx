import { Navigate } from 'react-router-dom';
import { useAdminClient } from '../../contexts/AdminClientContext';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeRedirect() {
  const { isAdmin } = useAuth();
  const { isViewingClient } = useAdminClient();
  return <Navigate to={isAdmin && !isViewingClient ? '/admin/clientes' : '/produtos'} replace />;
}
