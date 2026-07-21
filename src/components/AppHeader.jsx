import React, { useState, useEffect, useRef } from 'react';
import AuthUserBadge from './AuthUserBadge.jsx';

/**
 * Responsive Header with hamburger menu on mobile
 * Props:
 *   theme: 'iching' | 'tarot'
 *   logo: JSX node
 *   title: string
 *   subtitle: string
 *   navItems: Array<{ label, href, onClick, icon }>  — items shown in nav / drawer
 *   actions: JSX node  — primary action buttons (always shown desktop; in drawer mobile)
 *   onLanguageToggle: fn
 *   languageLabel: string
 */
export default function AppHeader({
  theme = 'iching',
  logo,
  title,
  subtitle,
  navItems = [],
  primaryAction,   // JSX — e.g. "Lập quẻ mới" button
  onLanguageToggle,
  languageLabel,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer on outside click
  useEffect(() => {
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [drawerOpen]);

  // Close drawer on ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const isIching = theme === 'iching';

  const colors = isIching
    ? {
        bg: 'linear-gradient(135deg, #1a0a06 0%, #3d1a10 50%, #1a0a06 100%)',
        accent: '#d4a017',
        accentSoft: 'rgba(212,160,23,0.15)',
        text: 'rgba(255,255,255,0.85)',
        textMuted: 'rgba(255,255,255,0.55)',
        border: 'rgba(212,160,23,0.25)',
        drawerBg: '#1a0a06',
      }
    : {
        bg: 'linear-gradient(135deg, #0f0622 0%, #1a0a38 50%, #0f0622 100%)',
        accent: '#e5c158',
        accentSoft: 'rgba(229,193,88,0.12)',
        text: 'rgba(255,255,255,0.85)',
        textMuted: 'rgba(255,255,255,0.55)',
        border: 'rgba(229,193,88,0.25)',
        drawerBg: '#0f0622',
      };

  const hamburgerStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    borderRadius: 6,
    transition: 'background 0.2s',
  };

  const barStyle = (open, i) => ({
    width: 22,
    height: 2,
    background: colors.accent,
    borderRadius: 2,
    transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
    transformOrigin: 'center',
    transform: open
      ? i === 0 ? 'translateY(7px) rotate(45deg)'
      : i === 1 ? 'scaleX(0)'
      : 'translateY(-7px) rotate(-45deg)'
      : 'none',
    opacity: open && i === 1 ? 0 : 1,
  });

  return (
    <>
      <header style={{
        background: colors.bg,
        padding: '0 24px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          {/* ── Logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {logo}
            <div>
              <div style={{
                fontFamily: isIching ? "'Noto Serif', serif" : "'Cinzel', serif",
                fontSize: '1.125rem',
                fontWeight: 700,
                color: colors.accent,
                letterSpacing: '0.05em',
                lineHeight: 1.2,
              }}>{title}</div>
              <div style={{
                fontSize: '0.625rem',
                color: colors.textMuted,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>{subtitle}</div>
            </div>
          </div>

          {/* ── Desktop Nav ── */}
          <div className="app-header-desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}>
            {navItems.map((item, i) => (
              item.href
                ? <a key={i} href={item.href} target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    style={{ color: colors.textMuted, textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = colors.accent}
                    onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}
                  >{item.icon} {item.label}</a>
                : <button key={i} onClick={item.onClick}
                    style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '0.875rem', transition: 'color 0.2s', padding: '4px 0' }}
                    onMouseEnter={e => e.currentTarget.style.color = colors.accent}
                    onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}
                  >{item.icon} {item.label}</button>
            ))}

            {/* Language toggle */}
            {onLanguageToggle && (
              <button onClick={onLanguageToggle} style={{
                background: colors.accentSoft,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.accent,
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(${isIching ? '212,160,23' : '229,193,88'},0.25)`}
              onMouseLeave={e => e.currentTarget.style.background = colors.accentSoft}
              >{languageLabel}</button>
            )}

            <AuthUserBadge />

            {primaryAction && <div>{primaryAction}</div>}
          </div>

          {/* ── Hamburger (Mobile only) ── */}
          <button
            className="app-header-hamburger"
            style={hamburgerStyle}
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Menu"
            onMouseEnter={e => e.currentTarget.style.background = colors.accentSoft}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span style={barStyle(drawerOpen, 0)} />
            <span style={barStyle(drawerOpen, 1)} />
            <span style={barStyle(drawerOpen, 2)} />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }} onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        ref={drawerRef}
        className="app-header-drawer"
        style={{
          position: 'fixed',
          top: 56,
          left: 0, right: 0,
          zIndex: 199,
          background: colors.drawerBg,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(-110%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* User badge */}
        <div style={{ paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
          <AuthUserBadge mobileInline />
        </div>

        {/* Nav links */}
        {navItems.map((item, i) => (
          item.href
            ? <a key={i} href={item.href} target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setDrawerOpen(false)}
                style={{
                  color: colors.text, textDecoration: 'none',
                  fontSize: '1rem', padding: '10px 0',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >{item.icon} {item.label}</a>
            : <button key={i} onClick={() => { item.onClick?.(); setDrawerOpen(false); }}
                style={{
                  background: 'none', border: 'none', color: colors.text, cursor: 'pointer',
                  fontSize: '1rem', padding: '10px 0', textAlign: 'left', width: '100%',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >{item.icon} {item.label}</button>
        ))}

        {/* Language toggle */}
        {onLanguageToggle && (
          <button onClick={() => { onLanguageToggle(); setDrawerOpen(false); }} style={{
            background: colors.accentSoft,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            color: colors.accent,
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: 600,
            textAlign: 'center',
          }}>{languageLabel}</button>
        )}

        {/* Primary action */}
        {primaryAction && (
          <div onClick={() => setDrawerOpen(false)}>
            {primaryAction}
          </div>
        )}
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        .app-header-desktop-nav { display: flex !important; }
        .app-header-hamburger { display: none !important; }
        .app-header-drawer { display: flex !important; }
        @media (max-width: 768px) {
          .app-header-desktop-nav { display: none !important; }
          .app-header-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
