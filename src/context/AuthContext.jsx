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
      // 1. Tách sso_token từ URL query string nếu vừa redirect từ SSO về
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('sso_token');

      if (tokenFromUrl) {
        localStorage.setItem('sso_token', tokenFromUrl);
        // Xóa sso_token khỏi thanh địa chỉ URL mà không reload trang
        urlParams.delete('sso_token');
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }

      // 2. Đọc token từ localStorage
      const storedToken = localStorage.getItem('sso_token');
      const headers = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch(`${SSO_BASE}/sso/me`, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        if (data.token) {
          localStorage.setItem('sso_token', data.token);
        }
      } else {
        localStorage.removeItem('sso_token');
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Lắng nghe sự thay đổi trạng thái SSO từ các tab khác
    const handleStorage = (e) => {
      if (e.key === 'vInfiSSO-state') {
        fetchUser();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', fetchUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', fetchUser);
    };
  }, [fetchUser]);

  const login = () => {
    // Điều hướng sang trang đăng nhập SSO kèm theo URL trả về (redirect)
    const url = new URL(window.location.href);
    url.searchParams.delete('sso_token');
    const returnUrl = encodeURIComponent(url.toString());
    window.location.href = `${SSO_BASE}/ui/sso?redirect=${returnUrl}`;
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('sso_token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

      await fetch(`${SSO_BASE}/sso/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      localStorage.removeItem('sso_token');
      localStorage.setItem('vInfiSSO-state', JSON.stringify({ type: 'logout', t: Date.now() }));
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
