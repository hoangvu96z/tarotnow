import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

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

    const sysRole = t('export.prompt_system', 'Tôi muốn bạn đóng vai một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith.');
    const qLabel = t('export.prompt_question', 'CÂU HỎI CỦA TÔI:');
    const dLabel = t('export.prompt_details', 'CHI TIẾT TRẢI BÀI ĐÃ RÚT:');
    const sLabel = t('export.prompt_summary', 'TÓM TẮT LUẬN GIẢI CƠ BẢN (NỀN TẢNG SƠ BỘ):');
    const gLabel = t('export.prompt_guide', 'HƯỚNG DẪN GIẢI NGHĨA CHO AI:');
    const rLabel = t('export.prompt_req', 'Yêu cầu định dạng phản hồi:');
    const rBullets = t('export.prompt_req_bullets', '- Sử dụng tiếng Việt, viết trôi chảy, sâu sắc và khách quan.\n- Có tiêu đề rõ ràng cho từng phần.\n- Kết luận bằng một thông điệp đúc kết hoặc hành động cụ thể tôi nên làm.');

    return `${sysRole}\n\n${qLabel}\n"${question}"\n\n${dLabel}\n${cardsSection}\n${interpretationSummary ? `\n${sLabel}\n${interpretationSummary}\n` : ''}\n${gLabel}\n${instruction}\n\n${rLabel}\n${rBullets}`;
  };

  const handleCopy = async () => {
    const textToCopy = activeTab === 'prompt' ? getPromptText() : formatCardsList();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed: ', err);
    }
  };

  return (
    <div className="export-container glass-panel">
      <div className="export-header">
        <h3 className="export-title">{t('export.title', 'Xuất dữ liệu luận giải cho AI')}</h3>
        <div className="tab-buttons">
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
      </div>

      {activeTab === 'prompt' && (
        <div className="prompt-template-selector">
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
    </div>
  );
}
