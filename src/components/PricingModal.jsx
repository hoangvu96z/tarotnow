import React, { useState } from 'react';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

const PLANS = [
  {
    name: 'free',
    label: 'Miễn Phí',
    emoji: '⚡',
    price: 'Miễn phí',
    color: '#64748b',
    features: [
      '1 lượt hỏi AI mỗi ngày',
      'Lưu lịch sử quẻ',
      'Xem giải nghĩa cơ bản',
    ],
    notIncluded: ['Hỏi thêm 5 câu', 'Ưu tiên hỗ trợ'],
  },
  {
    name: 'lite',
    label: 'Lite',
    emoji: '🌟',
    price: '49.000đ',
    period: '/tháng',
    color: '#f59e0b',
    highlight: false,
    features: [
      '5 lượt hỏi AI mỗi ngày',
      'Tối đa 60 lượt/tháng',
      'Lưu lịch sử không giới hạn',
      'Giải nghĩa chi tiết hơn',
    ],
    notIncluded: ['Hỏi thêm 5 câu'],
  },
  {
    name: 'premium',
    label: 'Premium',
    emoji: '💎',
    price: '99.000đ',
    period: '/tháng',
    color: '#6366f1',
    highlight: true,
    features: [
      'Không giới hạn lượt/ngày',
      'Tối đa 180 lượt/tháng',
      '✨ Hỏi thêm 5 câu mỗi ngày',
      'Phân tích AI sâu nhất',
      'Ưu tiên hỗ trợ',
    ],
    notIncluded: [],
  },
];

export default function PricingModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  canBonus = false,
  onRequestBonus,
  onApplyCoupon,
}) {
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [bonusLoading, setBonusLoading] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg('');
    const result = await onApplyCoupon(couponCode.trim());
    setCouponMsg(result.ok ? `✅ ${result.message}` : `❌ ${result.error}`);
    setCouponLoading(false);
    if (result.ok) setTimeout(onClose, 2000);
  };

  const handleBonus = async () => {
    setBonusLoading(true);
    const result = await onRequestBonus();
    setBonusLoading(false);
    if (result.ok) {
      onClose();
    } else {
      alert(result.error);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '760px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚀</div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Nâng cấp để hỏi nhiều hơn
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>
            Bạn đã dùng hết lượt AI hôm nay.{' '}
            {canBonus && <strong style={{ color: '#818cf8' }}>Hoặc dùng "Hỏi thêm 5 câu" ngay bây giờ!</strong>}
          </p>
        </div>

        {/* Bonus button (Premium only) */}
        {canBonus && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '12px', padding: '16px', marginBottom: '24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#c4b5fd', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 600 }}>
              💎 Bạn đang dùng gói Premium — có thể hỏi thêm 5 câu hôm nay!
            </div>
            <button
              onClick={handleBonus}
              disabled={bonusLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '10px 24px', fontSize: '0.9rem', fontWeight: 700,
                cursor: bonusLoading ? 'not-allowed' : 'pointer',
                opacity: bonusLoading ? 0.7 : 1,
              }}
            >
              {bonusLoading ? 'Đang xử lý...' : '✨ Hỏi thêm 5 câu ngay'}
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              background: plan.highlight
                ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${plan.highlight ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '14px', padding: '20px',
              position: 'relative',
              transform: plan.highlight ? 'scale(1.02)' : 'none',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                  padding: '4px 12px', borderRadius: '20px',
                }}>
                  ĐỀ XUẤT
                </div>
              )}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '1.5rem' }}>{plan.emoji}</div>
                <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', marginTop: '4px' }}>{plan.label}</div>
                <div style={{ color: plan.color, fontWeight: 800, fontSize: '1.3rem', marginTop: '4px' }}>
                  {plan.price}<span style={{ fontSize: '0.75rem', color: '#64748b' }}>{plan.period}</span>
                </div>
              </div>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
              {plan.notIncluded?.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', textDecoration: 'line-through' }}>
                  <span style={{ flexShrink: 0 }}>✕</span> {f}
                </div>
              ))}
              {plan.name !== 'free' && plan.name !== currentPlan && (
                <button
                  onClick={() => alert('Liên hệ admin để nâng cấp gói!')}
                  style={{
                    width: '100%', marginTop: '14px',
                    background: plan.highlight
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255,255,255,0.08)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '9px', fontSize: '0.82rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Nâng cấp {plan.label}
                </button>
              )}
              {plan.name === currentPlan && (
                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.78rem', color: '#475569' }}>
                  Gói hiện tại
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Coupon input */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
            🎟️ Có mã khuyến mãi? Nhập tại đây
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
              placeholder="VD: TRIAL7, PREMIUM30..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f8fafc', borderRadius: '8px',
                padding: '9px 14px', fontSize: '0.88rem', outline: 'none',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700,
                cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                opacity: couponLoading || !couponCode.trim() ? 0.6 : 1,
              }}
            >
              {couponLoading ? '...' : 'Áp dụng'}
            </button>
          </div>
          {couponMsg && (
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: couponMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>
              {couponMsg}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '16px',
            background: 'transparent', color: '#64748b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '10px',
            fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Để sau — quay lại ngày mai
        </button>
      </div>
    </div>
  );
}
