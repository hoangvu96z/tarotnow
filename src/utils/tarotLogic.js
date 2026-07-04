/**
 * Helper logic for Tarot drawing with weights and orientations
 */

/**
 * Perform a weighted random draw of cards from the deck without duplicates.
 * 
 * @param {Array} deck Full deck of 78 cards from cards.json
 * @param {number} count Number of cards to draw
 * @param {Object} weights Group weights: { major, cups, pentacles, swords, wands }
 * @param {boolean} reversedEnabled Whether reversed orientation is enabled
 * @param {number} reversedRate Probability of a card being reversed (0 to 1)
 * @returns {Array} List of drawn card objects with orientation and position
 */
export function drawTarotCards(deck, count, weights, reversedEnabled, reversedRate = 0.5) {
  if (!deck || deck.length === 0) {
    throw new Error("Deck is empty or not loaded");
  }

  // Work with a mutable copy of the deck
  let availableDeck = [...deck];
  const results = [];
  
  // Total weights check
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    throw new Error("Tổng trọng số phải lớn hơn 0");
  }

  // Ensure count does not exceed available cards
  const drawCount = Math.min(count, availableDeck.length);

  for (let i = 0; i < drawCount; i++) {
    // 1. Group cards currently available in the deck by their category
    const groups = {
      major: availableDeck.filter(c => c.arcana === "Major"),
      cups: availableDeck.filter(c => c.suit === "Cups"),
      pentacles: availableDeck.filter(c => c.suit === "Pentacles"),
      swords: availableDeck.filter(c => c.suit === "Swords"),
      wands: availableDeck.filter(c => c.suit === "Wands")
    };

    // 2. Identify active groups that have cards left and have a weight > 0
    const activeGroups = [];
    let activeWeightsSum = 0;

    for (const [key, value] of Object.entries(weights)) {
      if (value > 0 && groups[key] && groups[key].length > 0) {
        activeGroups.push({ groupKey: key, weight: value, cards: groups[key] });
        activeWeightsSum += value;
      }
    }

    // If no active groups have cards, break (we ran out of cards in weight-active groups)
    if (activeGroups.length === 0) {
      break;
    }

    // 3. Select a group based on weight
    let randomWeightVal = Math.random() * activeWeightsSum;
    let chosenGroupObj = null;

    for (const groupObj of activeGroups) {
      randomWeightVal -= groupObj.weight;
      if (randomWeightVal <= 0) {
        chosenGroupObj = groupObj;
        break;
      }
    }

    // Fallback just in case
    if (!chosenGroupObj) {
      chosenGroupObj = activeGroups[activeGroups.length - 1];
    }

    // 4. Draw a random card from the chosen group
    const groupCards = chosenGroupObj.cards;
    const randomCardIndex = Math.floor(Math.random() * groupCards.length);
    const chosenCard = groupCards[randomCardIndex];

    // 5. Determine orientation
    let orientation = "upright";
    if (reversedEnabled) {
      orientation = Math.random() < reversedRate ? "reversed" : "upright";
    }

    // 6. Push to results and remove from available deck
    results.push({
      ...chosenCard,
      orientation,
      drawPosition: i + 1
    });

    availableDeck = availableDeck.filter(c => c.id !== chosenCard.id);
  }

  return results;
}

/**
 * Standard spread presets
 */
export const SPREADS = [
  { id: "single", name: "1 Lá (Rút nhanh)", count: 1, positions: ["Đại diện cho tình hình của bạn"] },
  
  // 3-card spreads
  { id: "ppf", name: "3 Lá (Quá khứ - Hiện tại - Tương lai)", count: 3, positions: ["Quá khứ (Past)", "Hiện tại (Present)", "Tương lai (Future)"] },
  { id: "soa", name: "3 Lá (Tình huống - Trở ngại - Lời khuyên)", count: 3, positions: ["Tình huống (Situation)", "Trở ngại (Obstacle)", "Lời khuyên (Advice)"] },
  { id: "mha", name: "3 Lá (Suy nghĩ - Cảm xúc - Hành động)", count: 3, positions: ["Suy nghĩ (Mind)", "Cảm xúc (Heart)", "Hành động (Action)"] },
  { id: "opt", name: "3 Lá (Lựa chọn A - Lựa chọn B - Gợi ý)", count: 3, positions: ["Lựa chọn A (Option A)", "Lựa chọn B (Option B)", "Gợi ý (Guidance)"] },
  { id: "hbp", name: "3 Lá (Hỗ trợ - Cản trở - Tiềm năng)", count: 3, positions: ["Điều hỗ trợ (What Helps)", "Điều cản trở (What Blocks)", "Tiềm năng (Potential)"] },
  
  // 5-card spreads
  { id: "five-cross", name: "5 Lá (Chữ thập - Nền/Hiện tại/Trở ngại/Lời khuyên/Kết quả)", count: 5, positions: ["Nền tảng/Quá khứ", "Hiện trạng", "Trở ngại/Thách thức", "Lời khuyên", "Kết quả tương lai"] },
  { id: "five-decision", name: "5 Lá (Nhánh lựa chọn - Hướng A/Hướng B/Cần biết/Tránh/Lời khuyên)", count: 5, positions: ["Lựa chọn A", "Lựa chọn B", "Yếu tố cần biết", "Yếu tố nên tránh", "Lời khuyên tổng hợp"] },
  { id: "five-relationship", name: "5 Lá (Tương quan - Bạn/Đối phương/Liên kết/Rào cản/Tương lai)", count: 5, positions: ["Bạn (Self)", "Đối phương (Partner)", "Liên kết chung (Dynamic)", "Rào cản/Thách thức", "Xu hướng tương lai"] },
  
  // Custom
  { id: "custom", name: "Tự chọn X Lá (Narrative spread)", count: 3, positions: [] }
];

/**
 * Interpretation Context Modes
 */
export const CONTEXTS = [
  { id: "general", name: "Tổng quan (General)" },
  { id: "love", name: "Tình cảm (Love)" },
  { id: "career", name: "Công việc (Career)" },
  { id: "money", name: "Tài chính (Money)" },
  { id: "family", name: "Gia đình (Family)" },
  { id: "feelings", name: "Cảm xúc (Feelings)" },
  { id: "action", name: "Hành động (Action)" }
];

/**
 * Get context-specific meaning of a card
 */
export function getCardMeaning(card, context = "general", orientation = "upright") {
  if (!card || !card.meanings) return "";
  
  const suffix = orientation === "reversed" ? "_reversed" : "_upright";
  const fieldKey = `${context}${suffix}`;
  
  // Fallback to general meanings if context-specific field is not defined
  if (card.meanings[fieldKey]) {
    return card.meanings[fieldKey];
  }
  
  const generalKey = `general${suffix}`;
  return card.meanings[generalKey] || "";
}

/**
 * Helper to explain meaning by position
 */
export function getPositionMeaning(card, spreadPosition, context = "general") {
  if (!card) return "";
  const baseMeaning = getCardMeaning(card, context, card.orientation);
  return `Ở vị trí [${spreadPosition}]: ${baseMeaning}`;
}

/**
 * Detect patterns across drawn cards (e.g. Major count, Suit count, Reversed count)
 */
export function analyzeSpreadPatterns(drawnCards, language = "vi") {
  if (!drawnCards || drawnCards.length === 0) return null;
  
  const total = drawnCards.length;
  
  const majorCount = drawnCards.filter(c => c.arcana === "Major").length;
  const reversedCount = drawnCards.filter(c => c.orientation === "reversed").length;
  
  // Dominant Suit
  const suitsCount = { Cups: 0, Pentacles: 0, Swords: 0, Wands: 0 };
  let dominantSuit = null;
  let maxSuitCount = 0;
  
  drawnCards.forEach(c => {
    if (c.suit && c.suit in suitsCount) {
      suitsCount[c.suit]++;
      if (suitsCount[c.suit] > maxSuitCount) {
        maxSuitCount = suitsCount[c.suit];
        dominantSuit = c.suit;
      }
    }
  });
  
  // Dominant suit must appear at least 2 times to be dominant in 3+ layouts
  if (maxSuitCount < 2) {
    dominantSuit = null;
  }
  
  // Court cards count (Pages, Knights, Queens, Kings)
  const courtRanks = ["Page", "Knight", "Queen", "King"];
  const courtCount = drawnCards.filter(c => courtRanks.includes(c.rank)).length;
  
  // Tone classification
  const tone = [];
  if (language === 'en') {
    if (suitsCount.Cups > 1) tone.push("Emotional (Cups)");
    if (suitsCount.Wands > 1) tone.push("Action-oriented (Wands)");
    if (suitsCount.Swords > 1) tone.push("Intellectual/Challenging (Swords)");
    if (suitsCount.Pentacles > 1) tone.push("Practical/Material (Pentacles)");
    if (majorCount > 1) tone.push("Karmic/Major life changes (Major Arcana)");
    if (reversedCount > total / 2) tone.push("Internal/Delays (Reversed cards)");
  } else {
    if (suitsCount.Cups > 1) tone.push("Cảm xúc (Emotional)");
    if (suitsCount.Wands > 1) tone.push("Động lực/Hành động (Action-oriented)");
    if (suitsCount.Swords > 1) tone.push("Áp lực trí óc/Thách thức (Intellectual/Challenging)");
    if (suitsCount.Pentacles > 1) tone.push("Thực tế/Vật chất (Practical/Material)");
    if (majorCount > 1) tone.push("Sự kiện bước ngoặt/Định mệnh (Karmic/Major life changes)");
    if (reversedCount > total / 2) tone.push("Sự chậm trễ/Năng lượng xoay vào trong (Internal/Delays)");
  }

  return {
    majorCount,
    reversedCount,
    dominantSuit,
    courtCount,
    tone
  };
}

/**
 * Generate a multi-dimensional, deep reading summary analysis object
 */
export function composeSpreadSummary(drawnCards, spreadPresetId, context = "general", language = "vi") {
  if (!drawnCards || drawnCards.length === 0) return null;
  
  const patterns = analyzeSpreadPatterns(drawnCards, language);
  const total = drawnCards.length;
  const majorCount = patterns.majorCount;
  const reversedCount = patterns.reversedCount;
  
  // Count suits
  const cupsCount = drawnCards.filter(c => c.suit === "Cups").length;
  const wandsCount = drawnCards.filter(c => c.suit === "Wands").length;
  const swordsCount = drawnCards.filter(c => c.suit === "Swords").length;
  const pentaclesCount = drawnCards.filter(c => c.suit === "Pentacles").length;

  const isEn = language === 'en';

  // 1. Overview
  let overview = "";
  if (isEn) {
    if (majorCount >= total / 2) {
      overview = `The spread carries a very high transformational energy (Major Arcana represents ${Math.round(majorCount/total*100)}%). Upcoming events are inevitable or karmic, deeply affecting your personal growth.`;
    } else {
      overview = `The spread focuses on practical actions, daily emotions, and specific tasks (predominantly Minor Arcana). Fluctuations are within your control if you are well-prepared.`;
    }
  } else {
    if (majorCount >= total / 2) {
      overview = `Trải bài mang năng lượng chuyển dịch rất lớn (chiếm ${Math.round(majorCount/total*100)}% Ẩn chính). Các sự kiện sắp tới mang tính chất tất yếu hoặc định mệnh, ảnh hưởng sâu sắc đến sự phát triển cá nhân của bạn.`;
    } else {
      overview = `Trải bài tập trung vào các hành động thực tế, cảm xúc thường ngày và công việc cụ thể (chủ yếu là Ẩn phụ). Các biến động nằm trong tầm kiểm soát của bạn nếu có sự chuẩn bị tốt.`;
    }
  }

  // 2. Arcana & Reversed Analysis
  let arcanaAnalysis = "";
  if (isEn) {
    if (majorCount > 0) {
      arcanaAnalysis = `There are ${majorCount} Major Arcana card(s). This emphasizes that your current situation contains an important spiritual lesson. The Universe is sending a long-term guidance message rather than a temporary fix.`;
    } else {
      arcanaAnalysis = "The spread consists entirely of Minor Arcana cards, showing that the current situation is highly influenced by behavioral habits, temporary emotions, or daily physical interactions. You have full capacity to turn things around using personal willpower.";
    }

    if (reversedCount > total / 2) {
      arcanaAnalysis += ` A high ratio of reversed cards (${Math.round(reversedCount/total*100)}%) warns that external energy flow is blocked, or you are having difficulty expressing the cards' energy externally. This is a phase to pause, reflect, and heal from within.`;
    } else {
      arcanaAnalysis += " The cards are mostly upright, indicating that the energy flow is moving smoothly; opportunities and challenges are clearly visible, making it easy for you to make decisions.";
    }
  } else {
    if (majorCount > 0) {
      arcanaAnalysis = `Có ${majorCount} lá Ẩn chính (Major Arcana). Điều này nhấn mạnh rằng tình huống hiện tại của bạn chứa đựng một bài học tinh thần quan trọng. Vũ trụ đang gửi thông điệp mang tính định hướng lâu dài chứ không chỉ là giải quyết sự vụ tạm thời.`;
    } else {
      arcanaAnalysis = "Trải bài toàn các lá Ẩn phụ (Minor Arcana), cho thấy tình huống hiện tại chịu ảnh hưởng lớn từ các thói quen hành vi, cảm xúc nhất thời hoặc các tương tác vật lý hàng ngày. Bạn hoàn toàn có khả năng xoay chuyển bằng ý chí cá nhân.";
    }

    if (reversedCount > total / 2) {
      arcanaAnalysis += ` Tỷ lệ lá ngược cao (${Math.round(reversedCount/total*100)}%) cảnh báo rằng dòng năng lượng bên ngoài đang bị tắc nghẽn, hoặc bạn đang gặp khó khăn trong việc biểu đạt năng lượng của các lá bài ra ngoài. Đây là giai đoạn cần dừng lại suy nghĩ, chữa lành từ bên trong.`;
    } else {
      arcanaAnalysis += " Các lá bài chủ yếu ở trạng thái xuôi cho thấy dòng năng lượng đang trôi chảy thuận lợi, mọi cơ hội và thử thách đều hiển lộ rõ ràng giúp bạn dễ dàng đưa ra quyết định.";
    }
  }

  // 3. Element/Suit Analysis
  let elementAnalysis = "";
  const elementsPresent = [];
  if (isEn) {
    if (cupsCount > 0) elementsPresent.push(`Water (Cups: ${cupsCount} card(s))`);
    if (wandsCount > 0) elementsPresent.push(`Fire (Wands: ${wandsCount} card(s))`);
    if (swordsCount > 0) elementsPresent.push(`Air (Swords: ${swordsCount} card(s))`);
    if (pentaclesCount > 0) elementsPresent.push(`Earth (Pentacles: ${pentaclesCount} card(s))`);
    
    elementAnalysis = `The spread contains a mixture of elements: ${elementsPresent.join(", ")}. `;

    if (cupsCount > 0 && wandsCount > 0) {
      elementAnalysis += "The combination of Water and Fire creates a powerful intersection between heart (emotion) and will (motivation). Be careful to avoid excessive emotional outbursts hindering practical action. ";
    }
    if (swordsCount > 0 && pentaclesCount > 0) {
      elementAnalysis += "The presence of both Air and Earth requires a balance between theory (logical thinking) and practice (material results). You need to plan specifically and implement step by step in a realistic manner. ";
    }
    if (swordsCount > 0 && cupsCount > 0) {
      elementAnalysis += "Air and Water elements together indicate a conflict between reason and emotion. You may be using your mind to analyze an emotional issue, or vice versa. Calm your mind to reduce judgment. ";
    }
    if (wandsCount > 0 && pentaclesCount > 0) {
      elementAnalysis += "The combination of Fire and Earth is ideal for creativity and financial growth. Fire inspires action, while Earth helps build a solid material foundation. ";
    }
  } else {
    if (cupsCount > 0) elementsPresent.push(`Nước (Cups: ${cupsCount} lá)`);
    if (wandsCount > 0) elementsPresent.push(`Lửa (Wands: ${wandsCount} lá)`);
    if (swordsCount > 0) elementsPresent.push(`Khí (Swords: ${swordsCount} lá)`);
    if (pentaclesCount > 0) elementsPresent.push(`Đất (Pentacles: ${pentaclesCount} lá)`);
    
    elementAnalysis = `Trải bài chứa sự pha trộn giữa các nguyên tố: ${elementsPresent.join(", ")}. `;

    if (cupsCount > 0 && wandsCount > 0) {
      elementAnalysis += "Sự kết hợp giữa Nước và Lửa tạo nên sự giao thoa mạnh mẽ giữa trái tim (cảm xúc) và ý chí (động lực). Hãy cẩn thận tránh để cảm xúc bộc phát quá mức cản trở hành động thực tế. ";
    }
    if (swordsCount > 0 && pentaclesCount > 0) {
      elementAnalysis += "Sự xuất hiện của cả Khí và Đất đòi hỏi sự cân bằng giữa lý thuyết (tư duy logic) và thực tiễn (kết quả vật chất). Bạn cần lập kế hoạch cụ thể và triển khai từng bước một cách thực tế. ";
    }
    if (swordsCount > 0 && cupsCount > 0) {
      elementAnalysis += "Nguyên tố Khí và Nước cùng hiện diện chỉ ra sự xung đột giữa lý trí và tình cảm. Bạn có thể đang dùng đầu óc để phân tích một vấn đề thuộc về cảm xúc, hoặc ngược lại. Hãy tĩnh tâm để đầu óc bớt phán xét. ";
    }
    if (wandsCount > 0 && pentaclesCount > 0) {
      elementAnalysis += "Sự kết hợp giữa Lửa và Đất rất lý tưởng cho sự sáng tạo và phát triển tài lộc. Lửa truyền cảm hứng hành động, trong khi Đất giúp xây dựng nền tảng vật chất vững bền. ";
    }
  }

  // 4. Flow Analysis (Positional Flow)
  let flowAnalysis = "";
  if (isEn) {
    if (spreadPresetId === "ppf" || spreadPresetId === "soa" || spreadPresetId === "mha" || spreadPresetId === "opt" || spreadPresetId === "hbp") {
      flowAnalysis = "The 3-card spread flow moves from position 1 to position 2 and converges at position 3. The center card represents your current core focus, while the last card indicates the best outcome or course of action.";
    } else if (spreadPresetId === "five-cross" || spreadPresetId === "five-decision" || spreadPresetId === "five-relationship") {
      flowAnalysis = "The 5-card spread distributes energy multi-dimensionally: the first two positions represent the background context, position 3 (center) is the knot to resolve, while positions 4 and 5 guide action and future outcomes.";
    } else {
      flowAnalysis = "In this custom spread, the cards interact in a narrative reading. There is no fixed timeline, but rather mutual reflection between different aspects of your question.";
    }
  } else {
    if (spreadPresetId === "ppf" || spreadPresetId === "soa" || spreadPresetId === "mha" || spreadPresetId === "opt" || spreadPresetId === "hbp") {
      flowAnalysis = `Dòng chảy trải bài 3 lá dịch chuyển từ vị trí 1 sang vị trí 2 và hội tụ tại vị trí 3. Lá ở giữa đại diện cho tiêu điểm cốt lõi hiện tại, trong khi lá cuối cùng chỉ ra kết quả hoặc giải pháp hành động tốt nhất.`;
    } else if (spreadPresetId === "five-cross" || spreadPresetId === "five-decision" || spreadPresetId === "five-relationship") {
      flowAnalysis = `Trải bài 5 lá phân bổ năng lượng đa chiều: hai vị trí đầu (vị trí 1 và 2) đại diện cho bối cảnh nền tảng, vị trí 3 (trung tâm) là nút thắt cần giải quyết, trong khi vị trí 4 và 5 dẫn lối hành động cùng kết quả tương lai.`;
    } else {
      flowAnalysis = "Trong trải bài tự chọn này, các lá bài tương tác theo kiểu liên kết chuỗi (narrative reading). Không có dòng chảy thời gian cố định, mà là sự phản chiếu lẫn nhau giữa các khía cạnh khác nhau trong câu hỏi của bạn.";
    }
  }

  // 5. Consolidated Actionable Advice
  let actionAdvice = "";
  if (isEn) {
    actionAdvice = "Focus on improving the energy of the upright cards to leverage the situation. ";
    if (reversedCount > 0) {
      actionAdvice += "For reversed cards, take time to ask yourself what aspects you are avoiding or are not ready to face. ";
    }
    
    if (swordsCount > cupsCount) {
      actionAdvice += "Prioritize logical thinking, clear planning, and cutting off toxic connections causing mental clutter.";
    } else if (cupsCount > swordsCount) {
      actionAdvice += "Listen to the voice of your intuition, respect your own emotions, and improve social relationships.";
    } else if (wandsCount > 0) {
      actionAdvice += "Proactively seize opportunities and act decisively. Hesitation at this point will cool down your enthusiasm.";
    } else if (pentaclesCount > 0) {
      actionAdvice += "Focus on accumulation, persistent work, and building long-term practical values.";
    }
  } else {
    actionAdvice = "Hãy tập trung cải thiện năng lượng của các lá bài xuôi để tạo đòn bẩy thúc đẩy tình huống. ";
    if (reversedCount > 0) {
      actionAdvice += "Với các lá bài ngược, hãy dành thời gian tự hỏi bản thân xem khía cạnh nào bạn đang trốn tránh hoặc chưa sẵn sàng đối mặt. ";
    }
    
    if (swordsCount > cupsCount) {
      actionAdvice += "Ưu tiên tư duy logic, lập kế hoạch rõ ràng và cắt đứt các kết nối độc hại gây nhiễu loạn tinh thần.";
    } else if (cupsCount > swordsCount) {
      actionAdvice += "Hãy lắng nghe tiếng nói của trực giác, tôn trọng cảm xúc bản thân và cải thiện các mối quan hệ xã hội.";
    } else if (wandsCount > 0) {
      actionAdvice += "Hãy chủ động nắm bắt cơ hội và hành động quyết liệt. Sự chần chừ lúc này sẽ làm nguội lạnh bầu nhiệt huyết.";
    } else if (pentaclesCount > 0) {
      actionAdvice += "Hãy tập trung vào tích lũy, làm việc kiên trì và xây dựng các giá trị thực tiễn lâu dài.";
    }
  }

  return {
    overview,
    arcanaAnalysis,
    elementAnalysis,
    flowAnalysis,
    actionAdvice
  };
}
