import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlan } from '../hooks/usePlan.js';
import PricingModal from './PricingModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PREDEFINED_MODELS = [
  { value: 'combo1', label: 'combo1 (Combo)' },
  { value: 'openrouter/tencent/hy3:free', label: 'hy3:free' },
  { value: 'openrouter/openai/gpt-oss-20b:free', label: 'gpt-oss-20b:free' },
  { value: 'openrouter/poolside/laguna-xs-2.1:free', label: 'laguna-xs-2.1:free' },
  { value: 'openrouter/google/gemma-4-26b-a4b-it:free', label: 'gemma-4-26b-a4b-it:free' }
];

export default function AiInterpretationPanel({ 
  question, 
  drawnCards, 
  spreadName, 
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning,
  readingId,
  onSaveAiConversation,
  savedConversation,
}) {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState({
    endpoint: 'http://43.128.116.69:20128/v1',
    apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739',
    model: 'combo1',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({
    endpoint: '',
    apiKey: '',
    model: ''
  });
  const [modelType, setModelType] = useState('combo1');
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  const [modelsList, setModelsList] = useState(PREDEFINED_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  // ─── Follow-up Q&A State ──────────────────────────────────────────────────
  const [followUps, setFollowUps] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [currentFollowUpAnswer, setCurrentFollowUpAnswer] = useState('');

  const charCount = userQuestion.length;
  const isCharCountValid = charCount > 0 && charCount <= 2048;

  const isEn = language === 'en';

  // ─── Quota & Plan ─────────────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const { canAsk, remaining, plan, canBonus, expiresAt, daysRemaining, isExpiringSoon, isOverride, consumeQuota, requestBonus, applyCoupon } = usePlan(isAuthenticated);
  const [showPricing, setShowPricing] = useState(false);

  // Restore conversation từ savedConversation prop (khi load từ history)
  useEffect(() => {
    if (savedConversation) {
      if (savedConversation.initialInterpretation) {
        setInterpretation(savedConversation.initialInterpretation);
      }
      if (Array.isArray(savedConversation.followUps) && savedConversation.followUps.length > 0) {
        setFollowUps(savedConversation.followUps);
      }
    } else {
      setInterpretation('');
      setFollowUps([]);
      setUserQuestion('');
      setError('');
    }
  }, [savedConversation]);

  const getResolvedEndpoint = (endpoint) => {
    if (!endpoint) return '';
    let callEndpoint = endpoint.replace(/\/$/, '');
    const isHttp = callEndpoint.startsWith('http://');
    const isSecureCtx = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    if (isHttp && isSecureCtx) {
      const path = window.location.pathname;
      let base = '/';
      if (path.startsWith('/kinhdich')) base = '/kinhdich/';
      else if (path.startsWith('/tarot')) base = '/tarot/';
      const suffix = callEndpoint.replace(/^http:\/\/[^/]+/, '');
      callEndpoint = base + 'api-vps' + suffix;
    }
    return callEndpoint;
  };

  const fetchModels = async (currentSettings) => {
    if (!currentSettings.endpoint) return;
    setLoadingModels(true);
    setModelsError('');
    try {
      const resolvedEndpoint = getResolvedEndpoint(currentSettings.endpoint);
      const headers = {
        'Content-Type': 'application/json',
      };
      if (currentSettings.apiKey) {
        headers['Authorization'] = `Bearer ${currentSettings.apiKey}`;
      }
      const response = await fetch(`${resolvedEndpoint}/models`, {
        method: 'GET',
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetched = data.data.map(m => {
          const simpleName = m.id.split('/').pop();
          const label = m.owned_by === 'combo' ? `${simpleName} (Combo)` : simpleName;
          return {
            value: m.id,
            label: label
          };
        });
        setModelsList(fetched);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.warn('Error fetching models:', err);
      setModelsError('Unable to load models: ' + err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load settings
  useEffect(() => {
    const defaultSettings = {
      endpoint: 'http://43.128.116.69:20128/v1',
      apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739',
      model: 'combo1',
    };
    let activeSettings = { ...defaultSettings };
    try {
      const saved = localStorage.getItem('tarot_ai_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        activeSettings = {
          ...activeSettings,
          endpoint: parsed.endpoint || activeSettings.endpoint,
          model: parsed.model || activeSettings.model
        };
      }
    } catch (e) {}
    setSettings(activeSettings);
    fetchModels(activeSettings);
  }, []);

  // Sync settings to form when settings modal opens
  useEffect(() => {
    if (showSettings) {
      setFormSettings(settings);
      const isPredefined = modelsList.some(m => m.value === settings.model);
      setModelType(isPredefined ? settings.model : 'custom');
    }
  }, [showSettings, settings, modelsList]);

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const newSettings = {
      endpoint: formSettings.endpoint,
      apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739', // Enforced default
      model: formSettings.model
    };
    setSettings(newSettings);
    localStorage.setItem('tarot_ai_settings', JSON.stringify({
      endpoint: newSettings.endpoint,
      model: newSettings.model
    }));
    setShowSettings(false);
    fetchModels(newSettings);
  };

  // Generate detailed prompt text
  const getPromptText = () => {
    if (!drawnCards || drawnCards.length === 0) return '';
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
          instruction = 'Hãy luận giải trải bài này theo khía trạng Tình cảm & Các mối quan hệ. Phân tích chi tiết cảm xúc, suy nghĩ của các bên, rào cản hiện tại và lời khuyên hành động cụ thể để cải thiện mối quan hệ này.';
          break;
        case 'career':
          instruction = 'Hãy luận giải trải bài này theo khía trạng Công việc, Sự nghiệp & Tài chính. Phân tích rõ các cơ hội tiềm năng, thách thức cần vượt qua, hướng đi tốt nhất và cách ứng phó thực tế ở thời điểm hiện tại.';
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
    const rBullets = isEn
      ? '- Use English, fluently, deeply and objectively.\n- Use clear section headers.\n- Conclude with actionable guidance.\n- At the end, provide exactly 3 concise suggested follow-up questions under:\n### 💡 Suggested Follow-up Questions:\n- 💡 Q1: [Question 1]\n- 💡 Q2: [Question 2]\n- 💡 Q3: [Question 3]'
      : '- Sử dụng tiếng Việt, viết trôi chảy, sâu sắc và khách quan.\n- Có tiêu đề rõ ràng cho từng phần.\n- Kết luận bằng một thông điệp đúc kết hoặc hành động cụ thể tôi nên làm.\n- Cuối bài luận giải, đưa ra đúng 3 câu hỏi gợi ý đào sâu ngắn gọn cho người dùng ở phần:\n### 💡 Gợi ý 3 câu hỏi tiếp theo dành cho bạn:\n- 💡 Q1: [Câu hỏi 1]\n- 💡 Q2: [Câu hỏi 2]\n- 💡 Q3: [Câu hỏi 3]';

    return `${sysRole}\n\n${qLabel}\n"${question}"\n\n${dLabel}\n${cardsSection}\n${interpretationSummary ? `\n${sLabel}\n${interpretationSummary}\n` : ''}\n${gLabel}\n${instruction}\n\n${rLabel}\n${rBullets}`;
  };

  const handleInterpret = async () => {
    if (!drawnCards || drawnCards.length === 0) return;

    // Check quota before calling AI
    const quotaResult = await consumeQuota();
    if (!quotaResult.ok) {
      setShowPricing(true);
      return;
    }

    setLoading(true);
    setError('');
    setInterpretation('');
    setStatusText(isEn ? 'Connecting to AI Server...' : 'Đang kết nối đến server AI...');

    try {
      const sysPrompt = isEn
        ? `You are a professional Tarot reader, highly knowledgeable in Rider-Waite-Smith symbolism, Jungian archetypes, and holistic life guidance. Please interpret the drawn cards deeply, empathetically, and constructively. Help the user reflect on their situations instead of making superstitious predictions. Always respond in English.`
        : `Bạn là một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith, các hình mẫu tâm lý học Jung và hướng dẫn cuộc sống toàn diện. Hãy giải nghĩa các lá bài đã rút một cách sâu sắc, thấu cảm và mang tính xây dựng. Giúp người dùng suy ngẫm về hoàn cảnh thay vì đưa ra các phán đoán mang tính bói toán mê tín. Luôn trả lời bằng tiếng Việt.`;


      const userPrompt = getPromptText();

      const fallbackModels = Array.from(new Set([
        settings.model,
        'combo1',
        'openrouter/tencent/hy3:free'
      ])).filter(Boolean);

      let lastError = null;

      for (let i = 0; i < fallbackModels.length; i++) {
        const currentModel = fallbackModels[i];
        try {
          setStatusText(
            i === 0 
              ? (isEn ? 'AI is reading the cards...' : 'AI đang chiêm nghiệm các lá bài...')
              : `Mô hình ${fallbackModels[i - 1]} gặp sự cố, đang thử ${currentModel}...`
          );

          const callEndpoint = getResolvedEndpoint(settings.endpoint);

          const response = await fetch(`${callEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
            },
            body: JSON.stringify({
              model: currentModel,
              messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: userPrompt }
              ],
              stream: true
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP error ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let buffer = '';
          let resultText = '';

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              let boundary = buffer.indexOf('\n');
              while (boundary !== -1) {
                const line = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 1);
                boundary = buffer.indexOf('\n');

                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === '[DONE]') {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const chunkText = parsed.choices?.[0]?.delta?.content || '';
                    resultText += chunkText;
                    setInterpretation(resultText);
                  } catch (err) {
                    // Keep buffer processing
                  }
                }
              }
            }
          }
          
          // Successful run, exit loop
          if (onSaveAiConversation && readingId && resultText) {
            onSaveAiConversation(readingId, {
              aiConversation: {
                initialInterpretation: resultText,
                initialTimestamp: new Date().toISOString(),
                followUps: [],
              }
            });
          }
          return;
        } catch (err) {
          console.warn(`Model ${currentModel} failed:`, err);
          lastError = err;
          // Clear any partial response so we don't end up with mixed texts
          setInterpretation('');
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while calling the AI server API.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // Helper for context memory
  const getPlainContext = () => {
    if (!drawnCards || drawnCards.length === 0) return '';
    const cardsText = drawnCards.map((c, idx) => {
      const ori = c.orientation === 'reversed' ? 'Ngược' : 'Xuôi';
      return `${idx + 1}. ${c.name} — ${ori}`;
    }).join('\n');
    return `Câu hỏi: "${question || 'Không có'}"\nTrải bài: ${spreadName || 'Custom'}\nCác lá bài:\n${cardsText}`;
  };

  const extractAiSuggestedQuestions = (text, qTopic, isEnglish) => {
    const list = [];
    if (text) {
      const matches = text.match(/(?:-|\*|\d+\.)?\s*💡\s*(?:Q\d+:?)?\s*([^\n\r]+)/gi);
      if (matches && matches.length >= 1) {
        matches.forEach(m => {
          const cleaned = m
            .replace(/(?:-|\*|\d+\.)?\s*💡\s*(?:Q\d+:?)?\s*/i, '')
            .replace(/^[-*0-9.:\s]+/, '')
            .trim();
          if (cleaned && cleaned.length > 5 && !list.includes(cleaned)) {
            list.push(cleaned);
          }
        });
      }
    }

    if (list.length >= 3) return list.slice(0, 3);

    const topic = (qTopic || '').toLowerCase();
    if (topic.includes('tình') || topic.includes('yêu') || topic.includes('love') || topic.includes('relationship') || topic.includes('kết hôn')) {
      return isEnglish ? [
        'What are the core feelings and thoughts of the other person towards me?',
        'What action should I take to strengthen or heal this relationship?',
        'What potential outcome can I expect in our relationship over the next 3 months?'
      ] : [
        'Suy nghĩ và cảm xúc cốt lõi của đối phương dành cho tôi hiện tại là gì?',
        'Tôi nên hành động như thế nào để gắn kết hoặc cải thiện mối quan hệ này?',
        'Kết quả triển vọng nhất của hai người trong 3 tháng tới sẽ ra sao?'
      ];
    }
    if (topic.includes('việc') || topic.includes('công') || topic.includes('tiền') || topic.includes('career') || topic.includes('job') || topic.includes('money')) {
      return isEnglish ? [
        'What is the biggest advantage or opportunity indicated by this Tarot spread?',
        'What hidden challenge or obstacle should I prepare for in my career/finance?',
        'What specific step should I take right now to boost my success?'
      ] : [
        'Ưu điểm hoặc cơ hội lớn nhất mà trải bài Tarot chỉ ra cho tôi là gì?',
        'Thách thức hoặc trở ngại ngầm nào tôi cần chuẩn bị trước trong công việc/tài chính?',
        'Hành động cụ thể nào tôi nên thực hiện ngay lúc này để gia tăng thành công?'
      ];
    }
    return isEnglish ? [
      'What key message or lesson are the Tarot cards giving me right now?',
      'What hidden factors or influences am I currently ignoring?',
      'What is the most recommended next step for me to move forward?'
    ] : [
      'Thông điệp hay bài học quan trọng nhất mà các lá bài Tarot muốn nhắn gửi là gì?',
      'Yếu tố ngầm hay tác động nào mà tôi đang vô tình bỏ qua?',
      'Bước đi tiếp theo được khuyến nghị nhất cho tôi lúc này là gì?'
    ];
  };

  const suggestedQuestions = extractAiSuggestedQuestions(interpretation, question, isEn);

  // ─── Follow-up Q&A Handler ────────────────────────────────────────────────
  const handleSendFollowUp = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const questionToSend = (textOverride || userQuestion).trim();
    if (!questionToSend || askingFollowUp || followUps.length >= 5) return;

    // Check quota before calling AI
    const quotaResult = await consumeQuota();
    if (!quotaResult.ok) {
      setShowPricing(true);
      return;
    }

    setAskingFollowUp(true);
    setFollowUpError('');
    setCurrentFollowUpAnswer('');

    try {
      const sysPrompt = isEn
        ? `You are a professional Tarot reader, highly knowledgeable in Rider-Waite-Smith symbolism. The user is asking a follow-up question based on their drawn Tarot spread and previous interpretation.\nRequirements:\n1. Answer CONCISELY and directly address the user's question. Do NOT repeat card names or introductory fluff.\n2. Briefly analyze based on the drawn cards and previous interpretation.\n3. Conclude with clear, practical advice. Always respond in English.`
        : `Bạn là một chuyên gia Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith. Người dùng đang hỏi thêm một câu hỏi cụ thể dựa trên trải bài Tarot và luận giải đã có trước đó.\nYêu cầu quan trọng khi trả lời câu hỏi thêm:\n1. Trả lời NGẮN GỌN, súc tích, đi thẳng vào trọng tâm câu hỏi. KHÔNG dông dài, KHÔNG lặp lại phần giới thiệu hay tên các lá bài đã biết.\n2. Phân tích ngắn gọn dựa trên các lá bài đã rút và luận giải trước đó.\n3. Đưa ra kết luận hoặc lời khuyên cụ thể, ngắn gọn, dễ hiểu. Luôn trả lời bằng tiếng Việt.`;

      const contextPrompt = getPlainContext();

      const messages = [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: isEn ? `My Tarot spread:\n${contextPrompt}` : `Trải bài Tarot của tôi:\n${contextPrompt}` },
        { role: 'assistant', content: interpretation }
      ];


      followUps.forEach(item => {
        messages.push({ role: 'user', content: item.question });
        messages.push({ role: 'assistant', content: item.answer });
      });

      messages.push({ role: 'user', content: questionToSend });

      const fallbackModels = Array.from(new Set([settings.model, 'combo1', 'openrouter/tencent/hy3:free'])).filter(Boolean);
      let lastErr = null;
      let finalAns = '';

      for (let i = 0; i < fallbackModels.length; i++) {
        const currentModel = fallbackModels[i];
        try {
          const callEndpoint = getResolvedEndpoint(settings.endpoint);
          const response = await fetch(`${callEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
            },
            body: JSON.stringify({ model: currentModel, messages, stream: true })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP error ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let buffer = '';

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              let boundary = buffer.indexOf('\n');
              while (boundary !== -1) {
                const line = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 1);
                boundary = buffer.indexOf('\n');
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === '[DONE]') { done = true; break; }
                  try {
                    const parsed = JSON.parse(jsonStr);
                    finalAns += parsed.choices?.[0]?.delta?.content || '';
                    setCurrentFollowUpAnswer(finalAns);
                  } catch (err) {}
                }
              }
            }
          }

          const newFollowUp = {
            id: Date.now().toString(),
            question: questionToSend,
            answer: finalAns,
            questionTimestamp: new Date(Date.now() - Math.max(finalAns.length * 5, 1000)).toISOString(),
            answerTimestamp: new Date().toISOString(),
          };
          const updatedFollowUps = [...followUps, newFollowUp];
          setFollowUps(updatedFollowUps);
          setUserQuestion('');
          setCurrentFollowUpAnswer('');

          // Persist follow-up lên server
          if (onSaveAiConversation && readingId) {
            onSaveAiConversation(readingId, {
              aiConversation: {
                initialInterpretation: interpretation,
                initialTimestamp: savedConversation?.initialTimestamp || new Date().toISOString(),
                followUps: updatedFollowUps,
              }
            });
          }
          return;
        } catch (err) {
          console.warn(`Follow-up model ${currentModel} failed:`, err);
          lastErr = err;
          setCurrentFollowUpAnswer('');
        }
      }

      if (lastErr) throw lastErr;
    } catch (err) {
      console.error(err);
      setFollowUpError(err.message || 'Lỗi khi kết nối AI để trả lời câu hỏi.');
    } finally {
      setAskingFollowUp(false);
    }
  };

  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.05rem; margin-top: 16px; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.25rem; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid rgba(229,193,88,0.2); padding-bottom: 4px; font-weight: 600; letter-spacing: 0.5px;">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.40rem; margin-top: 24px; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px;">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: #dfdbf0;">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: #dfdbf0;">$1</li>');

    // Paragraphs
    const lines = html.split('\n');
    let inList = false;
    const processed = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<li')) {
        if (!inList) {
          inList = true;
          return '<ul style="margin: 8px 0; padding-left: 10px;">' + line;
        }
        return line;
      } else {
        let prefix = '';
        if (inList) {
          inList = false;
          prefix = '</ul>';
        }
        if (trimmed === '') return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul')) {
          return prefix + line;
        }
        return prefix + `<p style="margin: 8px 0; line-height: 1.65; color: #dfdbf0;">${line}</p>`;
      }
    });
    if (inList) processed.push('</ul>');

    return processed.join('\n');
  }

  return (
    <>
    <PricingModal
      isOpen={showPricing}
      onClose={() => setShowPricing(false)}
      currentPlan={plan}
      canBonus={canBonus}
      expiresAt={expiresAt}
      daysRemaining={daysRemaining}
      isExpiringSoon={isExpiringSoon}
      isOverride={isOverride}
      onRequestBonus={requestBonus}
      onApplyCoupon={applyCoupon}
    />
    <div className="interpretation-section glass-panel" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(229,193,88,0.2)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <h2 className="results-title" style={{ fontSize: '20px', margin: 0, textAlign: 'left' }}>
            {t('ai.title', 'Luận giải Tarot bằng AI')}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quota badge */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.06)', color: remaining === 0 ? '#ef4444' : '#94a3b8',
            border: `1px solid ${remaining === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            ⚡ {remaining} lượt còn lại
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px',
              borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            ⚙️ <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('ai.settings', 'Cấu hình')}</span>
          </button>
        </div>
      </div>

      {/* AI Settings Form */}
      {showSettings && (
        <form onSubmit={handleSaveSettings} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(229,193,88,0.2)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#e5c158' }}>{t('ai.settings_header', 'Cấu hình Server AI (9Router)')}</h4>
          
          <div>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>API Endpoint *</label>
            <input
              type="text"
              className="custom-textarea"
              style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '36px' }}
              value={formSettings.endpoint}
              onChange={e => setFormSettings({ ...formSettings, endpoint: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chọn Model *</span>
              {loadingModels && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>⏳ Đang tải...</span>}
              {modelsError && <span style={{ fontSize: '10px', color: 'red' }} title={modelsError}>⚠️ Lỗi tải model</span>}
            </label>
            <select
              className="custom-textarea"
              style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '38px', background: '#1c172e', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
              value={modelType}
              onChange={e => {
                const val = e.target.value;
                setModelType(val);
                if (val !== 'custom') {
                  setFormSettings({ ...formSettings, model: val });
                }
              }}
            >
              {modelsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
              <option value="custom">Tùy chỉnh...</option>
            </select>
          </div>

          {modelType === 'custom' && (
            <div>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>Nhập Model Name tùy chỉnh *</label>
              <input
                type="text"
                className="custom-textarea"
                style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '36px' }}
                value={formSettings.model}
                onChange={e => setFormSettings({ ...formSettings, model: e.target.value })}
                placeholder="Nhập tên model (ví dụ: combo1)"
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" className="reset-weights-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowSettings(false)}>
              {t('common.cancel', 'Hủy')}
            </button>
            <button type="submit" className="copy-main-btn" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '80px' }}>
              {t('common.save', 'Lưu lại')}
            </button>
          </div>
        </form>
      )}

      {/* Template Selector for AI Prompt context */}
      {!interpretation && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('export.select_type', 'Chọn kiểu luận giải:')}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['standard', 'love', 'career'].map(type => (
              <button
                key={type}
                onClick={() => setPromptTemplate(type)}
                style={{
                  background: promptTemplate === type ? 'rgba(229,193,88,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${promptTemplate === type ? 'var(--gold-color)' : 'rgba(255,255,255,0.08)'}`,
                  color: promptTemplate === type ? '#fff' : 'var(--text-muted)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {t(`export.type_${type === 'standard' ? 'general' : type}`, type)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action and Interpretation */}
      {!interpretation && !loading && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <button
            onClick={handleInterpret}
            className="copy-main-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto',
              padding: '12px 28px',
              maxWidth: '360px',
              fontSize: '14px'
            }}
          >
            <span>✨</span> {t('ai.button_cast_tarot', 'Luận giải Tarot bằng AI')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(229,193,88,0.1)',
            borderTop: '3px solid var(--gold-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {statusText}
          </span>
          {interpretation && (
            <div style={{ width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(229,193,88,0.15)', borderRadius: '8px', padding: '16px', marginTop: '12px' }}>
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(interpretation) }} />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '12px', background: 'rgba(235,94,85,0.08)', border: '1px solid rgba(235,94,85,0.2)', borderRadius: '8px', color: '#eb5e55', fontSize: '13px' }}>
          <strong>Lỗi:</strong> {error}
          <div style={{ marginTop: '8px' }}>
            <button onClick={handleInterpret} className="copy-main-btn" style={{ padding: '4px 10px', fontSize: '12px', width: 'auto' }}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Final Interpretation Result */}
      {!loading && interpretation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(229,193,88,0.15)', borderRadius: '8px', padding: '20px' }}>
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(interpretation) }} />
          </div>

          {/* ─── Follow-up Q&A Chat Section ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(229,193,88,0.15)' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(229,193,88,0.7)', fontWeight: 600, letterSpacing: '0.06em' }}>
                💬 HỎI THÊM AI ({followUps.length}/5)
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(229,193,88,0.15)' }} />
            </div>

            {/* Previous Q&A list */}
            {followUps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {followUps.map((fu, idx) => (
                  <div key={fu.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Question bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '80%', background: 'rgba(229,193,88,0.12)', border: '1px solid rgba(229,193,88,0.25)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#f5e6a3', fontWeight: 600 }}>{fu.question}</div>
                        {fu.questionTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'rgba(229,193,88,0.5)', marginTop: 3, textAlign: 'right', fontFamily: 'monospace' }}>
                            🕐 {new Date(fu.questionTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Answer bubble */}
                    {fu.answer && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ maxWidth: '85%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '0.82rem', color: '#dfdbf0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{fu.answer}</div>
                          {fu.answerTimestamp && (
                            <div style={{ fontSize: '0.68rem', color: 'rgba(229,193,88,0.4)', marginTop: 3, fontFamily: 'monospace' }}>
                              🕐 {new Date(fu.answerTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Streaming current answer */}
            {askingFollowUp && currentFollowUpAnswer && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '85%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#dfdbf0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{currentFollowUpAnswer}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(229,193,88,0.5)', marginTop: 3 }}>⏳ Đang trả lời...</div>
                </div>
              </div>
            )}

            {/* Follow-up error */}
            {followUpError && (
              <div style={{ padding: '8px 12px', background: 'rgba(235,94,85,0.08)', border: '1px solid rgba(235,94,85,0.2)', borderRadius: '8px', color: '#eb5e55', fontSize: '12px' }}>
                ⚠️ {followUpError}
              </div>
            )}

            {/* Question input form */}
            {followUps.length < 5 ? (
              <form onSubmit={handleSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 3 AI Suggested Questions Pill Buttons */}
                {!askingFollowUp && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💡</span> {isEn ? 'AI Suggested Follow-up Questions (Click to ask immediately):' : 'AI gợi ý 3 câu hỏi tiếp theo (Bấm vào để hỏi ngay):'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {suggestedQuestions.map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={askingFollowUp}
                          onClick={() => handleSendFollowUp(null, qText)}
                          style={{
                            background: 'rgba(167,139,250,0.08)',
                            border: '1px solid rgba(167,139,250,0.25)',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: '0.825rem',
                            color: '#dfdbf0',
                            cursor: askingFollowUp ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(167,139,250,0.18)'; }}
                          onMouseLeave={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
                        >
                          <span style={{ fontSize: '0.9rem', color: '#a78bfa' }}>🔮</span>
                          <span style={{ flex: 1 }}>{qText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi thêm về trải bài này (tối đa 2048 ký tự)..."
                    disabled={askingFollowUp}
                    className="custom-textarea"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${charCount > 2048 ? 'rgba(235,94,85,0.6)' : 'rgba(229,193,88,0.2)'}`,
                      background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem',
                      resize: 'vertical', outline: 'none', color: '#dfdbf0',
                      boxSizing: 'border-box', minHeight: 'unset',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: 3, fontSize: '0.7rem' }}>
                    <span style={{ color: charCount > 2048 ? '#eb5e55' : 'rgba(229,193,88,0.5)', fontWeight: charCount > 2048 ? 700 : 400 }}>
                      {charCount > 2048 ? `⚠️ Đã vượt quá 2048 ký tự (${charCount})` : `${charCount} / 2048 ký tự`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={askingFollowUp || !userQuestion.trim() || !isCharCountValid}
                    className="copy-main-btn"
                    style={{
                      padding: '7px 18px', fontSize: '0.82rem', width: 'auto',
                      opacity: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 0.5 : 1,
                      cursor: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {askingFollowUp ? '⏳ Đang gửi...' : '💬 Gửi câu hỏi'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 14px', background: 'rgba(229,193,88,0.06)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(229,193,88,0.6)', border: '1px solid rgba(229,193,88,0.15)' }}>
                ℹ️ Bạn đã sử dụng tối đa 5 câu hỏi thêm cho lượt luận giải này.
              </div>
            )}
          </div>
        </div>
      )}



      {/* Styling spin anim */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
}
