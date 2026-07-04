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

export function createSeededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return function () {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Assign orientation helper
 */
export function assignOrientation(cards, reversedEnabled, reversedRate, seed) {
  const rng = createSeededRandom(seed + 1);
  return cards.map(card => {
    if (!reversedEnabled) {
      return { ...card, orientation: "upright" };
    }
    const isReversed = rng() < reversedRate;
    return { ...card, orientation: isReversed ? "reversed" : "upright" };
  });
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

export const PERSPECTIVES = [
  { key: "general", id: "general", name: "Tổng quan (General)" },
  { key: "love", id: "love", name: "Tình cảm (Love)" },
  { key: "career", id: "career", name: "Công việc (Career)" },
  { key: "money", id: "money", name: "Tài chính (Money)" },
  { key: "family", id: "family", name: "Gia đình (Family)" },
  { key: "feelings", id: "feelings", name: "Cảm xúc (Feelings)" },
  { key: "action", id: "action", name: "Hành động (Action)" }
];

/**
 * Static Role Assigner
 */
export function getCardRole(card, orientation) {
  const isUpright = orientation === "upright";
  
  if (card.arcana === "Major") {
    const positiveMajorNumbers = [19, 17, 21, 7, 8, 10, 11, 1, 14, 3, 4, 5, 6];
    if (positiveMajorNumbers.includes(card.number)) {
      return isUpright ? "support" : "neutral";
    }
    const challengingMajorNumbers = [16, 13, 15, 18, 12, 20];
    if (challengingMajorNumbers.includes(card.number)) {
      return "block";
    }
  } else if (card.arcana === "Minor") {
    const isCourt = ["Page", "Knight", "Queen", "King"].includes(card.rank);
    if (!isCourt) {
      if (card.suit === "Wands" || card.suit === "Cups") {
        return isUpright ? "support" : "neutral";
      }
      if (card.suit === "Swords" && ["Three", "Five", "Seven", "Nine", "Ten"].includes(card.rank)) {
        return "block";
      }
      if (card.suit === "Pentacles" && card.rank === "Five") {
        return "block";
      }
    }
  }
  return "neutral";
}

/**
 * Get context-specific meaning of a card
 */
export function getMeaningField(card, perspective, orientation) {
  const map = {
    love: card.meanings?.love_upright ? card.meanings : null,
    career: card.meanings?.career_upright ? card.meanings : null,
    money: card.meanings?.money_upright ? card.meanings : null,
    family: card.meanings?.family_upright ? card.meanings : null,
    feelings: card.meanings?.feelings_upright ? card.meanings : null,
    action: card.meanings?.action_upright ? card.meanings : null
  };
  const meaningObj = map[perspective];
  if (meaningObj) {
    const key = `${perspective}_${orientation}`;
    return meaningObj[key] || meaningObj[`${perspective}_upright`] || "";
  }
  const fallbackKey = `general_${orientation}`;
  return card.meanings?.[fallbackKey] || card.meanings?.general_upright || "";
}

export function getCardMeaning(card, context = "general", orientation = "upright") {
  return getMeaningField(card, context, orientation);
}

/**
 * Capitalize first letter of string
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pattern metrics computation
 */
export function computePatternMetrics(cards) {
  const total = cards.length;
  const majorCount = cards.filter(c => c.arcana === "Major").length;
  const reversedCount = cards.filter(c => c.orientation === "reversed").length;
  const suits = { Cups: 0, Pentacles: 0, Swords: 0, Wands: 0 };
  let supportCount = 0;
  let blockCount = 0;

  cards.forEach(c => {
    if (c.suit && c.suit in suits) suits[c.suit]++;
    const role = getCardRole(c, c.orientation);
    if (role === "support") supportCount++;
    if (role === "block") blockCount++;
  });

  const dominantSuit = Object.keys(suits).reduce((a, b) => suits[a] > suits[b] ? a : b);
  const courtCount = cards.filter(c => ["Page", "Knight", "Queen", "King"].includes(c.rank)).length;

  return {
    total,
    majorRatio: majorCount / total,
    reversedRatio: reversedCount / total,
    dominantSuit,
    dominantSuitRatio: suits[dominantSuit] / total,
    supportCount,
    blockCount,
    courtRatio: courtCount / total
  };
}

/**
 * Position Mapper Table
 */
export const POSITION_TABLE = {
  one_card: {
    general: {
      vi: "Điều bạn cần biết ngay lúc này",
      en: "What you need to know right now"
    },
    love: {
      vi: "Điều đang thật sự diễn ra trong lòng bạn hoặc giữa hai người",
      en: "What is truly happening in your heart or between you two"
    },
    career: {
      vi: "Điều đang chi phối công việc của bạn lúc này",
      en: "What is governing your work right now"
    },
    money: {
      vi: "Điều bạn cần lưu tâm về tài chính lúc này",
      en: "What you need to keep in mind about finance right now"
    },
    family: {
      vi: "Điều đang tác động đến không khí gia đình lúc này",
      en: "What is impacting the family atmosphere right now"
    },
    feelings: {
      vi: "Cảm xúc thật bạn đang mang mà chưa gọi tên",
      en: "True feelings you carry but haven't named"
    },
    action: {
      vi: "Việc cụ thể bạn nên làm ngay",
      en: "Specific action you should take right now"
    }
  },
  three_card: {
    general: {
      vi: ["Điều đang nâng đỡ bạn", "Điều đang làm bạn kẹt", "Hướng có thể mở ra"],
      en: ["What is supporting you", "What is keeping you stuck", "Paths that can open up"]
    },
    love: {
      vi: ["Điều bạn đang cảm nhận thật", "Điều đang cản trở kết nối", "Điều nên làm tiếp theo"],
      en: ["What you are truly feeling", "What is hindering connection", "What you should do next"]
    },
    career: {
      vi: ["Điểm mạnh bạn đang có", "Trở ngại trong công việc", "Bước tiến khả thi"],
      en: ["Your current strengths", "Obstacles in your career", "Possible next step"]
    },
    money: {
      vi: ["Nguồn lực bạn đang có", "Rủi ro đang tồn tại", "Hướng xử lý hợp lý"],
      en: ["Resources you have", "Existing risks", "Reasonable path to handle"]
    },
    family: {
      vi: ["Điều đang giữ gia đình ổn định", "Căng thẳng đang âm ỉ", "Cách hoà giải khả thi"],
      en: ["What keeps family stable", "Simmering tension", "Possible reconciliation path"]
    },
    feelings: {
      vi: ["Cảm xúc bề mặt bạn nhận ra", "Cảm xúc sâu bạn đang né", "Điều cảm xúc này đang cần"],
      en: ["Surface feelings you recognize", "Deep feelings you avoid", "What this feeling needs"]
    },
    action: {
      vi: ["Việc nên bắt đầu trước", "Việc nên tạm dừng", "Việc nên chuẩn bị tiếp theo"],
      en: ["What to start first", "What to temporarily pause", "What to prepare next"]
    }
  },
  five_card: {
    general: {
      vi: ["Gốc rễ của chuyện này", "Điều đang diễn ra ngay lúc này", "Điểm mù hoặc nút thắt chính", "Điều nên ưu tiên lúc này", "Kết quả nếu giữ nguyên nhịp hiện tại"],
      en: ["Root of the matter", "What is happening right now", "Blind spot or core knot", "What to prioritize right now", "Outcome if current rhythm is kept"]
    },
    love: {
      vi: ["Gốc rễ của cảm xúc hoặc mối quan hệ", "Trạng thái hiện tại giữa hai người", "Điều chưa ai nói ra", "Điều nên ưu tiên trong cách cư xử", "Chiều hướng mối quan hệ sẽ đi"],
      en: ["Root of the emotions or relationship", "Current state between the two of you", "What has gone unsaid", "What to prioritize in behavior", "Trend the relationship will take"]
    },
    career: {
      vi: ["Nguyên nhân sâu của tình trạng công việc", "Diễn biến công việc hiện tại", "Rào cản chưa được nhìn thẳng", "Kỹ năng hoặc quyết định cần ưu tiên", "Kết quả nếu giữ cách làm hiện tại"],
      en: ["Deep cause of the work situation", "Current work developments", "Obstacles not faced directly", "Skill or decision to prioritize", "Outcome if current method is kept"]
    },
    money: {
      vi: ["Gốc của vấn đề tài chính", "Tình trạng tài chính hiện tại", "Rủi ro bị bỏ qua", "Hành động tài chính cần ưu tiên", "Kết quả nếu không thay đổi"],
      en: ["Root of the financial issue", "Current financial status", "Risks being overlooked", "Financial action to prioritize", "Outcome if unchanged"]
    },
    family: {
      vi: ["Gốc rễ của tình huống gia đình", "Không khí gia đình hiện tại", "Hiểu lầm chưa được gỡ", "Điều cần ưu tiên để hoà giải", "Chiều hướng gia đình sẽ đi"],
      en: ["Root of the family situation", "Current family atmosphere", "Unresolved misunderstandings", "What to prioritize to reconcile", "Trend the family will take"]
    },
    feelings: {
      vi: ["Gốc của cảm xúc đang mang", "Cảm xúc đang chi phối hiện tại", "Phần cảm xúc bị né tránh", "Điều cảm xúc cần được đáp ứng", "Trạng thái cảm xúc sẽ tới nếu không xử lý"],
      en: ["Root of the current emotion", "Emotion dominating right now", "Part of emotion being avoided", "What the emotion needs to be met", "Future emotional state if unaddressed"]
    },
    action: {
      vi: ["Lý do cần hành động", "Hành động đang được thực hiện hoặc trì hoãn", "Rào cản khiến chưa hành động", "Hành động cần ưu tiên ngay", "Kết quả nếu hành động đúng lúc"],
      en: ["Reason action is needed", "Action being taken or delayed", "Barrier preventing action", "Action to prioritize immediately", "Outcome if acted timely"]
    }
  },
  ten_card: {
    general: {
      vi: [
        "Tình huống hiện tại",
        "Thử thách trực tiếp đang đối mặt",
        "Nền tảng hoặc nguyên nhân từ trước",
        "Hướng đang tiến tới trong ngắn hạn",
        "Điều đang ảnh hưởng từ bên trên, ngoài tầm kiểm soát trực tiếp",
        "Điều đang âm thầm tác động từ bên trong",
        "Cách bạn nhìn nhận bản thân trong chuyện này",
        "Cách người khác hoặc hoàn cảnh nhìn nhận bạn",
        "Điều bạn đang hy vọng hoặc lo sợ",
        "Kết quả nếu giữ nguyên nhịp hiện tại"
      ],
      en: [
        "Current situation",
        "Direct challenge being faced",
        "Foundation or past cause",
        "Short-term direction ahead",
        "External influence beyond control",
        "Silent influence from within",
        "How you perceive yourself here",
        "How others or circumstances perceive you",
        "What you hope for or fear",
        "Outcome if current rhythm is kept"
      ]
    }
  }
};

function getPositionRoles(spreadType, perspective, language = "vi") {
  const isEn = language === "en";
  let spreadKey = "three_card";
  if (spreadType === "single") spreadKey = "one_card";
  else if (["five-cross", "five-decision", "five-relationship"].includes(spreadType)) spreadKey = "five-card";
  else if (spreadType === "ten_card") spreadKey = "ten_card";
  
  const mapKey = spreadKey.replace("-", "_");
  const spreadMap = POSITION_TABLE[mapKey] || POSITION_TABLE.three_card;
  const pMap = spreadMap[perspective] || spreadMap.general;
  return pMap[language] || pMap.vi;
}

/**
 * Impact Voice Phrases Table
 */
export const IMPACT_VOICE = {
  general: {
    upright: {
      vi: "Đây là điều bạn có thể dùng ngay để nhìn tình huống rõ hơn.",
      en: "This is something you can use immediately to see the situation more clearly."
    },
    reversed: {
      vi: "Đây là điều đang bị bỏ qua và khiến tình huống rối hơn cần thiết.",
      en: "This is something being overlooked, making the situation more complicated than necessary."
    }
  },
  love: {
    upright: {
      vi: "Điều này đang định hình cách hai người hiểu nhau lúc này.",
      en: "This is currently shaping the way you two understand each other."
    },
    reversed: {
      vi: "Điều này đang bị hiểu lệch và cần được làm rõ sớm.",
      en: "This is being misunderstood and needs to be clarified soon."
    }
  },
  career: {
    upright: {
      vi: "Điều này ảnh hưởng trực tiếp đến nhịp làm việc của bạn.",
      en: "This directly affects your working rhythm."
    },
    reversed: {
      vi: "Điều này đang cản bạn phát huy đúng năng lực.",
      en: "This is preventing you from demonstrating your true capacity."
    }
  },
  money: {
    upright: {
      vi: "Điều này liên quan trực tiếp đến quyết định tài chính sắp tới.",
      en: "This is directly related to your upcoming financial decisions."
    },
    reversed: {
      vi: "Điều này là điểm rủi ro tài chính cần chú ý ngay.",
      en: "This is a financial risk point that needs immediate attention."
    }
  },
  family: {
    upright: {
      vi: "Điều này ảnh hưởng đến không khí chung trong nhà.",
      en: "This affects the general atmosphere in the house."
    },
    reversed: {
      vi: "Điều này là nguồn căng thẳng chưa được giải quyết.",
      en: "This is a source of unresolved tension."
    }
  },
  feelings: {
    upright: {
      vi: "Đây là phần cảm xúc bạn nên thừa nhận với chính mình.",
      en: "This is the part of your emotions you should admit to yourself."
    },
    reversed: {
      vi: "Đây là phần cảm xúc bạn đang né tránh gọi tên.",
      en: "This is the emotion you are avoiding calling by name."
    }
  },
  action: {
    upright: {
      vi: "Đây là hành động nên được ưu tiên.",
      en: "This is the action that should be prioritized."
    },
    reversed: {
      vi: "Đây là hành động đang bị trì hoãn một cách vô ích.",
      en: "This is an action that is being pointlessly delayed."
    }
  }
};

function getImpactSentence(perspective, orientation, language = "vi") {
  const pMap = IMPACT_VOICE[perspective] || IMPACT_VOICE.general;
  const oMap = pMap[orientation] || pMap.upright;
  return oMap[language] || oMap.vi;
}

/**
 * Tension text database
 */
export const TENSION_TEXTS = {
  TENSION_HIDDEN_BLOCK: {
    general: {
      vi: "Vấn đề không thiếu cơ hội, mà đang bị trì lại vì điều gì đó chưa được nhìn thẳng.",
      en: "The issue is not a lack of opportunities, but rather being held back because something isn't being faced directly."
    },
    love: {
      vi: "Cảm xúc giữa hai người không thiếu, chỉ đang bị che bởi điều chưa ai chịu nói ra.",
      en: "There is no lack of feelings between you two, they are just obscured by things that no one has spoken aloud."
    },
    career: {
      vi: "Công việc không thiếu tiềm năng, chỉ đang bị chặn bởi một điều bạn chưa muốn đối diện.",
      en: "Your work does not lack potential, it is just blocked by something you haven't wanted to face."
    },
    money: {
      vi: "Tài chính không thiếu cách gỡ, chỉ đang bị trì trệ vì có khoản chi tiêu chưa được kiểm soát thực tế.",
      en: "Finance is not without a way out, it is just stagnant because expenses haven't been practically controlled."
    },
    family: {
      vi: "Gia đình không thiếu sự gắn kết, chỉ là mâu thuẫn đang âm ỉ vì chưa ai chịu mở lời trước.",
      en: "The family does not lack connection, it's just that conflict is simmering because no one has spoken first."
    },
    feelings: {
      vi: "Nội tâm bạn đang có xung đột lớn, mệt mỏi tích tụ vì bạn chưa chịu thừa nhận cảm xúc thật.",
      en: "You have a major internal conflict; fatigue has built up because you haven't admitted your true feelings."
    },
    action: {
      vi: "Nỗ lực hành động đang bị cản trở bởi sự trì hoãn hoặc e ngại thay đổi của bản thân.",
      en: "Your efforts to act are being hindered by your own procrastination or fear of change."
    }
  },
  TENSION_OVERTHINKING: {
    general: {
      vi: "Bạn đang nghĩ nhiều hơn cảm, khiến mọi thứ căng trong đầu hơn ngoài thực tế.",
      en: "You are thinking more than feeling, making things more tense in your head than in reality."
    },
    love: {
      vi: "Bạn đang phân tích cảm xúc quá nhiều thay vì cảm nhận thật.",
      en: "You are analyzing emotions too much instead of truly feeling them."
    },
    career: {
      vi: "Bạn đang lăn tăn quá nhiều với những việc chưa chắc đã xảy ra.",
      en: "You are worrying too much about things that might not even happen."
    },
    money: {
      vi: "Sự lo lắng thái quá về tiền bạc đang cản trở bạn đưa ra các quyết định tài chính hợp lý.",
      en: "Excessive worry about money is preventing you from making rational financial decisions."
    },
    family: {
      vi: "Những suy diễn và phán xét trong đầu đang làm khoảng cách giữa các thành viên xa hơn.",
      en: "Speculations and judgments in your mind are widening the distance between family members."
    },
    feelings: {
      vi: "Đầu óc bạn đang quá tải vì cố phân tích và dán nhãn cho mọi cảm xúc hiện tại.",
      en: "Your mind is overloaded trying to analyze and label every current emotion."
    },
    action: {
      vi: "Sự do dự và phân tích quá nhiều phương án đang khiến bạn dậm chân tại chỗ.",
      en: "Hesitation and over-analyzing too many options are keeping you stationary."
    }
  },
  TENSION_STABILITY_FOCUS: {
    general: {
      vi: "Câu chuyện đang xoay quanh việc giữ ổn định hơn là tìm điều mới.",
      en: "The story revolves around maintaining stability rather than seeking something new."
    },
    love: {
      vi: "Mối quan hệ đang cần một nền tảng chắc hơn là cảm xúc bùng nổ.",
      en: "The relationship needs a solid foundation rather than explosive emotions."
    },
    career: {
      vi: "Công việc đang cần bạn giữ nhịp ổn định hơn là bứt phá vội.",
      en: "Your work needs you to maintain a steady rhythm rather than rushing to break through."
    },
    money: {
      vi: "Tiết kiệm và bảo vệ nguồn lực đang là ưu tiên hàng đầu của bạn lúc này.",
      en: "Saving and protecting resources is your top priority right now."
    },
    family: {
      vi: "Gia đình cần sự ổn định thực tế và trách nhiệm hơn là những lời nói suông.",
      en: "The family needs practical stability and responsibility rather than empty words."
    },
    feelings: {
      vi: "Nội tâm bạn đang tìm kiếm cảm giác an toàn và được che chở hơn là những thử thách.",
      en: "Your inner self is seeking a sense of safety and shelter rather than challenges."
    },
    action: {
      vi: "Hành động cần sự kiên trì, từng bước vững chắc thay vì nhảy vọt mạo hiểm.",
      en: "Actions require persistence, solid steps rather than risky leaps."
    }
  },
  TENSION_EMOTION_FOCUS: {
    general: {
      vi: "Cảm xúc đang là yếu tố chi phối chính trong tình huống này.",
      en: "Emotion is the main dominating factor in this situation."
    },
    love: {
      vi: "Cảm xúc thật đang lớn hơn những gì bạn thể hiện ra ngoài.",
      en: "True feelings are much stronger than what you are showing outwardly."
    },
    career: {
      vi: "Cảm xúc cá nhân đang ảnh hưởng nhiều đến cách bạn nhìn công việc.",
      en: "Personal emotions are heavily affecting the way you view your work."
    },
    money: {
      vi: "Việc chi tiêu đang bị dẫn dắt bởi cảm xúc nhất thời nhiều hơn là lý trí.",
      en: "Spending is driven by temporary emotions rather than reason."
    },
    family: {
      vi: "Sự nhạy cảm và tình thương yêu sâu sắc đang cần được thể hiện đúng cách.",
      en: "Sensitivity and deep love need to be expressed in the right way."
    },
    feelings: {
      vi: "Lòng bạn đang dâng trào nhiều cảm xúc phức tạp, cần được xoa dịu.",
      en: "Your heart is overflowing with complex emotions that need to be soothed."
    },
    action: {
      vi: "Mọi quyết định hành động nên xuất phát từ sự thấu hiểu và đồng cảm chân thành.",
      en: "Every action decision should stem from understanding and sincere empathy."
    }
  },
  TENSION_ACTION_ENERGY: {
    general: {
      vi: "Năng lượng hành động đang rất mạnh, chỉ cần một hướng rõ để dùng đúng chỗ.",
      en: "The energy of action is very strong; you just need a clear direction to apply it."
    },
    love: {
      vi: "Cảm xúc đang thúc bạn hành động nhanh, cần chọn đúng thời điểm.",
      en: "Feelings are pushing you to act quickly; you need to choose the right moment."
    },
    career: {
      vi: "Bạn đang có động lực lớn, chỉ cần chọn đúng việc để dồn sức vào.",
      en: "You have great motivation; you just need to choose the right task to focus on."
    },
    money: {
      vi: "Cơ hội gia tăng thu nhập đang mở ra, cần hành động quyết đoán để nắm giữ.",
      en: "Opportunities to increase income are opening up; decisive action is needed to seize them."
    },
    family: {
      vi: "Gia đình cần những bước chuyển dịch hoặc thay đổi không gian sống tích cực.",
      en: "The family needs dynamic shifts or positive changes in living space."
    },
    feelings: {
      vi: "Bạn đang tràn trề nhiệt huyết và sẵn sàng bùng nổ, hãy điều hướng nó hợp lý.",
      en: "You are full of enthusiasm and ready to burst; direct it reasonably."
    },
    action: {
      vi: "Hãy hành động ngay lập tức, sự chần chừ sẽ làm mất đi thời cơ vàng.",
      en: "Take action immediately; hesitation will lose the golden window."
    }
  },
  TENSION_MIXED_SIGNAL: {
    general: {
      vi: "Bạn có khả năng đi tiếp, nhưng đang bị kẹt ở cách phản ứng hoặc niềm tin hiện tại.",
      en: "You have the ability to move forward, but you are stuck in your current reaction or belief."
    },
    love: {
      vi: "Cả hai đều có điểm tốt, nhưng cách phản ứng hiện tại đang cản sự kết nối.",
      en: "Both of you have good points, but your current reactions are blocking the connection."
    },
    career: {
      vi: "Bạn đủ năng lực, nhưng cách phản ứng với áp lực đang cản bạn tiến.",
      en: "You are competent enough, but your way of reacting to pressure is hindering your progress."
    },
    money: {
      vi: "Nguồn tài chính có triển vọng nhưng thói quen cũ đang cản trở sự tích lũy.",
      en: "Financial resources look promising, but old habits are hindering accumulation."
    },
    family: {
      vi: "Mọi người đều muốn hòa hợp, nhưng những định kiến cũ đang tạo khoảng cách.",
      en: "Everyone wants harmony, but old prejudices are creating distance."
    },
    feelings: {
      vi: "Cảm xúc của bạn đang mâu thuẫn giữa mong muốn tự do và nhu cầu an toàn.",
      en: "Your emotions are conflicted between the desire for freedom and the need for safety."
    },
    action: {
      vi: "Bạn muốn tiến hành nhưng nỗi sợ thất bại đang giữ chân bạn lại.",
      en: "You want to proceed, but the fear of failure is holding you back."
    }
  },
  TENSION_BIG_LESSON: {
    general: {
      vi: "Tình huống này chứa một bài học lớn hơn vẻ ngoài của nó.",
      en: "This situation contains a lesson larger than it appears outwardly."
    },
    love: {
      vi: "Đây là giai đoạn học một bài học quan trọng về cách yêu và được yêu.",
      en: "This is a stage to learn an important lesson about how to love and be loved."
    },
    career: {
      vi: "Đây là giai đoạn định hình lại cách bạn nhìn về sự nghiệp.",
      en: "This is a phase to reshape how you view your career."
    },
    money: {
      vi: "Bài học về cách trân trọng giá trị và quản lý tài sản lâu dài đang hiển lộ.",
      en: "The lesson of appreciating value and managing long-term assets is manifesting."
    },
    family: {
      vi: "Sự kiện này là cơ hội để chữa lành những tổn thương thế hệ trong gia đình.",
      en: "This event is an opportunity to heal generational wounds within the family."
    },
    feelings: {
      vi: "Trải nghiệm này thúc đẩy bạn trưởng thành vượt bậc về nhận thức tâm hồn.",
      en: "This experience drives you to grow mature in spiritual awareness."
    },
    action: {
      vi: "Hãy hành động như một phiên bản trưởng thành và tự chịu trách nhiệm tối đa.",
      en: "Act as a mature version of yourself and take maximum responsibility."
    }
  },
  TENSION_EXTERNAL_INFLUENCE: {
    general: {
      vi: "Người khác hoặc hoàn cảnh bên ngoài đang ảnh hưởng nhiều đến quyết định của bạn.",
      en: "Others or external circumstances are heavily influencing your decisions."
    },
    love: {
      vi: "Ý kiến hoặc phản ứng của người khác đang ảnh hưởng đến cách bạn nhìn mối quan hệ.",
      en: "Others' opinions or reactions are affecting how you view the relationship."
    },
    career: {
      vi: "Người xung quanh hoặc môi trường làm việc đang ảnh hưởng nhiều đến bạn.",
      en: "People around you or the working environment are heavily affecting you."
    },
    money: {
      vi: "Biến động thị trường hoặc lời khuyên của người khác đang làm bạn phân tâm.",
      en: "Market fluctuations or advice from others is distracting you."
    },
    family: {
      vi: "Áp lực từ họ hàng hoặc dư luận xã hội đang đè nặng lên gia đình bạn.",
      en: "Pressure from relatives or public opinion is weighing on your family."
    },
    feelings: {
      vi: "Cảm xúc của bạn đang dễ bị cuốn theo tâm trạng của những người xung quanh.",
      en: "Your emotions are easily swept away by the moods of those around you."
    },
    action: {
      vi: "Cần tách bạch ý kiến đám đông để hành động độc lập theo tiếng nói bên trong.",
      en: "Separate crowd opinions to act independently based on your inner voice."
    }
  },
  TENSION_NEUTRAL_TRANSITION: {
    general: {
      vi: "Bạn đang ở giai đoạn cần rõ điều gì nên giữ và điều gì nên buông.",
      en: "You are at a stage where you need to be clear about what to keep and what to let go."
    },
    love: {
      vi: "Mối quan hệ đang ở giai đoạn chuyển tiếp, cần thời gian để rõ hướng.",
      en: "The relationship is in a transitional phase; time is needed to clarify the path."
    },
    career: {
      vi: "Công việc đang ở giai đoạn chuyển tiếp, chưa cần vội quyết định lớn.",
      en: "Work is in a transitional phase; no need to rush into major decisions."
    },
    money: {
      vi: "Tài chính đang đi vào thế cân bằng tĩnh, hãy quan sát thêm trước khi đầu tư.",
      en: "Finance is entering a static equilibrium; observe more before investing."
    },
    family: {
      vi: "Không gian gia đình đang có sự lắng xuống để chuẩn bị cho những thay đổi mới.",
      en: "The family space is quietening down to prepare for new changes."
    },
    feelings: {
      vi: "Cảm xúc đang tạm lắng dịu, một trạng thái bình yên trung dung đang trở lại.",
      en: "Emotions are temporarily calming; a neutral peaceful state is returning."
    },
    action: {
      vi: "Chưa phải lúc hành động mạnh mẽ, hãy tiếp tục tích lũy và chờ thời cơ.",
      en: "It is not the time for aggressive action; continue accumulating and wait for opportunities."
    }
  }
};

function renderTensionText(code, perspective, language = "vi") {
  const tMap = TENSION_TEXTS[code] || TENSION_TEXTS.TENSION_NEUTRAL_TRANSITION;
  const pMap = tMap[perspective] || tMap.general;
  return pMap[language] || pMap.vi;
}

/**
 * Scoring Tension System
 */
export function pickMainTension(cards, metrics, perspective, language = "vi") {
  const candidates = [];

  if (metrics.reversedRatio >= 0.4) {
    let score = 30;
    if (metrics.blockCount > metrics.supportCount) score += 10;
    if (metrics.reversedRatio >= 0.6) score += 15;
    candidates.push({ code: "TENSION_HIDDEN_BLOCK", score });
  }

  if (metrics.dominantSuit === "Swords" && metrics.dominantSuitRatio >= 0.4) {
    let score = 25;
    if (metrics.total >= 5 && metrics.dominantSuitRatio >= 0.6) score += 10;
    candidates.push({ code: "TENSION_OVERTHINKING", score });
  }

  if (metrics.dominantSuit === "Pentacles" && metrics.dominantSuitRatio >= 0.4) {
    let score = 25;
    if (metrics.total >= 5 && metrics.dominantSuitRatio >= 0.6) score += 10;
    candidates.push({ code: "TENSION_STABILITY_FOCUS", score });
  }

  if (metrics.dominantSuit === "Cups" && metrics.dominantSuitRatio >= 0.4) {
    let score = 25;
    if (metrics.total >= 5 && metrics.dominantSuitRatio >= 0.6) score += 10;
    candidates.push({ code: "TENSION_EMOTION_FOCUS", score });
  }

  if (metrics.dominantSuit === "Wands" && metrics.dominantSuitRatio >= 0.4) {
    let score = 25;
    if (metrics.total >= 5 && metrics.dominantSuitRatio >= 0.6) score += 10;
    candidates.push({ code: "TENSION_ACTION_ENERGY", score });
  }

  if (metrics.supportCount > 0 && metrics.blockCount > 0) {
    let score = 20;
    if (metrics.supportCount > metrics.blockCount) score -= 10;
    candidates.push({ code: "TENSION_MIXED_SIGNAL", score });
  }

  if (metrics.majorRatio >= 0.5) {
    let score = 35;
    if (metrics.majorRatio >= 0.7) score += 15;
    candidates.push({ code: "TENSION_BIG_LESSON", score });
  }

  if (metrics.courtRatio >= 0.3) {
    candidates.push({ code: "TENSION_EXTERNAL_INFLUENCE", score: 20 });
  }

  if (candidates.length === 0) {
    candidates.push({ code: "TENSION_NEUTRAL_TRANSITION", score: 10 });
  }

  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];
  return renderTensionText(winner.code, perspective, language);
}

/**
 * Rotating template selector to prevent duplication
 */
function pickTemplate(bank, usedIndexSet, rng) {
  const available = bank
    .map((text, index) => ({ text, index }))
    .filter(item => !usedIndexSet.has(item.index));
  const pool = available.length > 0 ? available : bank.map((text, index) => ({ text, index }));
  const choice = pool[Math.floor(rng() * pool.length)];
  usedIndexSet.add(choice.index);
  if (usedIndexSet.size >= bank.length) usedIndexSet.clear();
  return choice.text;
}

export const INTRO_BANK = {
  general: {
    vi: [
      "Trải bài này cho thấy bạn không thiếu cơ hội hay khả năng, vấn đề nằm ở cách bạn đang xử lý tình huống.",
      "Nhìn tổng thể, đây không phải giai đoạn quá xấu, chỉ là lúc cần một quyết định rõ ràng hơn.",
      "Bức tranh chung ở đây không nặng nề như bạn nghĩ, nhưng cần bạn chủ động hơn một chút.",
      "Đây là giai đoạn cần chọn lọc thay vì ôm đồm mọi thứ cùng lúc.",
      "Trải bài này phản ánh một tình huống đang chờ bạn định hướng rõ hơn là chờ vận may."
    ],
    en: [
      "This spread shows that you do not lack opportunities or capabilities; the issue lies in how you handle the situation.",
      "Overall, this is not a bad phase, just a time when a clearer decision is needed.",
      "The general picture here is not as heavy as you think, but it requires you to be a bit more proactive.",
      "This is a stage where you need to filter and select rather than taking on everything at once.",
      "This spread reflects a situation waiting for you to guide it clearly rather than waiting for luck."
    ]
  },
  love: {
    vi: [
      "Trải bài này không cho thấy một biến cố quá lớn, mà giống như bạn đang cần nhìn lại cảm xúc thật của mình.",
      "Nhìn chung, mối quan hệ này đang ở giai đoạn cần sự rõ ràng hơn là cần thêm thời gian chờ đợi.",
      "Đây là lúc cảm xúc và hành động cần đi cùng nhau hơn là chỉ nghĩ trong đầu.",
      "Bức tranh tình cảm ở đây cho thấy cả hai đều có phần đúng, chỉ thiếu một cuộc nói chuyện thẳng.",
      "Trải bài này gợi ý rằng cảm xúc bạn đang có xứng đáng được nhìn nhận rõ ràng hơn."
    ],
    en: [
      "This spread does not show a major crisis, but rather that you need to look back at your true feelings.",
      "Generally, this relationship is at a stage that needs clarity rather than more waiting time.",
      "This is a time when feelings and actions need to go together rather than just staying in your head.",
      "The romantic picture here shows both sides have point, only lacking a direct conversation.",
      "This spread suggests that the emotions you have deserve to be recognized more clearly."
    ]
  },
  career: {
    vi: [
      "Nhìn tổng thể, đây không phải giai đoạn khủng hoảng mà là lúc cần điều chỉnh cách bạn đang làm việc.",
      "Công việc của bạn đang không thiếu cơ hội, chỉ thiếu một hướng đi rõ ràng để dồn sức vào.",
      "Đây là giai đoạn cần chọn ưu tiên đúng hơn là cố làm tất cả mọi thứ.",
      "Bức tranh công việc ở đây cho thấy bạn đủ năng lực, chỉ cần điều chỉnh cách tiếp cận.",
      "Trải bài này gợi ý rằng đây là lúc nên nhìn lại nhịp làm việc trước khi quyết định điều lớn."
    ],
    en: [
      "Overall, this is not a crisis phase, but rather a time when you need to adjust how you work.",
      "Your work is not short of opportunities, only lacking a clear direction to focus on.",
      "This is a stage where you need to choose the right priority rather than trying to do everything.",
      "The work picture here shows you are competent enough, just need to adjust your approach.",
      "This spread suggests that this is a time to look back at your work rhythm before deciding on big things."
    ]
  },
  money: {
    vi: [
      "Tình hình tài chính của bạn đang phản ánh trực tiếp thói quen chi tiêu hàng ngày.",
      "Đây là giai đoạn cần quản lý chặt chẽ dòng tiền hơn là tìm kiếm lợi nhuận nhanh.",
      "Bức tranh tài lộc cho thấy bạn đang đứng trước những lựa chọn đầu tư cần sự tỉnh táo.",
      "Hãy kiên nhẫn tích lũy, các cơ hội gia tăng tài sản sẽ dần tự rõ ràng.",
      "Trải bài khuyên bạn nên kiểm soát rủi ro trước khi nghĩ đến việc mở rộng quy mô kinh doanh."
    ],
    en: [
      "Your financial situation directly reflects your daily spending habits.",
      "This is a stage where tight cash flow management is needed rather than seeking quick profits.",
      "The wealth picture shows you are facing investment options that require alertness.",
      "Be patient in accumulating; opportunities to increase assets will gradually clarify.",
      "The spread advises you to control risks before thinking about expanding business scale."
    ]
  },
  family: {
    vi: [
      "Trải bài gia đình cho thấy sự gắn kết đang cần được xây dựng lại từ những hành động nhỏ.",
      "Không khí trong nhà đang chịu ảnh hưởng bởi những suy nghĩ chưa được nói ra.",
      "Đây là giai đoạn cần sự thấu hiểu và bao dung giữa các thành viên.",
      "Mọi chuyện trong gia đình sẽ êm đẹp nếu mỗi người bớt đi một chút cái tôi.",
      "Bức tranh gia đạo gợi ý đây là lúc bạn nên dành nhiều thời gian hơn cho người thân."
    ],
    en: [
      "The family reading shows that connection needs to be rebuilt from small actions.",
      "The atmosphere at home is influenced by unspoken thoughts.",
      "This is a stage that requires understanding and tolerance between family members.",
      "Everything in the family will be fine if each person reduces their ego a bit.",
      "The domestic picture suggests this is the time you should spend more time with relatives."
    ]
  },
  feelings: {
    vi: [
      "Trạng thái tinh thần của bạn đang phản chiếu trực tiếp những áp lực chưa được giải tỏa.",
      "Nội tâm bạn đang cần một khoảng lặng thật sự để lắng nghe chính mình.",
      "Hãy tôn trọng mọi cảm xúc hiện tại, kể cả những nỗi buồn hay sự mệt mỏi.",
      "Bức tranh cảm xúc cho thấy bạn đang tự tạo áp lực cho mình nhiều hơn mức cần thiết.",
      "Đây là giai đoạn thích hợp để kết nối sâu sắc với thế giới nội tâm của bạn."
    ],
    en: [
      "Your mental state directly reflects unreleased pressures.",
      "Your inner self is in need of a true pause to listen to yourself.",
      "Respect all current emotions, including sadness or fatigue.",
      "The emotional picture shows you are putting more pressure on yourself than necessary.",
      "This is a suitable stage to connect deeply with your inner world."
    ]
  },
  action: {
    vi: [
      "Hành động quyết đoán vào lúc này sẽ tạo nên bước ngoặt lớn cho tình huống.",
      "Đây không phải là lúc chỉ lên kế hoạch, hãy bắt tay vào thực hiện ngay.",
      "Bức tranh hành động khuyên bạn nên đi từng bước vững chắc thay vì vội vã.",
      "Hãy chuẩn bị kỹ lưỡng mọi khía cạnh trước khi thực hiện bước đi tiếp theo.",
      "Trải bài gợi ý bạn cần một động lực mạnh mẽ hơn để phá vỡ sự trì trệ hiện tại."
    ],
    en: [
      "Decisive action at this moment will create a major turning point for the situation.",
      "This is not the time to just plan; start executing immediately.",
      "The action picture advises you to take solid steps instead of rushing.",
      "Prepare all aspects thoroughly before taking your next step.",
      "The spread suggests you need stronger motivation to break the current stagnation."
    ]
  }
};

export const ADVICE_BANK = {
  general: {
    vi: [
      "Hãy chậm lại một nhịp, nhìn rõ điều đang lặp lại, rồi mới quyết định bước tiếp theo.",
      "Đôi khi im lặng quan sát thêm một chút sẽ tốt hơn phản ứng ngay lúc nóng giận.",
      "Nếu còn phân vân, hãy liệt kê rõ điều gì thực sự quan trọng nhất đối với bạn.",
      "Hãy tìm kiếm lời khuyên từ một người đi trước có kinh nghiệm và khách quan.",
      "Hãy cho bản thân thêm thời gian nghỉ ngơi để phục hồi năng lượng trước khi tiếp tục."
    ],
    en: [
      "Slow down a bit, see clearly what is repeating, then decide on the next step.",
      "Sometimes silently observing a bit more is better than reacting in anger.",
      "If still hesitant, list clearly what is truly most important to you.",
      "Seek advice from an experienced and objective mentor.",
      "Give yourself more rest time to recover energy before continuing."
    ]
  },
  love: {
    vi: [
      "Đừng cố đoán suy nghĩ của người kia quá nhiều, một cuộc nói chuyện rõ ràng sẽ có ích hơn việc tự suy diễn.",
      "Hãy cho bản thân và cả người kia thêm thời gian trước khi đưa ra quyết định lớn về mối quan hệ.",
      "Nếu còn phân vân, hãy hỏi lại chính mình điều gì thực sự quan trọng trong mối quan hệ này.",
      "Thử bày tỏ cảm xúc thật một cách nhẹ nhàng, thay vì chờ người khác tự hiểu.",
      "Đôi khi im lặng quan sát thêm một chút sẽ tốt hơn phản ứng ngay lúc cảm xúc còn dâng cao."
    ],
    en: [
      "Do not try to guess the other person's thoughts too much; a clear conversation will be more useful than self-speculation.",
      "Give yourself and the other person more time before making major decisions about the relationship.",
      "If still hesitating, ask yourself what is truly important in this relationship.",
      "Try to express your true feelings gently instead of waiting for others to automatically understand.",
      "Sometimes silently observing a bit more is better than reacting when emotions are high."
    ]
  },
  career: {
    vi: [
      "Việc cần làm trước mắt là chọn một ưu tiên rõ ràng và dồn sức vào đó, thay vì tản năng lượng ra nhiều việc cùng lúc.",
      "Hãy dành thời gian liệt kê điều gì thật sự quan trọng trong công việc lúc này trước khi quyết định bước tiếp.",
      "Đừng vội đưa ra quyết định lớn khi đang mệt, hãy chọn thời điểm đầu óc tỉnh táo hơn.",
      "Một cuộc trò chuyện thẳng với người có liên quan sẽ hữu ích hơn là tự suy đoán một mình.",
      "Hãy thử chia nhỏ mục tiêu công việc thành từng bước cụ thể để dễ theo dõi tiến độ."
    ],
    en: [
      "The immediate thing to do is to choose a clear priority and focus on it, rather than spreading your energy across multiple tasks.",
      "Take time to list what is truly important in your work right now before deciding on the next step.",
      "Do not rush to make big decisions when tired; choose a time when your mind is clearer.",
      "A straight talk with the person involved will be more useful than speculating alone.",
      "Try breaking down work goals into specific steps for easy progress tracking."
    ]
  },
  money: {
    vi: [
      "Trước khi ra quyết định tài chính lớn, hãy dành thêm thời gian kiểm tra lại thông tin.",
      "Hãy lập bảng thu chi chi tiết và cắt bỏ những khoản không thực sự cần thiết lúc này.",
      "Tránh các lời mời gọi đầu tư cam kết lợi nhuận cao nhưng thiếu cơ sở thực tế.",
      "Hãy tập trung thanh toán các khoản nợ ngắn hạn trước khi nghĩ đến việc đầu tư mới.",
      "Dành một phần nhỏ tích lũy làm quỹ dự phòng khẩn cấp là việc nên làm ngay."
    ],
    en: [
      "Before making a major financial decision, take some extra time to verify information.",
      "Make a detailed income/expense sheet and cut off unnecessary items right now.",
      "Avoid investment invitations promising high returns but lacking realistic grounds.",
      "Focus on clearing short-term debts before thinking about new investments.",
      "Setting aside a small accumulation as an emergency fund is something to do immediately."
    ]
  },
  family: {
    vi: [
      "Hãy chọn thời điểm bình tĩnh để nói chuyện thẳng, thay vì để mọi thứ tích tụ thêm.",
      "Hãy lắng nghe quan điểm của người thân bằng thái độ bao dung và tôn trọng.",
      "Một bữa tối chung hoặc hoạt động gắn kết nhỏ sẽ giúp làm mềm không khí căng thẳng.",
      "Đừng để những bất hòa bên ngoài ảnh hưởng đến sự bình yên vốn có trong gia đình.",
      "Hãy chủ động bày tỏ sự quan tâm và giúp đỡ người thân từ những hành động cụ thể."
    ],
    en: [
      "Choose a calm moment to speak directly rather than letting things pile up.",
      "Listen to your relative's views with a tolerant and respectful attitude.",
      "A shared dinner or a small bonding activity will help soften the tense atmosphere.",
      "Do not let external disagreements affect the inherent peace of the family.",
      "Proactively express care and help relatives through concrete actions."
    ]
  },
  feelings: {
    vi: [
      "Hãy cho phép bản thân được yếu lòng và khóc nếu cần, đừng cố gồng mình quá mức.",
      "Hãy viết nhật ký cảm xúc mỗi ngày để giải tỏa những suy nghĩ hỗn độn trong đầu.",
      "Dành thời gian hòa mình vào thiên nhiên hoặc thực hành thiền định để tìm lại sự bình yên.",
      "Hãy học cách nói lời từ chối với những yêu cầu làm tổn hao năng lượng tinh thần của bạn.",
      "Hãy tự thưởng cho bản thân một ngày nghỉ ngơi trọn vẹn và không suy nghĩ về công việc."
    ],
    en: [
      "Allow yourself to be vulnerable and cry if needed; do not push yourself too hard.",
      "Write an emotional journal daily to release chaotic thoughts in your head.",
      "Spend time immersing in nature or practicing meditation to find peace again.",
      "Learn to say no to requests that drain your spiritual energy.",
      "Reward yourself with a day of complete rest without thinking about work."
    ]
  },
  action: {
    vi: [
      "Hãy bắt tay vào làm việc nhỏ nhất ngay bây giờ, đà hành động sẽ cuốn trôi sự trì trệ.",
      "Lập danh sách việc cần làm trong ngày và kỷ luật thực hiện theo đúng kế hoạch.",
      "Hãy loại bỏ các yếu tố gây mất tập trung xung quanh bạn trước khi bắt đầu làm việc.",
      "Tìm một người đồng hành cùng cam kết hành động để đôn đốc tiến độ lẫn nhau.",
      "Hãy tự thưởng cho bản thân sau khi hoàn thành mỗi cột mốc công việc nhỏ."
    ],
    en: [
      "Start working on the smallest task right now; momentum will wash away stagnation.",
      "Make a daily to-do list and disciplinedly execute according to plan.",
      "Eliminate distractions around you before starting work.",
      "Find a partner committed to action to monitor progress mutually.",
      "Reward yourself after completing each small milestone."
    ]
  }
};

const usedIntroIndices = new Set();
const usedAdviceIndices = new Set();

/**
 * Generate a multi-dimensional, deep reading summary analysis object
 */
export function composeSpreadSummary(drawnCards, spreadPresetId, perspective = "general", language = "vi", question = "", seed = Date.now()) {
  if (!drawnCards || drawnCards.length === 0) return null;
  
  const activePerspective = PERSPECTIVES.some(p => p.key === perspective) ? perspective : "general";
  const positions = getPositionRoles(spreadPresetId, activePerspective, language);
  
  const metrics = computePatternMetrics(drawnCards);
  const tension = pickMainTension(drawnCards, metrics, activePerspective, language);
  
  const rng = createSeededRandom(seed + 2);
  const introBankPerspective = INTRO_BANK[activePerspective] || INTRO_BANK.general;
  const introText = pickTemplate(introBankPerspective[language] || introBankPerspective.vi, usedIntroIndices, rng);
  
  const adviceBankPerspective = ADVICE_BANK[activePerspective] || ADVICE_BANK.general;
  const adviceText = pickTemplate(adviceBankPerspective[language] || adviceBankPerspective.vi, usedAdviceIndices, rng);
  
  const interpretedCards = drawnCards.map((card, index) => {
    const isEn = language === 'en';
    const fallbackList = [];
    for (let i = 0; i < 20; i++) {
      fallbackList.push(isEn ? `Position ${i + 1}` : `Vị trí ${i + 1}`);
    }
    const position = (Array.isArray(positions) ? positions[index] : positions) || fallbackList[index];
    
    // get basic meaning
    const orientation = card.orientation || "upright";
    const humanMeaning = getMeaningField(card, activePerspective, orientation);
    
    // get situation impact
    const impact = getImpactSentence(activePerspective, orientation, language);
    
    return {
      card,
      position,
      humanMeaning,
      impact
    };
  });
  
  return {
    context: activePerspective,
    intro: `${introText} ${tension}`,
    positions: interpretedCards,
    coreMessage: language === "en"
      ? `The overall story of these cards is: ${tension}`
      : `Câu chuyện chung của các lá bài này là: ${tension}`,
    advice: adviceText
  };
}

export const CONTEXTS = PERSPECTIVES;

export function analyzeSpreadPatterns(cards, language = "vi") {
  const metrics = computePatternMetrics(cards);
  const tone = [];
  if (language === 'en') {
    if (metrics.dominantSuit === "Cups" && metrics.dominantSuitRatio >= 0.4) tone.push("Emotional (Cups)");
    if (metrics.dominantSuit === "Wands" && metrics.dominantSuitRatio >= 0.4) tone.push("Action-oriented (Wands)");
    if (metrics.dominantSuit === "Swords" && metrics.dominantSuitRatio >= 0.4) tone.push("Intellectual/Challenging (Swords)");
    if (metrics.dominantSuit === "Pentacles" && metrics.dominantSuitRatio >= 0.4) tone.push("Practical/Material (Pentacles)");
  } else {
    if (metrics.dominantSuit === "Cups" && metrics.dominantSuitRatio >= 0.4) tone.push("Cảm xúc (Emotional)");
    if (metrics.dominantSuit === "Wands" && metrics.dominantSuitRatio >= 0.4) tone.push("Động lực/Hành động (Action-oriented)");
    if (metrics.dominantSuit === "Swords" && metrics.dominantSuitRatio >= 0.4) tone.push("Áp lực trí óc/Thách thức (Intellectual/Challenging)");
    if (metrics.dominantSuit === "Pentacles" && metrics.dominantSuitRatio >= 0.4) tone.push("Thực tế/Vật chất (Practical/Material)");
  }
  return {
    tone,
    majorCount: cards.filter(c => c.arcana === "Major").length,
    reversedCount: cards.filter(c => c.orientation === "reversed").length
  };
}
