import { useMemo } from 'react';
import { useAdminClient } from '../contexts/AdminClientContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffectiveUserId } from './useEffectiveUserId';

export function useDataScope(targetUserId = '') {
  const { user, isAdmin } = useAuth();
  const { isViewingClient } = useAdminClient();
  const effectiveUserId = useEffectiveUserId();
  const scopedUserId = targetUserId || (isAdmin ? (isViewingClient ? effectiveUserId : '') : effectiveUserId);

  return useMemo(
    () => ({
      uid: user?.uid || '',
      isAdmin,
      effectiveUserId: scopedUserId,
      targetUserId: scopedUserId || undefined,
    }),
    [user?.uid, isAdmin, scopedUserId],
  );
}
