import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getUserProfile, login as loginService, logout as logoutService, subscribeAuthState } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const userProfile = await getUserProfile(firebaseUser.uid);
      if (!userProfile) {
        await logoutService();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (userProfile && userProfile.role !== 'admin' && userProfile.status !== 'active') {
        await logoutService();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setProfile(userProfile);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role || 'client',
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: profile?.role === 'admin',
      login: loginService,
      logout: logoutService,
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      profile: null,
      role: 'client',
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      login: async () => {
        throw new Error('Autenticacao indisponivel.');
      },
      logout: async () => {},
    };
  }

  return context;
}
