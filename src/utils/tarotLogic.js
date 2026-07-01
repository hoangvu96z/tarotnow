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
export function analyzeSpreadPatterns(drawnCards) {
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
  if (suitsCount.Cups > 1) tone.push("Cảm xúc (Emotional)");
  if (suitsCount.Wands > 1) tone.push("Động lực/Hành động (Action-oriented)");
  if (suitsCount.Swords > 1) tone.push("Áp lực trí óc/Thách thức (Intellectual/Challenging)");
  if (suitsCount.Pentacles > 1) tone.push("Thực tế/Vật chất (Practical/Material)");
  if (majorCount > 1) tone.push("Sự kiện bước ngoặt/Định mệnh (Karmic/Major life changes)");
  if (reversedCount > total / 2) tone.push("Sự chậm trễ/Năng lượng xoay vào trong (Internal/Delays)");

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
export function composeSpreadSummary(drawnCards, spreadPresetId, context = "general") {
  if (!drawnCards || drawnCards.length === 0) return null;
  
  const patterns = analyzeSpreadPatterns(drawnCards);
  const total = drawnCards.length;
  const majorCount = patterns.majorCount;
  const reversedCount = patterns.reversedCount;
  
  // Count suits
  const cupsCount = drawnCards.filter(c => c.suit === "Cups").length;
  const wandsCount = drawnCards.filter(c => c.suit === "Wands").length;
  const swordsCount = drawnCards.filter(c => c.suit === "Swords").length;
  const pentaclesCount = drawnCards.filter(c => c.suit === "Pentacles").length;

  // 1. Overview
  let overview = "";
  if (majorCount >= total / 2) {
    overview = `Trải bài mang năng lượng chuyển dịch rất lớn (chiếm ${Math.round(majorCount/total*100)}% Ẩn chính). Các sự kiện sắp tới mang tính chất tất yếu hoặc định mệnh, ảnh hưởng sâu sắc đến sự phát triển cá nhân của bạn.`;
  } else {
    overview = `Trải bài tập trung vào các hành động thực tế, cảm xúc thường ngày và công việc cụ thể (chủ yếu là Ẩn phụ). Các biến động nằm trong tầm kiểm soát của bạn nếu có sự chuẩn bị tốt.`;
  }

  // 2. Arcana & Reversed Analysis
  let arcanaAnalysis = "";
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

  // 3. Element/Suit Analysis
  let elementAnalysis = "";
  const elementsPresent = [];
  if (cupsCount > 0) elementsPresent.push(`Nước (Cups: ${cupsCount} lá)`);
  if (wandsCount > 0) elementsPresent.push(`Lửa (Wands: ${wandsCount} lá)`);
  if (swordsCount > 0) elementsPresent.push(`Khí (Swords: ${swordsCount} lá)`);
  if (pentaclesCount > 0) elementsPresent.push(`Đất (Pentacles: ${pentaclesCount} lá)`);
  
  elementAnalysis = `Trải bài chứa sự pha trộn giữa các nguyên tố: ${elementsPresent.join(", ")}. `;

  // Element combination logic
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

  // 4. Flow Analysis (Positional Flow)
  let flowAnalysis = "";
  if (spreadPresetId === "ppf" || spreadPresetId === "soa" || spreadPresetId === "mha" || spreadPresetId === "opt" || spreadPresetId === "hbp") {
    flowAnalysis = `Dòng chảy trải bài 3 lá dịch chuyển từ vị trí 1 sang vị trí 2 và hội tụ tại vị trí 3. Lá ở giữa đại diện cho tiêu điểm cốt lõi hiện tại, trong khi lá cuối cùng chỉ ra kết quả hoặc giải pháp hành động tốt nhất.`;
  } else if (spreadPresetId === "five-cross" || spreadPresetId === "five-decision" || spreadPresetId === "five-relationship") {
    flowAnalysis = `Trải bài 5 lá phân bổ năng lượng đa chiều: hai vị trí đầu (vị trí 1 và 2) đại diện cho bối cảnh nền tảng, vị trí 3 (trung tâm) là nút thắt cần giải quyết, trong khi vị trí 4 và 5 dẫn lối hành động cùng kết quả tương lai.`;
  } else {
    flowAnalysis = "Trong trải bài tự chọn này, các lá bài tương tác theo kiểu liên kết chuỗi (narrative reading). Không có dòng chảy thời gian cố định, mà là sự phản chiếu lẫn nhau giữa các khía cạnh khác nhau trong câu hỏi của bạn.";
  }

  // 5. Consolidated Actionable Advice
  let actionAdvice = "Hãy tập trung cải thiện năng lượng của các lá bài xuôi để tạo đòn bẩy thúc đẩy tình huống. ";
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

  return {
    overview,
    arcanaAnalysis,
    elementAnalysis,
    flowAnalysis,
    actionAdvice
  };
}
