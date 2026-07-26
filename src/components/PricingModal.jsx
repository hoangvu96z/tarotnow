import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

const SSO_BASE = import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click';

const DEFAULT_PLANS = [
  {
    name: 'free',
    labelEn: 'Free Plan',
    labelVi: 'Gói Miễn Phí',
    price: 0,
    dailyLimit: 1,
    monthlyLimit: 30,
    bonusAmount: 0,
    canBonus: false,
    emoji: '⚡',
    color: '#a3a3a3',
  },
  {
    name: 'lite',
    labelEn: 'Lite Plan',
    labelVi: 'Gói Lite',
    price: 10000,
    dailyLimit: 5,
    monthlyLimit: 60,
    bonusAmount: 0,
    canBonus: false,
    emoji: '🌟',
    color: '#60a5fa',
  },
  {
    name: 'premium',
    labelEn: 'Premium Plan',
    labelVi: 'Gói Premium',
    price: 20000,
    dailyLimit: -1,
    monthlyLimit: 180,
    bonusAmount: 5,
    canBonus: true,
    emoji: '💎',
    color: '#a78bfa',
  },
];

export default function PricingModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  canBonus = false,
  expiresAt = null,
  daysRemaining = null,
  isExpiringSoon = false,
  isOverride = false,
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
                emoji: meta.emoji || '📦',
                color: meta.color || '#a78bfa',
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
    const res = await onApplyCoupon?.(couponCode.trim());
    setCouponLoading(false);
    if (res?.ok) {
      setCouponMsg(`✅ ${res.message || (isEn ? 'Coupon applied successfully!' : 'Đã áp dụng mã thành công!')}`);
      setCouponCode('');
    } else {
      setCouponMsg(`❌ ${res?.error || (isEn ? 'Invalid code' : 'Mã không hợp lệ')}`);
    }
  };

  const handleBonus = async () => {
    setBonusLoading(true);
    const res = await onRequestBonus?.();
    setBonusLoading(false);
    if (res?.ok) {
      alert(isEn ? '✨ Granted 5 follow-up questions for this reading!' : '✨ Bạn đã nhận được 5 câu hỏi thêm cho trải bài này!');
      onClose();
    } else {
      alert(res?.error || (isEn ? 'Failed to request bonus' : 'Không thể xin thêm câu'));
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return isEn ? 'Free' : 'Miễn phí';
    return `${price.toLocaleString('vi-VN')}đ`;
  };

  const getFeatures = (p) => {
    const dailyText = isEn
      ? (p.dailyLimit === -1 ? 'Unlimited daily AI questions' : `${p.dailyLimit} AI questions/day`)
      : (p.dailyLimit === -1 ? 'Hỏi AI không giới hạn/ngày' : `${p.dailyLimit} lượt hỏi AI/ngày`);

    const monthlyText = isEn
      ? (p.monthlyLimit === -1 ? 'Unlimited monthly limit' : `Max ${p.monthlyLimit} questions/month`)
      : (p.monthlyLimit === -1 ? 'Không giới hạn tháng' : `Tối đa ${p.monthlyLimit} lượt/tháng`);

    if (p.name === 'free') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Save reading history' : 'Lưu lịch sử trải bài',
        isEn ? 'Basic Tarot interpretation' : 'Xem giải nghĩa cơ bản',
      ];
    }
    if (p.name === 'lite') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Unlimited history saving' : 'Lưu lịch sử không giới hạn',
        isEn ? 'In-depth AI analysis' : 'Giải nghĩa chi tiết hơn',
      ];
    }
    // premium
    return [
      dailyText,
      monthlyText,
      isEn ? '✨ 5 follow-up questions per reading' : '✨ Hỏi thêm 5 câu AI cho mỗi trải bài',
      isEn ? 'Deepest AI Tarot insights' : 'Phân tích AI sâu nhất',
      isEn ? 'Priority customer support' : 'Ưu tiên hỗ trợ',
    ];
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #181528 0%, #0d0a1a 100%)',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '760px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.7), 0 0 30px rgba(167, 139, 250, 0.15)',
        }}
      >
        {/* Admin Unlimited Access Notice Banner */}
        {currentPlan === 'admin' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.25), rgba(167, 139, 250, 0.25))',
            border: '1px solid rgba(167, 139, 250, 0.6)',
            borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            textAlign: 'center', color: '#c4b5fd', fontSize: '0.92rem', fontWeight: 800,
            lineHeight: 1.5,
          }}>
            👑 {isEn
              ? 'Admin Account: You have permanent unlimited access to all AI reading features!'
              : 'Tài khoản Admin: Bạn có quyền truy cập không giới hạn vĩnh viễn tất cả các tính năng AI!'}
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🔮</div>
          <h2 style={{ color: '#f5d78e', fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: "'Cinzel', serif" }}>
            {currentPlan === 'admin'
              ? (isEn ? 'Admin Account' : 'Tài Khoản Admin')
              : isOverride || currentPlan === 'premium'
              ? (isEn ? 'Your Service Plan' : 'Gói Dịch Vụ Của Bạn')
              : (isEn ? 'Upgrade Your Tarot Plan' : 'Nâng Cấp Gói Luận Giải Tarot')}
          </h2>
          <p style={{ color: '#d4b886', fontSize: '0.9rem', marginTop: '8px' }}>
            {isOverride
              ? (isEn ? 'You are currently using free full features granted by Admin.' : 'Bạn đang được Admin kích hoạt đặc quyền dùng miễn phí toàn bộ tính năng cao cấp!')
              : (isEn ? 'Choose the best plan for deeper Tarot AI wisdom.' : 'Chọn gói phù hợp để trải nghiệm luận giải Tarot AI sâu sắc hơn.')}
          </p>
          {expiresAt && (
            <div style={{ color: '#a3a3a3', fontSize: '0.8rem', marginTop: '4px' }}>
              📅 {isEn ? `Subscription Expires: ${new Date(expiresAt).toLocaleDateString('en-US')}` : `Hạn dùng gói hiện tại: đến ngày ${new Date(expiresAt).toLocaleDateString('vi-VN')}`}
              {daysRemaining !== null && ` (${isEn ? `${daysRemaining} days left` : `còn ${daysRemaining} ngày`})`}
            </div>
          )}
        </div>

        {/* Admin Override Trial Warning Banner */}
        {isOverride && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(16, 185, 129, 0.25))',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            textAlign: 'center', color: '#a5b4fc', fontSize: '0.88rem', fontWeight: 700,
            lineHeight: 1.5,
          }}>
            🎁 {isEn
              ? 'Admin Special Privileges Active: You are using premium AI features 100% FREE without needing to purchase any plan!'
              : '🎁 Đang bật Đặc quyền Admin: Bạn đang được dùng MIỄN PHÍ 100% toàn bộ tính năng cao cấp mà KHÔNG CẦN mua bất kỳ gói nào!'}
          </div>
        )}

        {/* Expiring Soon Warning Banner */}
        {daysRemaining !== null && daysRemaining <= 5 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            textAlign: 'center', color: '#fbbf24', fontSize: '0.88rem', fontWeight: 700,
            lineHeight: 1.5,
          }}>
            ⚠️ {isEn
              ? `Warning: Your subscription will expire in ${daysRemaining} days (${expiresAt ? new Date(expiresAt).toLocaleDateString('en-US') : ''}). Renew now to maintain uninterrupted access!`
              : `Cảnh báo: Gói dịch vụ của bạn sẽ hết hạn sau ${daysRemaining} ngày nữa (${expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : ''}). Gia hạn ngay để không bị gián đoạn!`}
          </div>
        )}

        {/* Bonus button (Premium only) */}
        {canBonus && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.25), rgba(139, 69, 19, 0.3))',
            border: '1px solid rgba(184, 134, 11, 0.5)',
            borderRadius: '14px', padding: '16px', marginBottom: '24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#f5d78e', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 600 }}>
              {isEn ? '💎 You are on Premium plan — ask 5 follow-up questions for this reading!' : '💎 Bạn đang dùng gói Premium — có thể hỏi thêm 5 câu cho trải bài này!'}
            </div>
            <button
              onClick={handleBonus}
              disabled={bonusLoading}
              style={{
                background: 'linear-gradient(135deg, #b8860b, #d97706)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '10px 24px', fontSize: '0.9rem', fontWeight: 700,
                cursor: bonusLoading ? 'not-allowed' : 'pointer',
                opacity: bonusLoading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(184,134,11,0.4)',
              }}
            >
              {bonusLoading ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? '✨ Ask 5 Questions Now' : '✨ Hỏi thêm 5 câu ngay')}
            </button>
          </div>
        )}

        {/* Plan Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {dynamicPlans.map((plan) => {
            const isCurrent = currentPlan === plan.name;
            const features = getFeatures(plan);

            return (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight
                    ? 'linear-gradient(145deg, rgba(184, 134, 11, 0.2), rgba(139, 69, 19, 0.25))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isCurrent
                    ? '2px solid #f5d78e'
                    : plan.highlight
                    ? '1px solid rgba(184, 134, 11, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: 'linear-gradient(135deg, #b8860b, #d97706)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isEn ? 'RECOMMENDED' : 'ĐỀ XUẤT'}
                  </div>
                )}

                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{plan.emoji}</div>
                <h3 style={{ color: plan.color, margin: '0 0 4px 0', fontSize: '1.15rem' }}>{plan.label}</h3>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  {formatPrice(plan.price)}
                  {plan.price > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>{isEn ? '/month' : '/tháng'}</span>
                  )}
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px 0',
                    fontSize: '0.82rem',
                    color: '#d4d4d4',
                    flexGrow: 1,
                  }}
                >
                  {features.map((f, i) => (
                    <li key={i} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#b8860b' }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || isOverride || currentPlan === 'admin'}
                  onClick={() => alert(isEn ? 'Please contact Admin to upgrade your plan!' : 'Liên hệ admin để nâng cấp gói!')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: (isCurrent || isOverride || currentPlan === 'admin')
                      ? 'rgba(255,255,255,0.1)'
                      : plan.highlight
                      ? 'linear-gradient(135deg, #b8860b, #d97706)'
                      : 'rgba(255,255,255,0.12)',
                    color: (isCurrent || isOverride || currentPlan === 'admin') ? '#a3a3a3' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: (isCurrent || isOverride || currentPlan === 'admin') ? 'default' : 'pointer',
                  }}
                >
                  {isCurrent
                    ? (isEn ? 'Current Plan' : 'Gói hiện tại')
                    : isOverride || currentPlan === 'admin'
                    ? (isEn ? 'Granted by Admin' : 'Được tặng bởi Admin')
                    : (isEn ? `Upgrade ${plan.label}` : `Nâng cấp ${plan.label}`)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Coupon Code section */}
        {onApplyCoupon && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 600, marginBottom: '8px' }}>
              {isEn ? '🎟️ Have a promo code? Enter here' : '🎟️ Có mã khuyến mãi? Nhập tại đây'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={isEn ? 'e.g. TRIAL7, PROMO50...' : 'VD: TRIAL7, PREMIUM30...'}
                style={{
                  flexGrow: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {couponLoading ? '...' : (isEn ? 'Apply' : 'Áp dụng')}
              </button>
            </div>
            {couponMsg && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: couponMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>
                {couponMsg}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a3a3a3',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isEn ? 'Close' : 'Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
