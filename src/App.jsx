import React, { useState, useEffect } from 'react';
import {
  drawTarotCards,
  SPREADS,
  CONTEXTS,
  getCardMeaning,
  analyzeSpreadPatterns,
  composeSpreadSummary
} from './utils/tarotLogic';
import Card3D from './components/Card3D';
import DeckPile from './components/DeckPile';
import WeightControls from './components/WeightControls';
import PromptExporter from './components/PromptExporter';
import ManualPickMode from './components/ManualPickMode';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const [tarotCards, setTarotCards] = useState([]);
  const [activeMode, setActiveMode] = useState('random'); // 'random' | 'manual'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core settings state
  const [question, setQuestion] = useState('');
  const [drawCount, setDrawCount] = useState(3);
  const [reversedEnabled, setReversedEnabled] = useState(true);
  const [reversedRate, setReversedRate] = useState(0.5);
  const [weights, setWeights] = useState({
    major: 20,
    cups: 20,
    pentacles: 20,
    swords: 20,
    wands: 20
  });
  const [interpretationContext, setInterpretationContext] = useState('general');

  // Runtime draw state
  const [drawnCards, setDrawnCards] = useState([]);
  const [currentDrawnQuestion, setCurrentDrawnQuestion] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeSpread, setActiveSpread] = useState('past-present-future');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedModalCard, setSelectedModalCard] = useState(null);

  // History list (persisted in localStorage for convenience)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('tarot_draw_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Validation messages
  const [validationError, setValidationError] = useState('');

  const { t, language, setLanguage } = useLanguage();

  // 1. Fetch card metadata database on mount and language switch
  useEffect(() => {
    const filename = language === 'en' ? 'cards_en.json' : 'cards.json';
    setLoading(true);
    fetch(import.meta.env.BASE_URL + 'data/' + filename)
      .then(res => {
        if (!res.ok) throw new Error("Could not load cards.json");
        return res.json();
      })
      .then(data => {
        setTarotCards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(language === 'en' 
          ? "Error loading Tarot data. Please check assets path." 
          : "Lỗi nạp dữ liệu Tarot. Vui lòng kiểm tra lại đường dẫn assets."
        );
        setLoading(false);
      });
  }, [language]);

  // 1b. Automatically translate drawn cards when card deck shifts language
  useEffect(() => {
    if (drawnCards.length > 0 && tarotCards.length > 0) {
      setDrawnCards(prev => prev.map(oldCard => {
        const newCard = tarotCards.find(c => c.id === oldCard.id);
        if (newCard) {
          return {
            ...newCard,
            orientation: oldCard.orientation,
            drawPosition: oldCard.drawPosition
          };
        }
        return oldCard;
      }));
    }
  }, [tarotCards]);

  // 1c. Automatically translate active modal card
  useEffect(() => {
    if (selectedModalCard && tarotCards.length > 0) {
      const newCard = tarotCards.find(c => c.id === selectedModalCard.id);
      if (newCard) {
        setSelectedModalCard({
          ...newCard,
          orientation: selectedModalCard.orientation
        });
      }
    }
  }, [tarotCards]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('tarot_draw_history', JSON.stringify(history));
  }, [history]);

  // Adjust preset configurations
  const handleSpreadPresetChange = (presetId) => {
    setActiveSpread(presetId);
    const preset = SPREADS.find(s => s.id === presetId);
    if (preset && preset.id !== 'custom') {
      setDrawCount(preset.count);
    }
  };

  // Perform shuffle animation
  const handleShuffle = () => {
    setIsShuffling(true);
    // Clear current draw while shuffling to show card stack
    setDrawnCards([]);
    setTimeout(() => {
      setIsShuffling(false);
    }, 1200);
  };

  // Draw cards
  const handleDraw = () => {
    setValidationError('');

    // Input validations
    if (!question.trim()) {
      setValidationError(t('form.draw_error_empty', 'Vui lòng nhập câu hỏi của bạn trước khi rút bài!'));
      return;
    }
    if (question.trim().length < 5) {
      setValidationError(t('form.draw_error_short', 'Câu hỏi quá ngắn (tối thiểu 5 ký tự) để AI có thể luận giải ý nghĩa!'));
      return;
    }

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) {
      setValidationError(t('form.draw_error_weight', 'Tổng trọng số các nhóm phải lớn hơn 0!'));
      return;
    }

    if (drawCount > tarotCards.length) {
      setValidationError(
        t('form.draw_error_limit', 'Số lá cần rút ({drawCount}) vượt quá số lá có sẵn trong bộ bài ({totalCards})!')
          .replace('{drawCount}', drawCount)
          .replace('{totalCards}', tarotCards.length)
      );
      return;
    }

    // Trigger visual deal animation
    setIsDrawing(true);
    setDrawnCards([]);

    try {
      const results = drawTarotCards(
        tarotCards,
        drawCount,
        weights,
        reversedEnabled,
        reversedRate
      );

      // Save drawn question
      setCurrentDrawnQuestion(question);

      // Stagger drawing completion
      setTimeout(() => {
        setDrawnCards(results);
        setIsDrawing(false);

        // Add to history
        const locale = language === 'en' ? 'en-US' : 'vi-VN';
        const newHistoryItem = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(locale),
          question: question,
          spreadId: activeSpread,
          spreadName: SPREADS.find(s => s.id === activeSpread)?.name || 'Tùy chỉnh',
          cards: results.map(c => ({
            id: c.id,
            name: c.name,
            orientation: c.orientation
          }))
        };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10)); // Keep last 10 entries
      }, 500);

    } catch (err) {
      setValidationError(err.message);
      setIsDrawing(false);
    }
  };

  // Randomize weight percentages for fun
  const handleRandomizeWeights = () => {
    const randomized = {
      major: Math.floor(Math.random() * 50),
      cups: Math.floor(Math.random() * 50),
      pentacles: Math.floor(Math.random() * 50),
      swords: Math.floor(Math.random() * 50),
      wands: Math.floor(Math.random() * 50)
    };
    setWeights(randomized);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleResetApp = () => {
    setQuestion('');
    setDrawnCards([]);
    setCurrentDrawnQuestion('');
    setValidationError('');
    setActiveSpread('past-present-future');
    setDrawCount(3);
    setWeights({
      major: 20,
      cups: 20,
      pentacles: 20,
      swords: 20,
      wands: 20
    });
    setInterpretationContext('general');
  };

  const activeSpreadObj = SPREADS.find(s => s.id === activeSpread);
  const spreadPositions = activeSpreadObj?.positions?.map((pos, idx) => 
    t('spread.pos.' + activeSpread + '.' + idx, pos)
  ) || [];

  const summaryObj = composeSpreadSummary(drawnCards, activeSpread, interpretationContext, language);
  const formattedSummaryText = summaryObj ? (
    language === 'en' ? `
[SPREAD OVERVIEW]
- General Summary: ${summaryObj.overview}
- Arcana Lesson: ${summaryObj.arcanaAnalysis}
- Elemental Interaction: ${summaryObj.elementAnalysis}
- Flow Analysis: ${summaryObj.flowAnalysis}
- Actionable Advice: ${summaryObj.actionAdvice}
`.trim() : `
[TỔNG QUAN TRẢI BÀI]
- Tóm tắt chung: ${summaryObj.overview}
- Bài học Arcana: ${summaryObj.arcanaAnalysis}
- Tương tác Nguyên tố: ${summaryObj.elementAnalysis}
- Dòng chảy liên kết: ${summaryObj.flowAnalysis}
- Lời khuyên hành động: ${summaryObj.actionAdvice}
`.trim()
  ) : "";

  if (loading) {
    return (
      <div className="app-loader-container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ fontFamily: 'Cinzel', color: '#e5c158' }}>
          {language === 'en' ? 'Aligning celestial energies...' : 'Đang nạp năng lượng vũ trụ...'}
        </h2>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error-container" style={{ textAlign: 'center', marginTop: '100px', padding: '20px' }}>
        <h2 style={{ color: '#eb5e55' }}>
          {language === 'en' ? 'Cosmic Interruption' : 'Cảnh báo từ Vũ Trụ'}
        </h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Twinkling star field */}
      <div className="stars-background"></div>
      <div className="nebula-glow"></div>
      <div className="nebula-glow-right"></div>

      {/* ===== HEADER ===== */}
      <header style={{
        background: 'linear-gradient(135deg, #090615 0%, #1a103c 50%, #090615 100%)',
        padding: '0 24px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(229, 193, 88, 0.2)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Visual Tarot Card icon */}
            <div style={{
              width: 24,
              height: 38,
              border: '2px solid #e5c158',
              borderRadius: 4,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(229, 193, 88, 0.4)'
            }}>
              {/* A small golden star inside */}
              <span style={{ fontSize: '12px', color: '#e5c158', marginTop: '-2px' }}>★</span>
            </div>
            <div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#e5c158',
                letterSpacing: '0.06em',
              }}>
                TarotNow
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(229,193,88,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
                {t('app.subtitle', 'Trải Bài Tarot & Luận Giải AI')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(229,193,88,0.25)',
                borderRadius: 8,
                color: '#e5c158',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(229,193,88,0.1)';
                e.currentTarget.style.borderColor = '#e5c158';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(229,193,88,0.25)';
              }}
            >
              {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </button>

            <a 
              href="/kinhdich/"
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e5c158'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'}
            >
              {t('nav.iching_link', '☯️ Lập quẻ Dịch')}
            </a>

            {(drawnCards.length > 0) && (
              <button
                onClick={handleResetApp}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(229,193,88,0.3)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.9)',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(229, 193, 88, 0.1)';
                  e.currentTarget.style.borderColor = '#e5c158';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(229,193,88,0.3)';
                }}
              >
                {t('nav.new_cast', '🔄 Trải bài mới')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="panels-container">
        {/* Left Side: Setup & Settings */}
        <section className="left-panel-stack" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── Mode Switcher ── */}
          <div className="mode-switcher">
            <button
              className={`mode-switcher-btn${activeMode === 'random' ? ' active' : ''}`}
              onClick={() => setActiveMode('random')}
            >
              🎴 {language === 'en' ? 'Random Draw' : 'Rút Ngẫu Nhiên'}
            </button>
            <button
              className={`mode-switcher-btn${activeMode === 'manual' ? ' active' : ''}`}
              onClick={() => setActiveMode('manual')}
            >
              🖐 {language === 'en' ? 'Manual Pick' : 'Chọn Tay'}
            </button>
          </div>

          {/* ── Manual Pick Mode (parallel) ── */}
          {activeMode === 'manual' && (
            <ManualPickMode tarotCards={tarotCards} />
          )}

          {/* ── Random Draw Mode ── */}
          {activeMode === 'random' && (
          <div style={{ display: 'contents' }}>

          <div className="setup-panel glass-panel">
            {/* Question Textarea */}
            <div className="form-group">
              <label className="form-label" htmlFor="question-input">
                {t('form.question_label', 'Nhập câu hỏi của bạn *')}
              </label>
              <textarea
                id="question-input"
                className="custom-textarea"
                placeholder={t('form.question_placeholder', 'Ví dụ: Công việc sắp tới trong 3 tháng tới của tôi sẽ có biến chuyển như thế nào?')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isDrawing || isShuffling}
              />
            </div>

            {/* Presets, Card Count and Interpretation Context */}
            <div className="settings-grid-3">
              <div className="settings-col">
                <label className="form-label">{t('form.spread_label', 'Chọn Trải Bài (Spread)')}</label>
                <select
                  className="custom-select"
                  value={activeSpread}
                  onChange={(e) => handleSpreadPresetChange(e.target.value)}
                  disabled={isDrawing || isShuffling}
                >
                  {SPREADS.map(s => (
                    <option key={s.id} value={s.id}>{t('spread.name.' + s.id, s.name)}</option>
                  ))}
                </select>
              </div>

              <div className="settings-col">
                <label className="form-label">{t('form.draw_count_label', 'Số lá cần rút')}</label>
                {activeSpread === 'custom' ? (
                  <select
                    className="custom-select"
                    value={drawCount}
                    onChange={(e) => setDrawCount(parseInt(e.target.value))}
                    disabled={isDrawing || isShuffling}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} {language === 'en' ? 'Cards' : 'Lá'}</option>
                    ))}
                  </select>
                ) : (
                  <div className="custom-select" style={{ opacity: 0.7, background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }}>
                    {drawCount} {language === 'en' ? 'Cards (Fixed)' : 'Lá (Cố định)'}
                  </div>
                )}
              </div>

              <div className="settings-col">
                <label className="form-label">{t('form.perspective_label', 'Góc nhìn giải nghĩa')}</label>
                <select
                  className="custom-select"
                  value={interpretationContext}
                  onChange={(e) => setInterpretationContext(e.target.value)}
                  disabled={isDrawing || isShuffling}
                >
                  {CONTEXTS.map(c => (
                    <option key={c.id} value={c.id}>{t('context.' + c.id, c.name)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reversed Options */}
            <div className="settings-grid" style={{ alignItems: 'center' }}>
              <div className="settings-col">
                <label className="form-label">{t('form.reversed_mode', 'Chế độ lá ngược')}</label>
                <div className="toggle-wrapper">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={reversedEnabled}
                      onChange={(e) => setReversedEnabled(e.target.checked)}
                      disabled={isDrawing || isShuffling}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label-text">
                    {reversedEnabled 
                      ? (language === 'en' ? 'Enabled' : 'Đang bật') 
                      : (language === 'en' ? 'Disabled' : 'Đang tắt')}
                  </span>
                </div>
              </div>

              {reversedEnabled && (
                <div className="settings-col">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>{t('form.reversed_rate', 'Tỷ lệ lá ngược')}</label>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{Math.round(reversedRate * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={reversedRate}
                    onChange={(e) => setReversedRate(parseFloat(e.target.value))}
                    className="custom-range-slider"
                    style={{
                      '--track-fill': `${reversedRate * 100}%`,
                      '--thumb-color': 'var(--gold-color)'
                    }}
                    disabled={isDrawing || isShuffling}
                  />
                </div>
              )}
            </div>

            {validationError && (
              <div className="error-alert">
                {validationError}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="action-area">
              <button
                type="button"
                className="draw-trigger-btn"
                onClick={handleDraw}
                disabled={isDrawing || isShuffling || !question.trim()}
              >
                {isDrawing ? t('form.drawing_btn', 'Đang rút bài...') : t('form.draw_btn', 'RÚT BÀI TAROT')}
              </button>

              <button
                type="button"
                className="reset-weights-btn"
                style={{ borderRadius: '20px', padding: '6px 20px' }}
                onClick={handleResetApp}
              >
                {t('form.reset_btn', 'Đặt lại cài đặt')}
              </button>
            </div>

          </div>

          {/* Cards Result Grid Display */}
          {(drawnCards.length > 0 || isDrawing) && (
            <div className="draw-results-section glass-panel">
              <div className="results-header-container">
                <h2 className="results-title">{t('result.title', 'Kết Quả Rút Bài')}</h2>
                {currentDrawnQuestion && (
                  <p className="results-question-text">{t('result.question_prefix', 'Hỏi')}: "{currentDrawnQuestion}"</p>
                )}
              </div>

              {isDrawing ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontFamily: 'Cinzel', color: 'var(--gold-color)' }}>{t('result.loading_energy', 'Đang liên kết năng lượng...')}</p>
                  <div className="spinner" style={{ margin: '20px auto 0' }}></div>
                </div>
              ) : (
                <div className="cards-grid">
                  {drawnCards.map((c, idx) => (
                    <Card3D
                      key={c.id}
                      card={c}
                      index={idx}
                      revealDelay={idx * 200}
                      onCardClick={setSelectedModalCard}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Basic Interpretation Section */}
          {drawnCards.length > 0 && !isDrawing && summaryObj && (
            <div className="interpretation-section glass-panel" style={{ marginTop: '32px' }}>
              <h2 className="results-title" style={{ fontSize: '20px', borderBottom: '1px solid rgba(229,193,88,0.2)', paddingBottom: '12px', marginBottom: '20px', textAlign: 'left' }}>
                {t('result.interpretation_title', '🔮 Luận giải cơ bản (Interpretation Overview)')}
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <span className="card-orientation-badge upright" style={{ background: 'rgba(229,193,88,0.12)', color: '#e5c158', border: '1px solid rgba(229,193,88,0.25)', fontSize: '12px' }}>
                  {t('result.perspective_prefix', 'Góc nhìn')}: {t('context.' + interpretationContext, CONTEXTS.find(c => c.id === interpretationContext)?.name)}
                </span>
                {analyzeSpreadPatterns(drawnCards, language)?.tone.map((tVal, idx) => (
                  <span key={idx} className="card-orientation-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px' }}>
                    {tVal}
                  </span>
                ))}
              </div>

              {/* Overall Summary */}
              <div className="summary-box" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,175,55,0.15)', padding: '18px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e5c158', fontSize: '14px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", letterSpacing: '0.5px' }}>
                  {t('result.summary_title', 'Tóm tắt chung')}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#dfdbf0', lineHeight: '1.6' }}>
                  {summaryObj.overview}
                </p>
              </div>

              {/* Multi-dimensional analysis grid */}
              <div className="analysis-dimensions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {/* 1. Arcana Lessons */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#e5c158', fontSize: '13px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>
                    🌟 {language === 'en' ? 'Arcana Lesson' : 'Bài học Arcana'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{summaryObj.arcanaAnalysis}</p>
                </div>

                {/* 2. Element/Suit Balance */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#e5c158', fontSize: '13px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>
                    🧪 {language === 'en' ? 'Elemental Interaction' : 'Tương tác Nguyên tố'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{summaryObj.elementAnalysis}</p>
                </div>

                {/* 3. Positional Flow */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#e5c158', fontSize: '13px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>
                    🌊 {language === 'en' ? 'Positional Flow' : 'Dòng chảy Trải bài'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{summaryObj.flowAnalysis}</p>
                </div>

                {/* 4. Actionable Advice */}
                <div style={{ background: 'rgba(229,193,88,0.04)', border: '1px solid rgba(229,193,88,0.15)', padding: '16px', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#e5c158', fontSize: '13px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>
                    ⚡ {language === 'en' ? 'Actionable Advice' : 'Lời khuyên Hành động'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: '#f3e5ab', lineHeight: '1.5', fontWeight: '500' }}>{summaryObj.actionAdvice}</p>
                </div>
              </div>

              {/* Card by Card Interpretation */}
              <h4 style={{ margin: '0 0 16px 0', color: '#e5c158', fontSize: '14px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", letterSpacing: '0.5px' }}>
                {t('result.analysis_by_position', 'Luận giải từng vị trí')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {drawnCards.map((c, idx) => {
                  const posName = spreadPositions[idx] || (language === 'en' ? `Card #${idx + 1}` : `Lá thứ ${idx + 1}`);
                  const meaning = getCardMeaning(c, interpretationContext, c.orientation);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: idx < drawnCards.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '16px' }}>
                      <img
                        src={import.meta.env.BASE_URL + c.image.replace(/^\//, '')}
                        alt={c.name}
                        style={{ width: '48px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(229,193,88,0.2)', flexShrink: 0, transform: c.orientation === 'reversed' ? 'rotate(180deg)' : 'none' }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{c.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--gold-color)' }}>({posName})</span>
                          <span className={`card-orientation-badge ${c.orientation}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                            {c.orientation === 'reversed' ? t('result.mini_reversed', 'Ngược') : t('result.mini_upright', 'Xuôi')}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {meaning}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export Prompt Panel */}
          {drawnCards.length > 0 && !isDrawing && (
            <PromptExporter
              question={currentDrawnQuestion}
              drawnCards={drawnCards}
              spreadName={t('spread.name.' + activeSpread, SPREADS.find(s => s.id === activeSpread)?.name || 'Tùy chỉnh')}
              spreadPositions={spreadPositions}
              interpretationContext={t('context.' + interpretationContext, CONTEXTS.find(c => c.id === interpretationContext)?.name)}
              interpretationSummary={formattedSummaryText}
              getCardMeaning={getCardMeaning}
            />
          )}

          </div>
          )}

        </section>

        {/* Right Side: Deck Stack & Weights & History */}
        <section className="right-panel-stack" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Deck pile */}
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <DeckPile
              remainingCount={tarotCards.length - (isDrawing ? 0 : drawnCards.length)}
              isShuffling={isShuffling}
              onShuffle={handleShuffle}
            />
          </div>

          {/* Weight Configs */}
          <WeightControls
            weights={weights}
            onChange={setWeights}
            onPresetSelect={setWeights}
          />

          <button
            type="button"
            className="preset-badge-btn"
            style={{ alignSelf: 'stretch', borderRadius: '8px', padding: '10px' }}
            onClick={handleRandomizeWeights}
          >
            {t('weights.random_btn', '🎲 Trộn Trọng Số Ngẫu Nhiên')}
          </button>

          {/* Session History */}
          <div className="glass-panel history-panel">
            <div className="card-header-flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 className="settings-title">{t('history.title', 'Lịch sử phiên này')}</h3>
              {history.length > 0 && (
                <button
                  type="button"
                  className="reset-weights-btn"
                  onClick={handleClearHistory}
                >
                  {t('history.clear_btn', 'Xóa lịch sử')}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>
                {t('history.empty', 'Chưa có trải bài nào được ghi lại.')}
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const histSpreadName = item.spreadId 
                    ? t('spread.name.' + item.spreadId, item.spreadName) 
                    : (item.spreadName === 'Tùy chỉnh' || item.spreadName === 'Custom' ? t('history.custom', 'Tùy chỉnh') : item.spreadName);
                  return (
                    <div key={item.id} className="history-item">
                      <div className="history-meta">
                        <span>{histSpreadName}</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="history-question">"{item.question}"</p>
                      <div className="history-cards-line">
                        {item.cards.map((cHist, idx) => {
                          const card = tarotCards.find(tc => tc.id === cHist.id);
                          const cardNameTrans = card ? card.name : cHist.name;
                          return (
                            <span
                              key={idx}
                              className={`history-card-mini-badge ${cHist.orientation === 'reversed' ? 'reversed' : ''}`}
                            >
                              {cardNameTrans} {cHist.orientation === 'reversed' ? '↓' : '↑'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Card Detail Modal */}
      {selectedModalCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedModalCard(null)}>
          <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedModalCard(null)}>×</button>

            <div className="modal-left-col">
              <div className="modal-card-wrapper">
                <img
                  src={import.meta.env.BASE_URL + selectedModalCard.image.replace(/^\//, '')}
                  alt={selectedModalCard.name}
                  className={`modal-card-image ${selectedModalCard.orientation === 'reversed' ? 'reversed' : ''}`}
                />
              </div>
            </div>

            <div className="modal-right-col">
              <span className="modal-type">{selectedModalCard.arcana} Arcana {selectedModalCard.suit ? `• ${selectedModalCard.suit}` : ''}</span>
              <h2 className="modal-title">{selectedModalCard.name}</h2>

              <div className="modal-section">
                <h4 className="modal-section-title">{t('modal.status_label', 'Trạng thái hiện tại')}</h4>
                <span className={`card-orientation-badge ${selectedModalCard.orientation}`}>
                  {selectedModalCard.orientation === 'reversed' 
                    ? t('modal.orientation_reversed', 'Lá Ngược (Reversed)') 
                    : t('modal.orientation_upright', 'Lá Xuôi (Upright)')}
                </span>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">{t('modal.keywords_label', 'Từ khóa của lá bài')}</h4>
                <div className="modal-keywords-flex">
                  {selectedModalCard.orientation === 'reversed'
                    ? selectedModalCard.reversedKeywords.map((kw, i) => (
                      <span key={i} className="modal-kw-badge">{kw}</span>
                    ))
                    : selectedModalCard.uprightKeywords.map((kw, i) => (
                      <span key={i} className="modal-kw-badge">{kw}</span>
                    ))
                  }
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">{t('modal.details_title', 'Chi tiết bộ bài')}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t('modal.details_desc', 'Lá bài thứ {number} thuộc nhóm {arcana} Arcana. Rider-Waite-Smith Tarot Deck chuẩn 78 lá.')
                    .replace('{number}', selectedModalCard.number)
                    .replace('{arcana}', selectedModalCard.arcana)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>
          {t('footer.text', 'Tarot & AI Oracle App. Made with ❤️. Sử dụng bộ ảnh Rider-Waite-Smith Public Domain.')}
        </p>
      </footer>
    </>
  );
}
