import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, notice: '' });

  useEffect(() => {
    let cancelled = false;
    api('/api/auth/me')
      .then(({ user }) => !cancelled && setState({ status: user ? 'authed' : 'anon', user, notice: '' }))
      .catch((err) => !cancelled && setState({ status: 'anon', user: null, notice: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () =>
      setState({ status: 'anon', user: null, notice: 'Your session ended. Sign in again to continue.' });
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setState({ status: 'authed', user, notice: '' });
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setState({ status: 'anon', user: null, notice: '' });
  }, []);

  const setUser = useCallback((user) => setState((s) => ({ ...s, user })), []);

  const value = useMemo(() => ({ ...state, login, logout, setUser }), [state, login, logout, setUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
