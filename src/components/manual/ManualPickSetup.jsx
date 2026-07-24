import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function ManualPickSetup({
  question,
  setQuestion,
  questionError,
  pickCount,
  setPickCount,
  onStartPicking,
}) {
  const { language } = useLanguage();

  return (
    <div className="setup-panel glass-panel">
      <div className="form-group">
        <label className="form-label" htmlFor="manual-question-input">
          {language === 'en' ? 'Enter your question *' : 'Nhập câu hỏi của bạn *'}
        </label>
        <textarea
          id="manual-question-input"
          className="custom-textarea"
          placeholder={
            language === 'en'
              ? 'e.g. How will my career unfold in the next 3 months?'
              : 'Ví dụ: Công việc sắp tới trong 3 tháng tới của tôi sẽ có biến chuyển như thế nào?'
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {questionError && <div className="error-alert">{questionError}</div>}
      </div>

      <div className="manual-count-picker">
        <label className="form-label">
          {language === 'en' ? 'Number of Cards to Pick:' : 'Số lượng lá bài cần rút:'}
        </label>
        <div className="manual-count-buttons">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              className={`manual-count-btn${pickCount === n ? ' active' : ''}`}
              onClick={() => setPickCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="manual-count-hint">
          {language === 'en'
            ? `Selected: ${pickCount} card${pickCount > 1 ? 's' : ''}`
            : `Đã chọn: ${pickCount} lá bài`}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button
          type="button"
          className="draw-trigger-btn"
          style={{
            opacity: !question.trim() || question.trim().length < 5 ? 0.45 : 1,
            cursor: !question.trim() || question.trim().length < 5 ? 'not-allowed' : 'pointer',
          }}
          disabled={!question.trim() || question.trim().length < 5}
          onClick={onStartPicking}
        >
          {language === 'en' ? '🌙 Spread the Deck' : '🌙 Trải Bộ Bài Ra'}
        </button>
      </div>
    </div>
  );
}
