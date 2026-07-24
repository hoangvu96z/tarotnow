import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * PromptExporter Component
 * Generates formatted text outputs for copy-pasting into AI platforms.
 */
export default function PromptExporter({ 
  question, 
  drawnCards, 
  spreadName, 
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning
}) {
  const { t, language } = useLanguage();
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'list'
  const [copied, setCopied] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'

  if (!drawnCards || drawnCards.length === 0) return null;

  const isEn = language === 'en';

  // Format drawn cards as text
  const formatCardsList = () => {
    let text = `${t('form.question_label', 'Câu hỏi')}: ${question}\n${isEn ? 'Spread' : 'Trải bài'}: ${spreadName}\n`;
    if (interpretationContext) {
      text += `${t('result.perspective_prefix', 'Góc nhìn')}: ${interpretationContext}\n`;
    }
    text += `\n${isEn ? 'Drawn Cards List' : 'Danh sách lá bài đã rút'}:\n` + 
      drawnCards.map((c, idx) => {
        const orientationText = c.orientation === 'reversed' 
          ? t('result.mini_reversed', 'Lá ngược (reversed)') 
          : t('result.mini_upright', 'Lá xuôi (upright)');
        const posText = spreadPositions && spreadPositions[idx] ? ` [${isEn ? 'Position' : 'Vị trí'}: ${spreadPositions[idx]}]` : '';
        const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';
        
        let cardStr = `${idx + 1}. ${c.name} (${orientationText})${posText}`;
        if (localMeaning) {
          cardStr += `\n   -> ${isEn ? 'Basic meaning' : 'Giải nghĩa cơ bản'}: ${localMeaning}`;
        }
        return cardStr;
      }).join('\n\n');
      
    if (interpretationSummary) {
      text += `\n\n${isEn ? 'General Overview' : 'Nhận xét tổng quan'}:\n${interpretationSummary}`;
    }
    return text;
  };

  // Generate detailed prompt templates
  const getPromptText = () => {
    const cardsSection = drawnCards.map((c, idx) => {
      const orientationText = c.orientation === 'reversed' 
        ? t('modal.orientation_reversed', 'Lá ngược (Reversed)') 
        : t('modal.orientation_upright', 'Lá xuôi (Upright)');
      const kws = c.orientation === 'reversed' ? c.reversedKeywords : c.uprightKeywords;
      const posText = spreadPositions && spreadPositions[idx] ? ` - ${isEn ? 'Position meaning' : 'Ý nghĩa vị trí'}: ${spreadPositions[idx]}` : '';
      const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';
      
      return `${idx + 1}. ${isEn ? 'Card' : 'Lá bài'}: ${c.name}\n` +
             `   - ${isEn ? 'Orientation' : 'Trạng thái'}: ${orientationText}\n` +
             `   - ${isEn ? 'Category' : 'Nhóm'}: ${c.arcana}${c.suit ? ` (${c.suit})` : ''}\n` +
             `   - ${isEn ? 'Keywords' : 'Từ khóa chính'}: ${kws.join(', ')}\n` +
             `${posText ? `   - ${isEn ? 'Position in spread' : 'Vị trí trong trải bài'}: ${posText}\n` : ''}` +
             `${localMeaning ? `   - ${isEn ? 'Preliminary meaning' : 'Giải nghĩa cơ bản sơ bộ'}: ${localMeaning}\n` : ''}`;
    }).join('\n');

    let instruction = '';
    if (isEn) {
      switch (promptTemplate) {
        case 'love':
          instruction = 'Please interpret this spread focusing on Love & Relationships. Analyze the emotions, thoughts, current blockages, and offer concrete action advice to improve this connection.';
          break;
        case 'career':
          instruction = 'Please interpret this spread focusing on Career, Business & Finance. Analyze potential opportunities, challenges to overcome, the best path forward, and practical steps for the present.';
          break;
        case 'standard':
        default:
          instruction = 'Please interpret this spread in a comprehensive and deep manner. Analyze the meaning of each card, the energetic connection between them, and compile it into a cohesive guidance message for my question.';
          break;
      }
    } else {
      switch (promptTemplate) {
        case 'love':
          instruction = 'Hãy luận giải trải bài này theo khía cạnh Tình cảm & Các mối quan hệ. Phân tích chi tiết cảm xúc, suy nghĩ của các bên, rào cản hiện tại và lời khuyên hành động cụ thể để cải thiện mối quan hệ này.';
          break;
        case 'career':
          instruction = 'Hãy luận giải trải bài này theo khía cạnh Công việc, Sự nghiệp & Tài chính. Phân tích rõ các cơ hội tiềm năng, thách thức cần vượt qua, hướng đi tốt nhất và cách ứng phó thực tế ở thời điểm hiện tại.';
          break;
        case 'standard':
        default:
          instruction = 'Hãy luận giải trải bài này một cách toàn diện và sâu sắc. Phân tích ý nghĩa từng lá, mối liên kết năng lượng giữa chúng và tổng hợp thành thông điệp khuyên bảo cụ thể cho câu hỏi của tôi.';
          break;
      }
    }

    let roleText = isEn
      ? "Act as an expert Tarot Reader and intuitive mentor. Provide a deep, insightful, and compassionate interpretation."
      : "Hãy đóng vai một Reader Tarot chuyên nghiệp và giàu kinh nghiệm. Hãy đưa ra luận giải sâu sắc, thấu đáo và đầy tính định hướng.";
      
    if (promptTemplate === 'love') {
      roleText = isEn
        ? "Act as a relationship counselor and Tarot Reader specializing in love dynamics, emotional connections, and romantic growth."
        : "Hãy đóng vai một chuyên gia tư vấn tình cảm & Reader Tarot chuyên sâu về tình yêu, cảm xúc và các mối quan hệ.";
    } else if (promptTemplate === 'career') {
      roleText = isEn
        ? "Act as a strategic career coach and Tarot Reader focusing on practical advice, work dynamics, financial outlook, and professional growth."
        : "Hãy đóng vai một chuyên gia định hướng sự nghiệp & Reader Tarot chuyên sâu về công việc, tài chính và phát triển bản thân.";
    }

    return `${roleText}\n\n${formatCardsList()}\n\n${isEn ? 'Please provide a detailed reading based on the information above.' : 'Vui lòng đưa ra lời luận giải chi tiết dựa trên thông tin trên.'}`;
  };

  const handleCopy = () => {
    const textToCopy = activeTab === 'prompt' ? getPromptText() : formatCardsList();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="glass-panel prompt-exporter-panel" style={{ marginTop: 24 }}>
      <div className="card-header-flex">
        <h3 className="settings-title">{t('export.title', 'Xuất dữ liệu luận giải cho AI')}</h3>
        {isAuthenticated && (
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompt')}
            >
              {t('export.tab_prompt', 'Prompt Mẫu cho AI')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              {t('export.tab_list', 'Danh sách gọn')}
            </button>
          </div>
        )}
      </div>

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
            marginTop: 16,
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
            {t(
              'export.guest_notice',
              'Bạn cần đăng nhập để sử dụng tính năng xuất dữ liệu luận giải cho AI.'
            )}
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
            🔑 {t('auth.login_now', 'Đăng nhập ngay')}
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'prompt' && (
            <div className="prompt-template-selector" style={{ marginTop: 16 }}>
              <label className="template-label">{t('export.select_type', 'Chọn kiểu luận giải:')}</label>
              <div className="template-options">
                <button 
                  className={`template-opt-btn ${promptTemplate === 'standard' ? 'selected' : ''}`}
                  onClick={() => setPromptTemplate('standard')}
                >
                  {t('export.type_general', 'Tổng quan')}
                </button>
                <button 
                  className={`template-opt-btn ${promptTemplate === 'love' ? 'selected' : ''}`}
                  onClick={() => setPromptTemplate('love')}
                >
                  {t('export.type_love', 'Tình yêu')}
                </button>
                <button 
                  className={`template-opt-btn ${promptTemplate === 'career' ? 'selected' : ''}`}
                  onClick={() => setPromptTemplate('career')}
                >
                  {t('export.type_career', 'Công việc')}
                </button>
              </div>
            </div>
          )}

          <div className="output-preview-box">
            <pre className="output-text">
              {activeTab === 'prompt' ? getPromptText() : formatCardsList()}
            </pre>
          </div>

          <div className="export-actions">
            <button 
              className={`copy-main-btn ${copied ? 'success' : ''}`}
              onClick={handleCopy}
            >
              {copied ? t('export.copied_btn', '✓ Đã Copy Thành Công!') : t('export.copy_btn', 'Sao chép kết quả')}
            </button>
            <span className="export-hint">
              {activeTab === 'prompt' 
                ? t('export.hint_prompt', 'Copy prompt này dán thẳng vào ChatGPT/Claude/Perplexity để có luận giải chuẩn nhất!')
                : t('export.hint_list', 'Copy danh sách ngắn gọn các lá bài đã rút.')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
