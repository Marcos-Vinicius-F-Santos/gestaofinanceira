import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'gestao-pro-selected-client';
const AdminClientContext = createContext(null);

export function AdminClientProvider({ children }) {
  const { isAdmin, loading } = useAuth();
  const [selectedClient, setSelectedClientState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!loading && !isAdmin && selectedClient) {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedClientState(null);
    }
  }, [isAdmin, loading, selectedClient]);

  const setSelectedClient = useCallback((client) => {
    const nextClient = client
      ? {
          uid: client.uid,
          nome: client.nome || client.name || client.email,
          email: client.email,
          status: client.status,
        }
      : null;

    if (nextClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextClient));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setSelectedClientState(nextClient);
  }, []);

  const clearSelectedClient = useCallback(() => setSelectedClient(null), [setSelectedClient]);

  const value = useMemo(
    () => ({
      selectedClient,
      selectedClientId: selectedClient?.uid || '',
      isViewingClient: Boolean(isAdmin && selectedClient?.uid),
      setSelectedClient,
      clearSelectedClient,
    }),
    [clearSelectedClient, isAdmin, selectedClient, setSelectedClient],
  );

  return <AdminClientContext.Provider value={value}>{children}</AdminClientContext.Provider>;
}

export function useAdminClient() {
  const context = useContext(AdminClientContext);

  if (!context) {
    return {
      selectedClient: null,
      selectedClientId: '',
      isViewingClient: false,
      setSelectedClient: () => {},
      clearSelectedClient: () => {},
    };
  }

  return context;
}
