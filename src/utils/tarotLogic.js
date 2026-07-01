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
 * Generate short summary overview paragraph
 */
export function composeSpreadSummary(drawnCards, spreadPresetId, context = "general") {
  if (!drawnCards || drawnCards.length === 0) return "";
  
  const patterns = analyzeSpreadPatterns(drawnCards);
  const total = drawnCards.length;
  const majorPct = Math.round((patterns.majorCount / total) * 100);
  const revPct = Math.round((patterns.reversedCount / total) * 100);
  
  let summary = "";
  
  // 1. Arcana/Reversed Overview
  if (patterns.majorCount > 1) {
    summary += `Trải bài có sự hiện diện lớn của các lá Ẩn chính (Major Arcana chiếm ${majorPct}%), báo hiệu đây là một giai đoạn mang tính bước ngoặt cuộc đời, mang năng lượng của số phận hoặc có các bài học lớn về tinh thần mà bạn cần phải trải qua. `;
  } else {
    summary += `Trải bài này tập trung nhiều vào các chi tiết, sự kiện và biến động thường nhật trong cuộc sống (do chiếm đa số là các lá Ẩn phụ - Minor Arcana). `;
  }
  
  if (patterns.reversedCount > total / 2) {
    summary += `Với tỷ lệ lá ngược cao (${revPct}%), năng lượng tổng thể cho thấy có sự ách tắc, trì hoãn hoặc các bài học nội tâm sâu sắc. Đây là lúc vũ trụ khuyên bạn nên dừng lại chiêm nghiệm, xoay nhận thức vào bên trong thay vì cố thúc ép hành động ra bên ngoài. `;
  } else {
    summary += `Các lá bài hầu hết ở trạng thái xuôi chỉ ra dòng năng lượng đang được giải phóng tự nhiên, các sự kiện và bài học đang hiển lộ rõ ràng trước mắt để bạn dễ dàng nắm bắt. `;
  }
  
  // 2. Dominant Suit
  if (patterns.dominantSuit) {
    const suitVi = {
      Cups: "bộ Cốc (Cups - đại diện cho cảm xúc, tình cảm và mối quan hệ trực giác)",
      Pentacles: "bộ Tiền (Pentacles - đại diện cho công việc, vật chất, tiền bạc và sự ổn định thực tế)",
      Swords: "bộ Kiếm (Swords - đại diện cho tâm trí, quyết định, thách thức và xung đột tư duy)",
      Wands: "bộ Gậy (Wands - đại diện cho nhiệt huyết, đam mê, hành động và sáng tạo)"
    };
    summary += `Đặc biệt, sự chiếm ưu thế của ${suitVi[patterns.dominantSuit]} khẳng định rằng chủ đề chính của câu hỏi đang phụ thuộc nặng nề vào yếu tố này. `;
  }
  
  if (patterns.courtCount > 1) {
    summary += `Sự xuất hiện của nhiều lá hoàng gia (Court Cards) cho thấy các yếu tố liên quan tới con người, sức ảnh hưởng xã hội hoặc các tính cách/vai trò ứng xử đang tham gia mật thiết vào tình huống hiện tại của bạn. `;
  }
  
  // 3. Consolidated Advice
  summary += `\n\nLời khuyên chung từ vũ trụ dành cho bạn là hãy nhìn nhận vấn đề một cách khách quan, tích hợp các thông điệp từ vị trí trải bài. Hãy chuẩn bị tinh thần và trí óc sẵn sàng vì thông điệp này sẽ mở ra các hướng định hình giúp bạn tương tác tốt nhất với hành trình sắp tới.`;

  return summary;
}
