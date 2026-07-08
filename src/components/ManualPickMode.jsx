import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getCardMeaning } from '../utils/tarotLogic';
import { useLanguage } from '../context/LanguageContext';
import AiInterpretationPanel from './AiInterpretationPanel';

const CONTEXTS_MANUAL = [
  { id: 'general', labelVi: '🌟 Tổng quát', labelEn: '🌟 General' },
  { id: 'love',    labelVi: '❤️ Tình yêu',   labelEn: '❤️ Love' },
  { id: 'career',  labelVi: '💼 Công việc',   labelEn: '💼 Career' },
  { id: 'action',  labelVi: '⚖️ Lựa chọn',   labelEn: '⚖️ Choice' },
];

export default function ManualPickMode({ tarotCards }) {
  const { language } = useLanguage();

  const [phase, setPhase] = useState('setup');
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

  const handleStartPicking = () => {
    setQuestionError('');
    if (!question.trim()) {
      setQuestionError(language === 'en'
        ? 'Please enter your question before selecting cards!'
        : 'Vui lòng nhập câu hỏi trước khi chọn bài!');
      return;
    }
    if (question.trim().length < 5) {
      setQuestionError(language === 'en'
        ? 'Question too short (min 5 characters).'
        : 'Câu hỏi quá ngắn (tối thiểu 5 ký tự).');
      return;
    }
    setShuffledOrder(shuffle(tarotCards.map((_, i) => i)));
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedSet(new Set());
    setPhase('picking');
  };

  const handleToggleCard = (cardId) => {
    setSelectedIds(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
      if (prev.length >= pickCount) return prev;
      return [...prev, cardId];
    });
  };

  useEffect(() => {
    if (selectedIds.length === pickCount && phase === 'picking') {
      const timer = setTimeout(() => {
        const results = selectedIds.map((id, i) => {
          const card = tarotCards.find(c => c.id === id);
          const orientation = Math.random() < 0.5 ? 'upright' : 'reversed';
          return { ...card, orientation, drawPosition: i + 1 };
        });
        setDrawnCards(results);
        setPhase('results');
        results.forEach((_, idx) => {
          setTimeout(() => {
            setRevealedSet(prev => new Set([...prev, idx]));
          }, idx * 250);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedIds, pickCount, phase, tarotCards]);

  useEffect(() => {
    if (phase === 'results' && resultRef.current) {
      setTimeout(() => resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    }
  }, [phase]);

  // Simple card list (no interpretation)
  const simpleCardList = useMemo(() => {
    if (!drawnCards.length) return '';
    const header = language === 'en'
      ? `Question: "${question}"\n\nDrawn cards:\n`
      : `Câu hỏi: "${question}"\n\nCác lá bài đã chọn:\n`;
    const lines = drawnCards.map((c, i) => {
      const pos = language === 'en' ? `Card ${i + 1}` : `Lá ${i + 1}`;
      const ori = c.orientation === 'reversed'
        ? (language === 'en' ? 'Reversed' : 'Ngược')
        : (language === 'en' ? 'Upright' : 'Xuôi');
      return `${pos}: ${c.name} — ${ori}`;
    }).join('\n');
    return header + lines;
  }, [drawnCards, language, question]);

  // Full AI prompt
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
      : 'Hãy luận giải trải bài này một cách toàn diện và sâu sắc. Phân tích ý nghĩa từng lá, mối liên kết năng lượng giữa chúng và tổng hợp thành thông điệp khuyên bảo cụ thể cho câu hỏi của tôi. Kết thúc bằng một thông điệp đúc kết hoặc hành động cụ thể tôi nên làm.';

    const reqBullets = isEn
      ? '- Use fluent, deep, and objective English.\n- Use clear headings for each section.\n- Conclude with a concrete action step.'
      : '- Sử dụng tiếng Việt, viết trôi chảy, sâu sắc và khách quan.\n- Có tiêu đề rõ ràng cho từng phần.\n- Kết luận bằng hành động cụ thể tôi nên làm.';

    return (
      `${sysRole}\n\n` +
      `${isEn ? 'MY QUESTION' : 'CÂU HỎI CỦA TÔI'}:\n"${question}"\n\n` +
      `${isEn ? 'DRAWN CARDS (manually chosen by intuition)' : 'CÁC LÁ BÀI ĐÃ CHỌN (chọn theo trực giác)'}:\n${cardsSection}\n` +
      `${isEn ? 'INTERPRETATION GUIDE FOR AI' : 'HƯỚNG DẪN GIẢI NGHĨA CHO AI'}:\n${instruction}\n\n` +
      `${isEn ? 'Response formatting requirements' : 'Yêu cầu định dạng phản hồi'}:\n${reqBullets}`
    );
  }, [drawnCards, language, question]);

  const handleCopySimple = () => {
    navigator.clipboard.writeText(simpleCardList).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText).then(() => {
      setCopyPromptDone(true);
      setTimeout(() => setCopyPromptDone(false), 2000);
    });
  };

  const handleReset = () => {
    setPhase('setup');
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedSet(new Set());
  };

  if (!tarotCards.length) return null;

  return (
    <div className="manual-pick-root">

      {/* ─── SETUP ─── */}
      {phase === 'setup' && (
        <div className="glass-panel manual-setup-panel">
          <div className="manual-setup-header">
            <div className="manual-setup-icon">🖐</div>
            <h2 className="manual-setup-title">
              {language === 'en' ? 'Choose Your Cards' : 'Chọn Bài Thủ Công'}
            </h2>
            <p className="manual-setup-desc">
              {language === 'en'
                ? 'All 78 cards will be laid face-down. Trust your intuition and select the cards that call to you.'
                : 'Toàn bộ 78 lá bài sẽ được xếp úp mặt. Hãy tin vào trực giác và chọn những lá bài bạn cảm thấy kết nối.'}
            </p>
          </div>

          <div className="manual-setup-controls">
            {/* Question — required */}
            <div className="form-group" style={{ marginBottom: 24, textAlign: 'left' }}>
              <label className="form-label">
                {language === 'en' ? 'Your Question *' : 'Câu hỏi của bạn *'}
              </label>
              <textarea
                className="custom-textarea"
                style={{ minHeight: 90, borderColor: questionError ? '#eb5e55' : undefined }}
                placeholder={language === 'en'
                  ? 'e.g. What does the universe want me to know right now?'
                  : 'VD: Vũ trụ muốn tôi biết điều gì vào lúc này?'}
                value={question}
                onChange={e => { setQuestion(e.target.value); if (questionError) setQuestionError(''); }}
              />
              {questionError && (
                <div className="error-alert" style={{ marginTop: 8, padding: '8px 14px' }}>
                  {questionError}
                </div>
              )}
            </div>

            {/* Card count */}
            <div className="manual-count-selector">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                {language === 'en' ? 'How many cards?' : 'Bạn muốn chọn bao nhiêu lá?'}
              </label>
              <div className="manual-count-buttons">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} className={`manual-count-btn${pickCount === n ? ' active' : ''}`} onClick={() => setPickCount(n)}>{n}</button>
                ))}
              </div>
              <p className="manual-count-hint">
                {language === 'en' ? `Selected: ${pickCount} card${pickCount > 1 ? 's' : ''}` : `Đã chọn: ${pickCount} lá bài`}
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                className="draw-trigger-btn"
                style={{ opacity: !question.trim() || question.trim().length < 5 ? 0.45 : 1, cursor: !question.trim() || question.trim().length < 5 ? 'not-allowed' : 'pointer' }}
                disabled={!question.trim() || question.trim().length < 5}
                onClick={handleStartPicking}
              >
                {language === 'en' ? '🌙 Spread the Deck' : '🌙 Trải Bộ Bài Ra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PICKING ─── */}
      {phase === 'picking' && (
        <div className="manual-picking-phase">
          <div className="manual-pick-sticky-bar glass-panel">
            <div className="manual-pick-counter">
              <span className="manual-pick-count-current">{selectedIds.length}</span>
              <span className="manual-pick-count-sep"> / </span>
              <span className="manual-pick-count-total">{pickCount}</span>
              <span className="manual-pick-count-label">&nbsp;{language === 'en' ? 'cards chosen' : 'lá đã chọn'}</span>
            </div>
            <div className="manual-pick-progress-bar">
              <div className="manual-pick-progress-fill" style={{ width: `${(selectedIds.length / pickCount) * 100}%` }} />
            </div>
            {selectedIds.length > 0 && (
              <button className="reset-weights-btn" onClick={() => setSelectedIds([])}>
                {language === 'en' ? 'Clear selection' : 'Bỏ chọn tất cả'}
              </button>
            )}
          </div>

          <p className="manual-pick-instruction">
            {selectedIds.length < pickCount
              ? (language === 'en'
                  ? `Follow your intuition — choose ${pickCount - selectedIds.length} more card${pickCount - selectedIds.length > 1 ? 's' : ''}`
                  : `Hãy theo trực giác — chọn thêm ${pickCount - selectedIds.length} lá nữa`)
              : (language === 'en' ? '✨ Reading the cards...' : '✨ Đang đọc bài...')}
          </p>

          <div className="manual-card-grid">
            {shuffledOrder.map((cardIdx) => {
              const card = tarotCards[cardIdx];
              if (!card) return null;
              const selIdx = selectedIds.indexOf(card.id);
              const isSelected = selIdx !== -1;
              const isDisabled = !isSelected && selectedIds.length >= pickCount;
              return (
                <div
                  key={card.id}
                  className={`manual-card-slot${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                  onClick={() => !isDisabled && handleToggleCard(card.id)}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}assets/cards/card-back.jpg`}
                    alt="Tarot card"
                    className="manual-card-back-img"
                    loading="lazy"
                  />
                  {isSelected && <div className="manual-card-selected-badge">{selIdx + 1}</div>}
                  <div className="manual-card-hover-glow" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {phase === 'results' && (
        <div ref={resultRef}>
          {/* Drawn cards reveal */}
          <div className="glass-panel" style={{ marginBottom: 24 }}>
            <div className="results-header-container">
              <h2 className="results-title">{language === 'en' ? '✨ Your Chosen Cards' : '✨ Các Lá Bài Bạn Đã Chọn'}</h2>
              <p className="results-question-text">
                {language === 'en' ? 'Question' : 'Câu hỏi'}: "{question}"
              </p>
            </div>
            <div className="manual-results-cards-row">
              {drawnCards.map((c, idx) => {
                const isRevealed = revealedSet.has(idx);
                const isRev = c.orientation === 'reversed';
                return (
                  <div
                    key={c.id}
                    className={`manual-result-card-wrap${isRevealed ? ' revealed' : ''}`}
                    style={{ cursor: isRevealed ? 'pointer' : 'default' }}
                    onClick={() => isRevealed && setSelectedModalCard(c)}
                  >
                    <div className="manual-result-pos-badge">{language === 'en' ? `Card ${idx + 1}` : `Lá ${idx + 1}`}</div>
                    <div className="manual-result-card-flip">
                      <div className={`manual-result-card-inner${isRevealed ? ' flipped' : ''}`}>
                        <div className="manual-result-card-face back">
                          <img src={`${import.meta.env.BASE_URL}assets/cards/card-back.jpg`} alt="back" className="manual-result-card-img" />
                        </div>
                        <div className="manual-result-card-face front">
                          <img src={`${import.meta.env.BASE_URL}${c.image.replace(/^\//, '')}`} alt={c.name} className={`manual-result-card-img${isRev ? ' reversed' : ''}`} />
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <h4 style={{ margin: '0 0 4px', fontFamily: "'Cinzel',serif", fontSize: 11, color: '#fff' }}>{c.name}</h4>
                      <span className={`card-orientation-badge ${c.orientation}`} style={{ fontSize: 10 }}>
                        {isRev ? (language === 'en' ? 'Reversed' : 'Ngược') : (language === 'en' ? 'Upright' : 'Xuôi')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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

          {/* Copy section — 2 options */}
          <div className="glass-panel manual-copy-panel">
            <h3 style={{ fontFamily: "'Cinzel',serif", color: 'var(--gold-color)', fontSize: 14, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {language === 'en' ? '🤖 Export for AI Reading' : '🤖 Xuất để nhờ AI luận giải'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
              {language === 'en'
                ? 'Copy the full AI prompt below and paste into ChatGPT / Claude / Gemini for a detailed reading.'
                : 'Sao chép prompt AI bên dưới và dán vào ChatGPT / Claude / Gemini để nhận luận giải chi tiết.'}
            </p>

            {/* Full AI Prompt */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {language === 'en' ? 'Full AI Prompt (recommended)' : 'Prompt AI đầy đủ (khuyên dùng)'}
                </span>
                <button
                  className="draw-trigger-btn"
                  style={{ padding: '6px 16px', fontSize: 12 }}
                  onClick={handleCopyPrompt}
                >
                  {copyPromptDone
                    ? (language === 'en' ? '✓ Copied!' : '✓ Đã sao chép!')
                    : (language === 'en' ? '📋 Copy Prompt' : '📋 Sao chép Prompt')}
                </button>
              </div>
              <pre className="manual-copy-text">{aiPromptText}</pre>
            </div>

            {/* Simple list */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {language === 'en' ? 'Short card list only' : 'Danh sách ngắn (chỉ tên lá)'}
                </span>
                <button
                  className="reset-weights-btn"
                  style={{ padding: '5px 14px', fontSize: 12 }}
                  onClick={handleCopySimple}
                >
                  {copyDone
                    ? (language === 'en' ? '✓ Copied!' : '✓ Đã sao chép!')
                    : (language === 'en' ? '📋 Copy List' : '📋 Sao chép danh sách')}
                </button>
              </div>
            </div>
          </div>

          <AiInterpretationPanel
            question={question}
            drawnCards={drawnCards}
            spreadName={language === 'en' ? 'Manual Selection' : 'Tự Chọn Lá Bài'}
            spreadPositions={drawnCards.map((_, i) => language === 'en' ? `Card ${i + 1}` : `Lá thứ ${i + 1}`)}
            interpretationContext={activeCtx}
            interpretationSummary=""
            getCardMeaning={getCardMeaning}
          />

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="reset-weights-btn" style={{ padding: '10px 28px', borderRadius: 20 }} onClick={handleReset}>
              {language === 'en' ? '🔄 New Reading' : '🔄 Trải Bài Lại'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Card Detail Modal ─── */}
      {selectedModalCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedModalCard(null)}>
          <div className="card-modal-content" onClick={e => e.stopPropagation()}>
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
              <span className="modal-type">
                {selectedModalCard.arcana} Arcana {selectedModalCard.suit ? `• ${selectedModalCard.suit}` : ''}
              </span>
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
    </div>
  );
}
