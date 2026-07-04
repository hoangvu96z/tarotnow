import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../public/data');

const majorArcanaNames = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

const majorArcanaKeywordsEn = [
  { upright: ["new beginnings", "freedom", "innocence", "spontaneity"], reversed: ["recklessness", "foolishness", "risk", "delays"] },
  { upright: ["willpower", "manifestation", "action", "resourcefulness"], reversed: ["manipulation", "illusions", "wasted talent", "untapped potential"] },
  { upright: ["intuition", "subconscious", "mystery", "inner voice"], reversed: ["hidden motives", "ignored intuition", "superficiality", "skepticism"] },
  { upright: ["abundance", "nature", "creativity", "nurturing"], reversed: ["dependence", "smothering", "creative block", "lack of growth"] },
  { upright: ["authority", "structure", "control", "solid foundation"], reversed: ["tyranny", "rigidity", "inefficiency", "loss of control"] },
  { upright: ["tradition", "conformity", "spiritual wisdom", "organization"], reversed: ["rebellion", "unorthodoxy", "new paths", "stubbornness"] },
  { upright: ["love", "harmony", "choices", "connections"], reversed: ["disharmony", "misalignment", "wrong choices", "lack of self-love"] },
  { upright: ["control", "willpower", "victory", "determination"], reversed: ["lack of direction", "lack of self-discipline", "aggression", "obstacles"] },
  { upright: ["courage", "inner strength", "influence", "compassion"], reversed: ["self-doubt", "weakness", "overwhelming emotions", "helplessness"] },
  { upright: ["soul-searching", "guidance", "solitude", "contemplation"], reversed: ["isolation", "loneliness", "withdrawal", "paranoia"] },
  { upright: ["good luck", "destiny", "karma", "turning points"], reversed: ["bad luck", "resisting change", "breaking cycles", "lack of control"] },
  { upright: ["justice", "truth", "fairness", "cause and effect"], reversed: ["injustice", "dishonesty", "lack of accountability", "bias"] },
  { upright: ["surrender", "new perspectives", "letting go", "sacrifice"], reversed: ["stagnation", "resistance", "indecision", "delays"] },
  { upright: ["endings", "change", "transition", "rebirth"], reversed: ["resisting change", "purging", "decay", "clinging"] },
  { upright: ["balance", "moderation", "patience", "purpose"], reversed: ["imbalance", "excess", "haste", "deviation"] },
  { upright: ["bondage", "addiction", "materialism", "wildness"], reversed: ["letting go", "release", "recovery", "enlightenment"] },
  { upright: ["sudden change", "ruin", "revelation", "chaos"], reversed: ["avoiding disaster", "fear of change", "delaying the inevitable", "rebuilding"] },
  { upright: ["hope", "faith", "purpose", "renewal"], reversed: ["lack of faith", "despair", "discouragement", "creative blocks"] },
  { upright: ["illusion", "fear", "anxiety", "subconscious"], reversed: ["releasing fear", "truth unveiled", "overcoming anxiety", "vagueness"] },
  { upright: ["success", "warmth", "vitality", "joy"], reversed: ["temporary gloom", "lack of clarity", "unrealistic expectations", "sadness"] },
  { upright: ["reflection", "judgment", "awakening", "absolution"], reversed: ["self-doubt", "inner criticism", "ignoring the call", "regret"] },
  { upright: ["completion", "achievement", "travel", "wholeness"], reversed: ["incomplete", "lack of closure", "taking shortcuts", "delays"] }
];

const rankDetailsEn = {
  "01": { rank: "Ace", name: "Ace", keywords: { upright: ["new beginnings", "opportunities", "potential"], reversed: ["creative blocks", "missed opportunities", "hesitation"] } },
  "02": { rank: "Two", name: "Two", keywords: { upright: ["balance", "decisions", "partnership"], reversed: ["indecision", "conflict", "imbalance"] } },
  "03": { rank: "Three", name: "Three", keywords: { upright: ["collaboration", "friendship", "growth"], reversed: ["isolation", "misunderstanding", "delays"] } },
  "04": { rank: "Four", name: "Four", keywords: { upright: ["stability", "rest", "contemplation"], reversed: ["restlessness", "burnout", "awakening"] } },
  "05": { rank: "Five", name: "Five", keywords: { upright: ["loss", "conflict", "defeat"], reversed: ["recovery", "reconciliation", "moving on"] } },
  "06": { rank: "Six", name: "Six", keywords: { upright: ["nostalgia", "generosity", "sharing"], reversed: ["stuck in the past", "independence", "growth"] } },
  "07": { rank: "Seven", name: "Seven", keywords: { upright: ["choices", "evaluation", "strategy"], reversed: ["confusion", "distraction", "hesitation"] } },
  "08": { rank: "Eight", name: "Eight", keywords: { upright: ["action", "dedication", "movement"], reversed: ["stagnation", "discouragement", "lack of focus"] } },
  "09": { rank: "Nine", name: "Nine", keywords: { upright: ["satisfaction", "contentment", "wishes"], reversed: ["unhappiness", "greed", "disappointment"] } },
  "10": { rank: "Ten", name: "Ten", keywords: { upright: ["completion", "legacy", "harmony"], reversed: ["disharmony", "broken dreams", "loss"] } },
  "11": { rank: "Page", name: "Page", keywords: { upright: ["curiosity", "messages", "inspiration"], reversed: ["immaturity", "bad news", "daydreaming"] } },
  "12": { rank: "Knight", name: "Knight", keywords: { upright: ["action", "pursuit", "adventure"], reversed: ["recklessness", "burnout", "stagnation"] } },
  "13": { rank: "Queen", name: "Queen", keywords: { upright: ["nurturing", "emotional security", "intuition"], reversed: ["insecurity", "emotional instability", "coldness"] } },
  "14": { rank: "King", name: "King", keywords: { upright: ["mastery", "authority", "control"], reversed: ["tyranny", "manipulation", "weakness"] } }
};

const suits = ["Cups", "Pentacles", "Swords", "Wands"];
const cards = [];

function generateMeaningsEn(cardName, kwUp, kwRev, suit) {
  const name = cardName;
  const u1 = kwUp[0] || "positivity";
  const u2 = kwUp[1] || "opportunity";
  const u3 = kwUp[2] || "growth";
  
  const r1 = kwRev[0] || "delay";
  const r2 = kwRev[1] || "challenge";
  const r3 = kwRev[2] || "obstacle";

  return {
    keywords_upright: kwUp,
    keywords_reversed: kwRev,
    
    general_upright: `The ${name} card represents ${u1}, ${u2}, and ${u3}. This is an excellent time to embrace positive changes and trust the journey ahead.`,
    general_reversed: `When reversed, the ${name} indicates ${r1} or ${r2}. You might be facing ${r3}; take a patient look back and avoid impulsive actions.`,
    
    love_upright: `In love and relationships, the ${name} brings the energy of ${u1} and ${u2}. If you are in a couple, both of you are moving towards a strong bond of ${u3}. If single, a promising new relationship is opening up.`,
    love_reversed: `When reversed, the ${name} advises you to be careful with ${r1} or feelings of ${r2} in love. Take care to prevent ${r3} from causing misunderstandings or unnecessary rifts.`,
    
    career_upright: `In terms of career, the ${name} signals ${u1} and opens up opportunities for ${u2}. Confidently harness your ability for ${u3} to achieve your professional goals.`,
    career_reversed: `When reversed, this card warns of ${r1} or ${r2} in work. Avoid making risky investment decisions or face ${r3} with careful preparation.`,
    
    money_upright: `Your finances are showing a trend of ${u1} with opportunities for ${u2}. Managing your budget wisely and investing in ${u3} will bring stable financial results.`,
    money_reversed: `Financial warnings suggest you might encounter ${r1} or ${r2}. It is advisable to tighten your purse strings and guard against ${r3} draining your budget.`,
    
    family_upright: `Your family life is peaceful, filled with ${u1} and ${u2}. Bond and shared ${u3} are key to connecting all family members.`,
    family_reversed: `Family relationships may experience ${r1} or disagreements about ${r2}. Patient dialogue is needed to release accumulated ${r3}.`,
    
    feelings_upright: `Your or your partner's emotions at this time represent ${u1}, full of ${u2} and eagerly looking forward to ${u3}.`,
    feelings_reversed: `Emotions are somewhat characterized by ${r1} or ${r2}. There is some ${r3} preventing the mindset from being truly comfortable and open.`,
    
    action_upright: `Action advice: Confidently take steps towards ${u1}, seize ${u2}, and proactively promote the flow of ${u3}.`,
    action_reversed: `Reversed advice: Pause to resolve ${r1}, carefully examine the ${r2}, and avoid making hasty moves due to ${r3}.`
  };
}

// 1. Process Major Arcana
for (let i = 0; i <= 21; i++) {
  const destName = `major-${i}.jpg`;
  const keywordsEn = majorArcanaKeywordsEn[i];
  const meanings = generateMeaningsEn(majorArcanaNames[i], keywordsEn.upright, keywordsEn.reversed, null);

  cards.push({
    id: `major-${i}`,
    name: majorArcanaNames[i],
    arcana: "Major",
    suit: null,
    rank: i,
    number: i,
    image: `/assets/cards/${destName}`,
    alt: `${majorArcanaNames[i]} tarot card`,
    uprightKeywords: keywordsEn.upright,
    reversedKeywords: keywordsEn.reversed,
    meanings: meanings
  });
}

// 2. Process Minor Arcana
for (const suit of suits) {
  for (let num = 1; num <= 14; num++) {
    const numStr = String(num).padStart(2, '0');
    const rankInfo = rankDetailsEn[numStr];
    const rankLabel = rankInfo.rank.toLowerCase();
    const destName = `${suit.toLowerCase()}-${rankLabel}.jpg`;
    
    let displayName = `${rankInfo.name} of ${suit}`;

    const keywordsEn = rankInfo.keywords;
    const meanings = generateMeaningsEn(displayName, keywordsEn.upright, keywordsEn.reversed, suit);

    cards.push({
      id: `${suit.toLowerCase()}-${rankLabel}`,
      name: displayName,
      arcana: "Minor",
      suit: suit,
      rank: rankInfo.name,
      number: num,
      image: `/assets/cards/${destName}`,
      alt: `${displayName} tarot card`,
      uprightKeywords: keywordsEn.upright,
      reversedKeywords: keywordsEn.reversed,
      meanings: meanings
    });
  }
}

// Write out JSON
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(path.join(dataDir, 'cards_en.json'), JSON.stringify(cards, null, 2));
console.log(`Successfully generated cards_en.json with ${cards.length} English cards.`);
