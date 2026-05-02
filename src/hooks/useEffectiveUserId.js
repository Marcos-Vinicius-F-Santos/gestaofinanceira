import { useMemo } from 'react';
import { useAdminClient } from '../contexts/AdminClientContext';
import { useAuth } from '../contexts/AuthContext';

export function useEffectiveUserId() {
  const { user, isAdmin, role } = useAuth();
  const { selectedClientId } = useAdminClient();

  return useMemo(() => {
    if (role === 'client') return user?.uid || '';
    if (isAdmin && selectedClientId) return selectedClientId;
    return user?.uid || '';
  }, [isAdmin, role, selectedClientId, user?.uid]);
}
