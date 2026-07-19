import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * AuthUserBadge — hiển thị avatar + tên user hoặc nút "Đăng nhập"
 * Dùng trong header của TarotNow
 */
export default function AuthUserBadge() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        id="sso-login-btn"
        onClick={login}
        style={{
          padding: '6px 14px',
          background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
          border: 'none',
          borderRadius: 8,
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.target.style.opacity = '0.85'}
        onMouseLeave={e => e.target.style.opacity = '1'}
      >
        Đăng nhập
      </button>
    );
  }

  const initials = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        id="sso-user-badge"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '4px 10px 4px 4px',
          cursor: 'pointer',
          color: 'inherit',
          fontFamily: 'inherit',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
          }
        </div>

        <span style={{ fontSize: '0.8rem', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.displayName || user.email?.split('@')[0]}
        </span>

        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#1a1a24',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 8, minWidth: 180,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || 'Người dùng'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888899', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>

          <button
            id="sso-logout-btn"
            onClick={() => { setOpen(false); logout(); }}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'transparent',
              border: 'none', borderRadius: 8,
              color: '#ff8e8e', fontSize: '0.85rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
