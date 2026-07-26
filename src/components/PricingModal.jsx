import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

const DEFAULT_PLANS = [
  {
    name: 'free',
    labelVi: 'Miễn Phí',
    labelEn: 'Free',
    emoji: '⚡',
    price: 0,
    dailyLimit: 1,
    monthlyLimit: 30,
    canBonus: false,
    color: '#94a3b8',
    highlight: false,
  },
  {
    name: 'lite',
    labelVi: 'Lite',
    labelEn: 'Lite',
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
    labelVi: 'Premium',
    labelEn: 'Premium',
    emoji: '💎',
    price: 99000,
    dailyLimit: -1,
    monthlyLimit: 180,
    canBonus: true,
    color: '#818cf8',
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
  const { t, language } = useLanguage();
  const isEn = language === 'en';

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
            const merged = data.plans.map((p) => {
              const meta = DEFAULT_PLANS.find((dp) => dp.name === p.name) || {};
              return {
                ...meta,
                ...p,
                label: isEn ? (meta.labelEn || p.label) : (p.label || meta.labelVi),
                emoji: meta.emoji || '🔮',
                color: meta.color || '#818cf8',
                highlight: p.name === 'premium',
              };
            });
            setDynamicPlans(merged);
          }
        })
        .catch((err) => console.error('Failed to load plans config:', err));
    }
  }, [isOpen, isEn]);

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
      alert(result.error || (isEn ? 'Failed to request bonus' : 'Không thể xin thêm câu'));
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return isEn ? 'Free' : 'Miễn phí';
    return `${Number(price).toLocaleString('vi-VN')}đ`;
  };

  const getFeatures = (plan) => {
    const dailyText = isEn
      ? (plan.dailyLimit === -1 ? 'Unlimited AI asks/day' : `${plan.dailyLimit} AI ask(s) per day`)
      : (plan.dailyLimit === -1 ? 'Không giới hạn lượt/ngày' : `${plan.dailyLimit} lượt hỏi AI mỗi ngày`);

    const monthlyText = isEn
      ? (plan.monthlyLimit === -1 ? 'Unlimited asks/month' : `Max ${plan.monthlyLimit} asks/month`)
      : (plan.monthlyLimit === -1 ? 'Không giới hạn lượt/tháng' : `Tối đa ${plan.monthlyLimit} lượt/tháng`);

    if (plan.name === 'free') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Save reading history' : 'Lưu lịch sử trải bài',
        isEn ? 'Basic Tarot interpretation' : 'Xem giải nghĩa cơ bản',
      ];
    }
    if (plan.name === 'lite') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Unlimited history saving' : 'Lưu lịch sử không giới hạn',
        isEn ? 'In-depth AI analysis' : 'Giải nghĩa chi tiết hơn',
      ];
    }
    return [
      dailyText,
      monthlyText,
      isEn ? '✨ 5 follow-up questions per reading' : '✨ Hỏi thêm 5 câu AI cho mỗi trải bài',
      isEn ? 'Deepest AI Tarot insights' : 'Phân tích AI sâu nhất',
      isEn ? 'Priority customer support' : 'Ưu tiên hỗ trợ',
    ];
  };

  const getNotIncluded = (plan) => {
    if (plan.name === 'free') {
      return [
        isEn ? '5 follow-up questions per reading' : 'Hỏi thêm 5 câu cho mỗi trải bài',
        isEn ? 'Priority support' : 'Ưu tiên hỗ trợ',
      ];
    }
    if (plan.name === 'lite') {
      return [
        isEn ? '5 follow-up questions per reading' : 'Hỏi thêm 5 câu cho mỗi trải bài',
      ];
    }
    return [];
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '760px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.8), 0 0 40px rgba(139, 92, 246, 0.2)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🔮</div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {isEn ? 'Upgrade Your Tarot Plan' : 'Nâng Cấp Gói Luận Giải Tarot'}
          </h2>
          <p style={{ color: '#c4b5fd', fontSize: '0.9rem', marginTop: '8px' }}>
            {isEn ? 'You have reached your daily Tarot AI quota limit.' : 'Bạn đã dùng hết lượt luận giải Tarot AI hôm nay.'}{' '}
            {canBonus && <strong style={{ color: '#818cf8' }}>{isEn ? 'Or use "Ask 5 Follow-ups" now!' : 'Hoặc dùng "Hỏi thêm 5 câu" ngay bây giờ!'}</strong>}
          </p>
        </div>

        {/* Bonus button (Premium only) */}
        {canBonus && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '14px', padding: '16px', marginBottom: '24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#c4b5fd', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 600 }}>
              {isEn ? '💎 You are on Premium plan — ask 5 follow-up questions for this reading!' : '💎 Bạn đang dùng gói Premium — có thể hỏi thêm 5 câu cho trải bài này!'}
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
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}
            >
              {bonusLoading ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? '✨ Ask 5 Questions Now' : '✨ Hỏi thêm 5 câu ngay')}
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
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${plan.highlight ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
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
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isEn ? 'RECOMMENDED' : 'ĐỀ XUẤT'}
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
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{isEn ? '/month' : '/tháng'}</span>
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
                    onClick={() => alert(isEn ? 'Please contact Admin to upgrade your plan!' : 'Liên hệ admin để nâng cấp gói!')}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      background: plan.highlight
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      border: plan.highlight ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '9px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isEn ? `Upgrade ${plan.label}` : `Nâng cấp ${plan.label}`}
                  </button>
                )}
                {plan.name === currentPlan && (
                  <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.78rem', color: '#64748b' }}>
                    {isEn ? 'Current Plan' : 'Gói hiện tại'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coupon input */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ color: '#c4b5fd', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
            {isEn ? '🎟️ Have a promo code? Enter here' : '🎟️ Có mã khuyến mãi? Nhập tại đây'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder={isEn ? 'e.g. TRIAL7, PROMO50...' : 'VD: TRIAL7, PREMIUM30...'}
              style={{
                flex: 1, background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
              {couponLoading ? '...' : (isEn ? 'Apply' : 'Áp dụng')}
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
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px', padding: '10px',
            fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {isEn ? 'Maybe later — return tomorrow' : 'Để sau — quay lại ngày mai'}
        </button>
      </div>
    </div>
  );
}
