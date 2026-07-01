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

export default function App() {
  const [tarotCards, setTarotCards] = useState([]);
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

  // 1. Fetch card metadata database on mount
  useEffect(() => {
    fetch('/data/cards.json')
      .then(res => {
        if (!res.ok) throw new Error("Không thể tải file cards.json");
        return res.json();
      })
      .then(data => {
        setTarotCards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Lỗi nạp dữ liệu Tarot. Vui lòng kiểm tra lại đường dẫn assets.");
        setLoading(false);
      });
  }, []);

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
      setValidationError('Vui lòng nhập câu hỏi của bạn trước khi rút bài!');
      return;
    }
    if (question.trim().length < 5) {
      setValidationError('Câu hỏi quá ngắn (tối thiểu 5 ký tự) để AI có thể luận giải ý nghĩa!');
      return;
    }

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) {
      setValidationError('Tổng trọng số các nhóm phải lớn hơn 0!');
      return;
    }

    if (drawCount > tarotCards.length) {
      setValidationError(`Số lá cần rút (${drawCount}) vượt quá số lá có sẵn trong bộ bài (${tarotCards.length})!`);
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
        const newHistoryItem = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
          question: question,
          spreadName: SPREADS.find(s => s.id === activeSpread)?.name || 'Tùy chỉnh',
          cards: results.map(c => ({
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
  const spreadPositions = activeSpreadObj?.positions || [];

  if (loading) {
    return (
      <div className="app-loader-container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ fontFamily: 'Cinzel', color: '#e5c158' }}>Đang nạp năng lượng vũ trụ...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error-container" style={{ textAlign: 'center', marginTop: '100px', padding: '20px' }}>
        <h2 style={{ color: '#eb5e55' }}>Cảnh báo từ Vũ Trụ</h2>
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
                Rút Bài & Luận Giải AI
              </div>
            </div>
          </div>

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
              🔄 Trải bài mới
            </button>
          )}
        </div>
      </header>

      <main className="panels-container">
        {/* Left Side: Setup & Settings */}
        <section className="left-panel-stack" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="setup-panel glass-panel">
            {/* Question Textarea */}
            <div className="form-group">
              <label className="form-label" htmlFor="question-input">
                Nhập câu hỏi của bạn *
              </label>
              <textarea
                id="question-input"
                className="custom-textarea"
                placeholder="Ví dụ: Công việc sắp tới trong 3 tháng tới của tôi sẽ có biến chuyển như thế nào?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isDrawing || isShuffling}
              />
            </div>

            {/* Presets, Card Count and Interpretation Context */}
            <div className="settings-grid-3">
              <div className="settings-col">
                <label className="form-label">Chọn Trải Bài (Spread)</label>
                <select 
                  className="custom-select"
                  value={activeSpread}
                  onChange={(e) => handleSpreadPresetChange(e.target.value)}
                  disabled={isDrawing || isShuffling}
                >
                  {SPREADS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="settings-col">
                <label className="form-label">Số lá cần rút</label>
                {activeSpread === 'custom' ? (
                  <select 
                    className="custom-select"
                    value={drawCount}
                    onChange={(e) => setDrawCount(parseInt(e.target.value))}
                    disabled={isDrawing || isShuffling}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} Lá</option>
                    ))}
                  </select>
                ) : (
                  <div className="custom-select" style={{ opacity: 0.7, background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }}>
                    {drawCount} Lá (Cố định)
                  </div>
                )}
              </div>

              <div className="settings-col">
                <label className="form-label">Góc nhìn giải nghĩa (Context)</label>
                <select 
                  className="custom-select"
                  value={interpretationContext}
                  onChange={(e) => setInterpretationContext(e.target.value)}
                  disabled={isDrawing || isShuffling}
                >
                  {CONTEXTS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reversed Options */}
            <div className="settings-grid" style={{ alignItems: 'center' }}>
              <div className="settings-col">
                <label className="form-label">Chế độ lá ngược</label>
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
                    {reversedEnabled ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>
              </div>

              {reversedEnabled && (
                <div className="settings-col">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Tỷ lệ lá ngược</label>
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
                {isDrawing ? 'Đang rút bài...' : 'RÚT BÀI TAROT'}
              </button>
              
              <button 
                type="button" 
                className="reset-weights-btn" 
                style={{ borderRadius: '20px', padding: '6px 20px' }}
                onClick={handleResetApp}
              >
                Đặt lại cài đặt
              </button>
            </div>

          </div>

          {/* Cards Result Grid Display */}
          {(drawnCards.length > 0 || isDrawing) && (
            <div className="draw-results-section glass-panel">
              <div className="results-header-container">
                <h2 className="results-title">Kết Quả Rút Bài</h2>
                {currentDrawnQuestion && (
                  <p className="results-question-text">Hỏi: "{currentDrawnQuestion}"</p>
                )}
              </div>

              {isDrawing ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontFamily: 'Cinzel', color: 'var(--gold-color)' }}>Đang liên kết năng lượng...</p>
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
          {drawnCards.length > 0 && !isDrawing && (
            <div className="interpretation-section glass-panel" style={{ marginTop: '32px' }}>
              <h2 className="results-title" style={{ fontSize: '20px', borderBottom: '1px solid rgba(229,193,88,0.2)', paddingBottom: '12px', marginBottom: '20px', textAlign: 'left' }}>
                🔮 Luận giải cơ bản (Interpretation Overview)
              </h2>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <span className="card-orientation-badge upright" style={{ background: 'rgba(229,193,88,0.12)', color: '#e5c158', border: '1px solid rgba(229,193,88,0.25)', fontSize: '12px' }}>
                  Góc nhìn: {CONTEXTS.find(c => c.id === interpretationContext)?.name}
                </span>
                {analyzeSpreadPatterns(drawnCards)?.tone.map((t, idx) => (
                  <span key={idx} className="card-orientation-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px' }}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Overall Summary */}
              <div className="summary-box" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,175,55,0.1)', padding: '18px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e5c158', fontSize: '14px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", letterSpacing: '0.5px' }}>Tổng quan trải bài</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#dfdbf0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {composeSpreadSummary(drawnCards, activeSpread, interpretationContext)}
                </p>
              </div>

              {/* Card by Card Interpretation */}
              <h4 style={{ margin: '0 0 16px 0', color: '#e5c158', fontSize: '14px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", letterSpacing: '0.5px' }}>Luận giải từng vị trí</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {drawnCards.map((c, idx) => {
                  const posName = spreadPositions[idx] || `Lá thứ ${idx + 1}`;
                  const meaning = getCardMeaning(c, interpretationContext, c.orientation);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: idx < drawnCards.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '16px' }}>
                      <img 
                        src={c.image} 
                        alt={c.name} 
                        style={{ width: '48px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(229,193,88,0.2)', flexShrink: 0, transform: c.orientation === 'reversed' ? 'rotate(180deg)' : 'none' }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{c.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--gold-color)' }}>({posName})</span>
                          <span className={`card-orientation-badge ${c.orientation}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                            {c.orientation === 'reversed' ? 'Ngược' : 'Xuôi'}
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
              spreadName={SPREADS.find(s => s.id === activeSpread)?.name || 'Tùy chỉnh'}
              spreadPositions={spreadPositions}
              interpretationContext={CONTEXTS.find(c => c.id === interpretationContext)?.name}
              interpretationSummary={composeSpreadSummary(drawnCards, activeSpread, interpretationContext)}
              getCardMeaning={getCardMeaning}
            />
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
            🎲 Trộn Trọng Số Ngẫu Nhiên
          </button>

          {/* Session History */}
          <div className="glass-panel history-panel">
            <div className="card-header-flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 className="settings-title">Lịch sử phiên này</h3>
              {history.length > 0 && (
                <button 
                  type="button" 
                  className="reset-weights-btn"
                  onClick={handleClearHistory}
                >
                  Xóa lịch sử
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>Chưa có trải bài nào được ghi lại.</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-meta">
                      <span>{item.spreadName}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="history-question">"{item.question}"</p>
                    <div className="history-cards-line">
                      {item.cards.map((c, idx) => (
                        <span 
                          key={idx} 
                          className={`history-card-mini-badge ${c.orientation === 'reversed' ? 'reversed' : ''}`}
                        >
                          {c.name} {c.orientation === 'reversed' ? '↓' : '↑'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
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
                  src={selectedModalCard.image} 
                  alt={selectedModalCard.name}
                  className={`modal-card-image ${selectedModalCard.orientation === 'reversed' ? 'reversed' : ''}`}
                />
              </div>
            </div>
            
            <div className="modal-right-col">
              <span className="modal-type">{selectedModalCard.arcana} Arcana {selectedModalCard.suit ? `• ${selectedModalCard.suit}` : ''}</span>
              <h2 className="modal-title">{selectedModalCard.name}</h2>
              
              <div className="modal-section">
                <h4 className="modal-section-title">Trạng thái hiện tại</h4>
                <span className={`card-orientation-badge ${selectedModalCard.orientation}`}>
                  {selectedModalCard.orientation === 'reversed' ? 'Lá Ngược (Reversed)' : 'Lá Xuôi (Upright)'}
                </span>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Từ khóa của lá bài</h4>
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
                <h4 className="modal-section-title">Chi tiết bộ bài</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Lá bài thứ {selectedModalCard.number} thuộc nhóm {selectedModalCard.arcana} Arcana. 
                  Rider-Waite-Smith Tarot Deck chuẩn 78 lá.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>
          Tarot & AI Oracle App. Made with ❤️. Sử dụng bộ ảnh Rider-Waite-Smith Public Domain.
        </p>
      </footer>
    </>
  );
}
