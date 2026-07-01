import React, { useState } from 'react';

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
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'list'
  const [copied, setCopied] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'

  if (!drawnCards || drawnCards.length === 0) return null;

  // Format drawn cards as text
  const formatCardsList = () => {
    let text = `Câu hỏi: ${question}\nTrải bài: ${spreadName}\n`;
    if (interpretationContext) {
      text += `Góc nhìn: ${interpretationContext}\n`;
    }
    text += `\nDanh sách lá bài đã rút:\n` + 
      drawnCards.map((c, idx) => {
        const orientationText = c.orientation === 'reversed' ? 'Lá ngược (reversed)' : 'Lá xuôi (upright)';
        const posText = spreadPositions && spreadPositions[idx] ? ` [Vị trí: ${spreadPositions[idx]}]` : '';
        const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';
        
        let cardStr = `${idx + 1}. ${c.name} (${orientationText})${posText}`;
        if (localMeaning) {
          cardStr += `\n   -> Giải nghĩa cơ bản: ${localMeaning}`;
        }
        return cardStr;
      }).join('\n\n');
      
    if (interpretationSummary) {
      text += `\n\nNhận xét tổng quan:\n${interpretationSummary}`;
    }
    return text;
  };

  // Generate detailed prompt templates
  const getPromptText = () => {
    const cardsSection = drawnCards.map((c, idx) => {
      const orientationText = c.orientation === 'reversed' ? 'Lá ngược (Reversed)' : 'Lá xuôi (Upright)';
      const kws = c.orientation === 'reversed' ? c.reversedKeywords : c.uprightKeywords;
      const posText = spreadPositions && spreadPositions[idx] ? ` - Ý nghĩa vị trí: ${spreadPositions[idx]}` : '';
      const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';
      
      return `${idx + 1}. Lá bài: ${c.name}\n` +
             `   - Trạng thái: ${orientationText}\n` +
             `   - Nhóm: ${c.arcana}${c.suit ? ` (${c.suit})` : ''}\n` +
             `   - Từ khóa chính: ${kws.join(', ')}\n` +
             `${posText ? `   - Vị trí trong trải bài: ${posText}\n` : ''}` +
             `${localMeaning ? `   - Giải nghĩa cơ bản sơ bộ: ${localMeaning}\n` : ''}`;
    }).join('\n');

    let instruction = '';
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

    return `Tôi muốn bạn đóng vai một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith.

CÂU HỎI CỦA TÔI:
"${question}"

CHI TIẾT TRẢI BÀI ĐÃ RÚT:
${cardsSection}
${interpretationSummary ? `\nTÓM TẮT LUẬN GIẢI CƠ BẢN (NỀN TẢNG SƠ BỘ):\n${interpretationSummary}\n` : ''}
HƯỚNG DẪN GIẢI NGHĨA CHO AI:
${instruction}

Yêu cầu định dạng phản hồi:
- Sử dụng tiếng Việt, viết trôi chảy, sâu sắc và khách quan.
- Có tiêu đề rõ ràng cho từng phần.
- Kết luận bằng một thông điệp đúc kết hoặc hành động cụ thể tôi nên làm.`;
  };

  const handleCopy = async () => {
    const textToCopy = activeTab === 'prompt' ? getPromptText() : formatCardsList();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Không thể copy vào clipboard: ', err);
    }
  };

  return (
    <div className="export-container glass-panel">
      <div className="export-header">
        <h3 className="export-title">Xuất dữ liệu luận giải cho AI</h3>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            Prompt Mẫu cho AI
          </button>
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Danh sách gọn
          </button>
        </div>
      </div>

      {activeTab === 'prompt' && (
        <div className="prompt-template-selector">
          <label className="template-label">Chọn kiểu luận giải:</label>
          <div className="template-options">
            <button 
              className={`template-opt-btn ${promptTemplate === 'standard' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('standard')}
            >
              Tổng quan
            </button>
            <button 
              className={`template-opt-btn ${promptTemplate === 'love' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('love')}
            >
              Tình yêu
            </button>
            <button 
              className={`template-opt-btn ${promptTemplate === 'career' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('career')}
            >
              Công việc
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
          {copied ? '✓ Đã Copy Thành Công!' : 'Sao chép kết quả'}
        </button>
        <span className="export-hint">
          {activeTab === 'prompt' 
            ? 'Copy prompt này dán thẳng vào ChatGPT/Claude/Perplexity để có luận giải chuẩn nhất!'
            : 'Copy danh sách ngắn gọn các lá bài đã rút.'}
        </span>
      </div>
    </div>
  );
}
