import React, { useState, useEffect } from 'react';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

const DEFAULT_PLANS = [
  {
    name: 'free',
    label: 'Miễn Phí',
    emoji: '⚡',
    price: 0,
    dailyLimit: 1,
    monthlyLimit: 30,
    canBonus: false,
    color: '#64748b',
    highlight: false,
  },
  {
    name: 'lite',
    label: 'Lite',
    emoji: '🌟',
    price: 49000,
    dailyLimit: 5,
    monthlyLimit: 60,
    canBonus: false,
    color: '#f59e0b',
    highlight: false,
  },
  {
    name: 'premium',
    label: 'Premium',
    emoji: '💎',
    price: 99000,
    dailyLimit: -1,
    monthlyLimit: 180,
    canBonus: true,
    color: '#6366f1',
    highlight: true,
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
  const [dynamicPlans, setDynamicPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    if (isOpen) {
      fetch(`${SSO_BASE}/plans/config`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            // Merge dynamic plans from DB with UI metadata
            const merged = data.plans.map((p) => {
              const meta = DEFAULT_PLANS.find((dp) => dp.name === p.name) || {};
              return {
                ...meta,
                ...p,
                label: p.label || meta.label || p.name,
                emoji: meta.emoji || '📦',
                color: meta.color || '#6366f1',
                highlight: p.name === 'premium',
              };
            });
            setDynamicPlans(merged);
          }
        })
        .catch((err) => console.error('Failed to load plans config:', err));
    }
  }, [isOpen]);

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
      alert(result.error || 'Không thể xin thêm câu');
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return 'Miễn phí';
    return `${Number(price).toLocaleString('vi-VN')}đ`;
  };

  const getFeatures = (plan) => {
    const dailyText =
      plan.dailyLimit === -1
        ? 'Không giới hạn lượt/ngày'
        : `${plan.dailyLimit} lượt hỏi AI mỗi ngày`;
    const monthlyText =
      plan.monthlyLimit === -1
        ? 'Không giới hạn lượt/tháng'
        : `Tối đa ${plan.monthlyLimit} lượt/tháng`;

    if (plan.name === 'free') {
      return [
        dailyText,
        monthlyText,
        'Lưu lịch sử quẻ / bói',
        'Xem giải nghĩa cơ bản',
      ];
    }
    if (plan.name === 'lite') {
      return [
        dailyText,
        monthlyText,
        'Lưu lịch sử không giới hạn',
        'Giải nghĩa chi tiết hơn',
      ];
    }
    // Premium
    return [
      dailyText,
      monthlyText,
      '✨ Hỏi thêm 5 câu AI cho mỗi quẻ / bói',
      'Phân tích AI sâu nhất',
      'Ưu tiên hỗ trợ',
    ];
  };

  const getNotIncluded = (plan) => {
    if (plan.name === 'free') return ['Hỏi thêm 5 câu cho mỗi quẻ / bói', 'Ưu tiên hỗ trợ'];
    if (plan.name === 'lite') return ['Hỏi thêm 5 câu cho mỗi quẻ / bói'];
    return [];
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
              💎 Bạn đang dùng gói Premium — có thể hỏi thêm 5 câu cho quẻ này!
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
          {dynamicPlans.map((plan) => {
            const features = getFeatures(plan);
            const notIncluded = getNotIncluded(plan);

            return (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${plan.highlight ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  padding: '20px',
                  position: 'relative',
                  transform: plan.highlight ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '20px',
                    }}
                  >
                    ĐỀ XUẤT
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '1.5rem' }}>{plan.emoji}</div>
                  <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', marginTop: '4px' }}>
                    {plan.label}
                  </div>
                  <div style={{ color: plan.color, fontWeight: 800, fontSize: '1.3rem', marginTop: '4px' }}>
                    {formatPrice(plan.price)}
                    {plan.price > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/tháng</span>
                    )}
                  </div>
                </div>

                {features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}

                {notIncluded.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: '#475569',
                      marginBottom: '6px',
                      textDecoration: 'line-through',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>✕</span> {f}
                  </div>
                ))}

                {plan.name !== 'free' && plan.name !== currentPlan && (
                  <button
                    onClick={() => alert('Liên hệ admin để nâng cấp gói!')}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      background: plan.highlight
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
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
            );
          })}
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
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
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
