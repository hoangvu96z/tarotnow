import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Dev: VITE_SSO_URL trống → dùng relative path qua vite proxy (/sso/*)
// Prod: VITE_SSO_URL=https://sso.vunph.click → gọi thẳng tới SSO server
const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${SSO_BASE}/sso/me`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleStorage = (e) => {
      if (e.key === 'vInfiSSO-state') fetchUser();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', fetchUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', fetchUser);
    };
  }, [fetchUser]);

  const login = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${SSO_BASE}/ui/sso?redirect=${returnUrl}`;
  };

  const logout = async () => {
    try {
      await fetch(`${SSO_BASE}/sso/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.setItem('vInfiSSO-state', JSON.stringify({ type: 'logout' }));
      setUser(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetch: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
