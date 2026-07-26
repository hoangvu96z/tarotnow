import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getCardMeaning } from '../utils/tarotLogic';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import AiInterpretationPanel from './AiInterpretationPanel';
import ManualPickSetup from './manual/ManualPickSetup';
import Manual3DTray from './manual/Manual3DTray';
import ManualDeckStage from './manual/ManualDeckStage';
import WeightSettingsModal from './manual/WeightSettingsModal';

const CONTEXTS_MANUAL = [
  { id: 'general', labelVi: '🌟 Tổng quát', labelEn: '🌟 General' },
  { id: 'love',    labelVi: '❤️ Tình yêu',   labelEn: '❤️ Love' },
  { id: 'career',  labelVi: '💼 Công việc',   labelEn: '💼 Career' },
  { id: 'action',  labelVi: '⚖️ Lựa chọn',   labelEn: '⚖️ Choice' },
];

export default function ManualPickMode({ 
  tarotCards, 
  weights, 
  setWeights, 
  activeReadingId, 
  onSaveAiConversation, 
  onSaveReading 
}) {
  const { language } = useLanguage();
  const { isAuthenticated, login } = useAuth();

  const [phase, setPhase] = useState('setup'); // 'setup' | 'picking' | 'results'
  const [pickCount, setPickCount] = useState(3);
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [shuffledOrder, setShuffledOrder] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [activeCtx, setActiveCtx] = useState('general');
  const [revealedSet, setRevealedSet] = useState(new Set());
  const resultRef = useRef(null);
  const [copyDone, setCopyDone] = useState(false);
  const [copyPromptDone, setCopyPromptDone] = useState(false);
  const [selectedModalCard, setSelectedModalCard] = useState(null);
  const [viewStyle, setViewStyle] = useState('fan'); // 'fan' | 'grid'
  const [suitCategory] = useState('all');
  const [isShufflingDeck, setIsShufflingDeck] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    if (tarotCards.length > 0) {
      setShuffledOrder(shuffle(tarotCards.map((_, i) => i)));
    }
  }, [tarotCards]);

  const filteredShuffledOrder = useMemo(() => {
    if (suitCategory === 'all') return shuffledOrder;
    return shuffledOrder.filter(cardIdx => {
      const card = tarotCards[cardIdx];
      if (!card) return false;
      if (suitCategory === 'major') return card.arcana === 'Major';
      if (suitCategory === 'cups') return card.suit === 'Cups';
      if (suitCategory === 'pentacles') return card.suit === 'Pentacles';
      if (suitCategory === 'swords') return card.suit === 'Swords';
      if (suitCategory === 'wands') return card.suit === 'Wands';
      return true;
    });
  }, [shuffledOrder, suitCategory, tarotCards]);

  const handleStartPicking = () => {
    if (!question.trim() || question.trim().length < 5) {
      setQuestionError(
        language === 'en'
          ? 'Please enter a detailed question (at least 5 characters).'
          : 'Vui lòng nhập câu hỏi rõ ràng (ít nhất 5 ký tự).'
      );
      return;
    }
    setQuestionError('');
    setShuffledOrder(shuffle(tarotCards.map((_, i) => i)));
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedSet(new Set());
    setPhase('picking');
  };

  const handleShuffleDeck = () => {
    if (isShufflingDeck) return;
    setIsShufflingDeck(true);
    setTimeout(() => {
      setShuffledOrder(shuffle(tarotCards.map((_, i) => i)));
      setIsShufflingDeck(false);
    }, 500);
  };

  const handlePickCard = (cardId) => {
    if (selectedIds.includes(cardId)) return;
    if (selectedIds.length >= pickCount) return;

    const card = tarotCards.find(c => c.id === cardId);
    if (!card) return;

    const orientation = Math.random() < 0.5 ? 'upright' : 'reversed';
    const drawnItem = { ...card, orientation, drawPosition: selectedIds.length + 1 };

    setSelectedIds(prev => [...prev, cardId]);
    setDrawnCards(prev => [...prev, drawnItem]);
  };

  useEffect(() => {
    if (selectedIds.length === pickCount && phase === 'picking') {
      const timer = setTimeout(() => {
        setPhase('results');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds, pickCount, phase]);

  useEffect(() => {
    if (phase === 'results' && resultRef.current) {
      setTimeout(() => resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    }
  }, [phase]);

  // Short summary text for export
  const summaryText = useMemo(() => {
    if (!drawnCards.length) return '';
    const header = language === 'en'
      ? `Tarot Reading Summary — Question: "${question}"\n\n`
      : `Tóm tắt trải bài Tarot — Câu hỏi: "${question}"\n\n`;
    const lines = drawnCards.map((c, idx) => {
      const pos = language === 'en' ? `Card ${idx + 1}` : `Lá ${idx + 1}`;
      const ori = c.orientation === 'reversed' ? (language === 'en' ? 'Reversed' : 'Ngược') : (language === 'en' ? 'Upright' : 'Xuôi');
      return `${pos}: ${c.name} — ${ori}`;
    }).join('\n');
    return header + lines;
  }, [drawnCards, language, question]);

  // Full AI prompt for export
  const aiPromptText = useMemo(() => {
    if (!drawnCards.length) return '';
    const isEn = language === 'en';

    const cardsSection = drawnCards.map((c, idx) => {
      const oriText = c.orientation === 'reversed'
        ? (isEn ? 'Reversed' : 'Ngược')
        : (isEn ? 'Upright' : 'Xuôi');
      const kws = (c.orientation === 'reversed' ? c.reversedKeywords : c.uprightKeywords) || [];
      const meaning = getCardMeaning(c, 'general', c.orientation);
      return (
        `${idx + 1}. ${isEn ? 'Card' : 'Lá bài'}: ${c.name}\n` +
        `   - ${isEn ? 'Orientation' : 'Trạng thái'}: ${oriText}\n` +
        `   - ${isEn ? 'Category' : 'Nhóm'}: ${c.arcana}${c.suit ? ` (${c.suit})` : ''}\n` +
        `   - ${isEn ? 'Keywords' : 'Từ khóa'}: ${kws.join(', ')}\n` +
        (meaning ? `   - ${isEn ? 'Basic meaning' : 'Ý nghĩa cơ bản'}: ${meaning}\n` : '')
      );
    }).join('\n');

    const sysRole = isEn
      ? 'I want you to act as a professional Tarot interpreter, highly knowledgeable in Rider-Waite-Smith symbolism and archetypes.'
      : 'Tôi muốn bạn đóng vai một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith.';

    const instruction = isEn
      ? 'Please interpret this spread in a comprehensive and deep manner. Analyze the meaning of each card, the energetic connections between them, and compile a cohesive guidance message for my question. Conclude with a clear key takeaway or concrete action step.'
      : 'Vui lòng giải nghĩa trải bài này một cách toàn diện và sâu sắc. Phân tích ý nghĩa từng lá bài, sự kết nối năng lượng giữa các lá bài và đưa ra thông điệp hướng dẫn tổng thể cho câu hỏi của tôi. Kết luận bằng một lời khuyên hoặc hành động cụ thể.';

    return `${sysRole}\n\n${isEn ? 'MY QUESTION:' : 'CÂU HỎI CỦA TÔI:'}\n"${question}"\n\n${isEn ? 'CHOSEN CARDS:' : 'CÁC LÁ BÀI ĐÃ CHỌN:'}\n${cardsSection}\n${instruction}`;
  }, [drawnCards, language, question]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopyPromptDone(true);
    setTimeout(() => setCopyPromptDone(false), 2000);
  };

  if (!tarotCards.length) return null;

  return (
    <div className="manual-pick-container">
      {/* ─── SETUP PHASE ─── */}
      {phase === 'setup' && (
        <ManualPickSetup
          question={question}
          setQuestion={setQuestion}
          questionError={questionError}
          pickCount={pickCount}
          setPickCount={setPickCount}
          onStartPicking={handleStartPicking}
        />
      )}

      {/* ─── PICKING OR RESULTS TRAY STAGE ─── */}
      {(phase === 'picking' || phase === 'results') && (
        <Manual3DTray
          pickCount={pickCount}
          selectedIds={selectedIds}
          drawnCards={drawnCards}
          onSelectCard={(card) => setSelectedModalCard(card)}
        />
      )}

      {/* ─── PICKING DECK STAGE ─── */}
      {phase === 'picking' && (
        <ManualDeckStage
          tarotCards={tarotCards}
          filteredShuffledOrder={filteredShuffledOrder}
          selectedIds={selectedIds}
          pickCount={pickCount}
          viewStyle={viewStyle}
          setViewStyle={setViewStyle}
          isShufflingDeck={isShufflingDeck}
          onShuffleDeck={handleShuffleDeck}
          onPickCard={handlePickCard}
          weights={weights}
          setWeights={setWeights}
          onOpenWeightModal={() => setShowWeightModal(true)}
        />
      )}

      {/* ─── RESULTS INTERPRETATION & EXPORT ─── */}
      {phase === 'results' && (
        <div ref={resultRef}>
          {/* Question title */}
          <div className="glass-panel" style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 className="results-title" style={{ margin: '0 0 6px' }}>
              {language === 'en' ? '✨ Your Drawn Reading' : '✨ Trải Bài Của Bạn'}
            </h2>
            <p className="results-question-text" style={{ margin: 0 }}>
              {language === 'en' ? 'Question' : 'Câu hỏi'}: "{question}"
            </p>
          </div>

          {/* 4-Tab Interpretations */}
          <div className="glass-panel manual-interp-panel">
            <h3 className="results-title" style={{ fontSize: 18, marginBottom: 16, textAlign: 'left' }}>
              {language === 'en' ? '🔮 Interpretation by Theme' : '🔮 Luận Giải Theo Chủ Đề'}
            </h3>
            <div className="manual-ctx-tabs">
              {CONTEXTS_MANUAL.map(ctx => (
                <button key={ctx.id} className={`manual-ctx-tab${activeCtx === ctx.id ? ' active' : ''}`} onClick={() => setActiveCtx(ctx.id)}>
                  {language === 'en' ? ctx.labelEn : ctx.labelVi}
                </button>
              ))}
            </div>
            <div className="manual-interp-list">
              {drawnCards.map((c, idx) => {
                const meaning = getCardMeaning(c, activeCtx, c.orientation);
                const isRev = c.orientation === 'reversed';
                return (
                  <div key={`${c.id}-${activeCtx}`} className="manual-interp-item">
                    <img
                      src={`${import.meta.env.BASE_URL}${c.image.replace(/^\//, '')}`}
                      alt={c.name}
                      className="manual-interp-thumb"
                      style={{ transform: isRev ? 'rotate(180deg)' : 'none' }}
                    />
                    <div className="manual-interp-text">
                      <div className="manual-interp-card-name-row">
                        <span className="manual-interp-card-name">{c.name}</span>
                        <span className="manual-interp-pos">{language === 'en' ? `Card ${idx + 1}` : `Lá ${idx + 1}`}</span>
                        <span className={`card-orientation-badge ${c.orientation}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                          {isRev ? (language === 'en' ? 'Reversed' : 'Ngược') : (language === 'en' ? 'Upright' : 'Xuôi')}
                        </span>
                      </div>
                      <p className="manual-interp-meaning">{meaning}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Assistant Chat Panel */}
          <div style={{ marginBottom: 24 }}>
            <AiInterpretationPanel
              question={question}
              drawnCards={drawnCards}
              spreadName={language === 'en' ? `Manual Pick (${pickCount} cards)` : `Chọn từng lá (${pickCount} lá)`}
              getCardMeaning={getCardMeaning}
              readingId={activeReadingId}
              onSaveAiConversation={onSaveAiConversation}
            />
          </div>

          {/* Copy section — 2 options (Requires Authentication) */}
          <div className="glass-panel manual-copy-panel">
            <h3 style={{ fontFamily: "'Cinzel',serif", color: 'var(--gold-color)', fontSize: 14, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {language === 'en' ? '🤖 Export for AI Reading' : '🤖 Xuất dữ liệu luận giải cho AI'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 14px' }}>
              {language === 'en'
                ? 'Copy AI prompt below and paste into ChatGPT / Claude / Gemini'
                : 'Sao chép prompt AI bên dưới và dán vào ChatGPT / Claude / Gemini để nhận luận giải chi tiết.'}
            </p>

            {!isAuthenticated ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(229, 193, 88, 0.25)',
                  borderRadius: 12,
                  padding: '24px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>🔒</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    lineHeight: 1.5,
                    maxWidth: 640,
                  }}
                >
                  {language === 'en'
                    ? 'You need to log in to use the AI Prompt Export feature.'
                    : 'Bạn cần đăng nhập để sử dụng tính năng xuất dữ liệu luận giải cho AI.'}
                </p>
                <button
                  type="button"
                  onClick={login}
                  style={{
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124,92,252,0.4)',
                  }}
                >
                  🔑 {language === 'en' ? 'Log in now' : 'Đăng nhập ngay'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e5c158', letterSpacing: '0.5px' }}>
                    {language === 'en' ? 'FULL AI PROMPT (RECOMMENDED)' : 'PROMPT AI ĐẦY ĐỦ (KHUYÊN DÙNG)'}
                  </span>
                  <button
                    className="manual-copy-btn primary"
                    onClick={handleCopyPrompt}
                    style={{ position: 'static' }}
                  >
                    {copyPromptDone
                      ? (language === 'en' ? '✓ Copied!' : '✓ Đã sao chép')
                      : (language === 'en' ? '📋 Copy Prompt' : '📋 Sao chép Prompt')}
                  </button>
                </div>

                <pre className="manual-copy-text">{aiPromptText}</pre>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                    {language === 'en' ? 'SHORT CARDS SUMMARY ONLY' : 'CHỈ TÓM TẮT CÁC LÁ BÀI'}
                  </span>
                  <button
                    className="manual-copy-btn"
                    onClick={handleCopyText}
                    style={{ position: 'static' }}
                  >
                    {copyDone
                      ? (language === 'en' ? '✓ Copied!' : '✓ Đã sao chép')
                      : (language === 'en' ? '📋 Copy Summary' : '📋 Sao chép Tóm Tắt')}
                  </button>
                </div>

                <pre className="manual-copy-text">{summaryText}</pre>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedModalCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedModalCard(null)}>
          <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedModalCard(null)}>×</button>

            <div className="modal-left-col">
              <img
                src={`${import.meta.env.BASE_URL}${selectedModalCard.image.replace(/^\//, '')}`}
                alt={selectedModalCard.name}
                className={`modal-card-img${selectedModalCard.orientation === 'reversed' ? ' reversed' : ''}`}
              />
            </div>

            <div className="modal-right-col">
              <h2 className="modal-title">{selectedModalCard.name}</h2>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  {language === 'en' ? 'Current Orientation' : 'Trạng thái hiện tại'}
                </h4>
                <span className={`card-orientation-badge ${selectedModalCard.orientation}`}>
                  {selectedModalCard.orientation === 'reversed'
                    ? (language === 'en' ? 'Reversed' : 'Lá Ngược (Reversed)')
                    : (language === 'en' ? 'Upright' : 'Lá Xuôi (Upright)')}
                </span>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  {language === 'en' ? 'Card Keywords' : 'Từ khóa của lá bài'}
                </h4>
                <div className="modal-keywords-flex">
                  {(selectedModalCard.orientation === 'reversed'
                    ? selectedModalCard.reversedKeywords
                    : selectedModalCard.uprightKeywords
                  ).map((kw, i) => (
                    <span key={i} className="modal-kw-badge">{kw}</span>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  {language === 'en' ? 'Deck Details' : 'Chi tiết bộ bài'}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {language === 'en'
                    ? `Card #${selectedModalCard.number} of the ${selectedModalCard.arcana} Arcana. Standard 78-card Rider-Waite-Smith Tarot Deck.`
                    : `Lá bài thứ ${selectedModalCard.number} thuộc nhóm ${selectedModalCard.arcana} Arcana. Rider-Waite-Smith Tarot Deck chuẩn 78 lá.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Config Modal Popup */}
      <WeightSettingsModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        weights={weights}
        setWeights={setWeights}
      />
    </div>
  );
}
