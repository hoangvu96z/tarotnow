import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../Cards-jpg');
const destDir = path.join(__dirname, '../public/assets/cards');
const dataDir = path.join(__dirname, '../public/data');

// Create folders if they don't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Major Arcana details in English
const majorArcanaNames = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

// Vietnamese keywords for Major Arcana
const majorArcanaKeywordsVi = [
  { upright: ["khởi đầu mới", "tự do", "ngây thơ", "tự phát"], reversed: ["liều lĩnh", "khờ dại", "rủi ro", "trì hoãn"] },
  { upright: ["ý chí", "hiện thực hóa", "hành động", "tài xoay sở"], reversed: ["thao túng", "ảo tưởng", "phung phí tài năng", "tiềm năng chưa khai phá"] },
  { upright: ["trực giác", "tiềm thức", "bí ẩn", "tiếng nói nội tâm"], reversed: ["động cơ ẩn giấu", "phớt lờ trực giác", "hời hợt", "hoài nghi"] },
  { upright: ["trù phú", "thiên nhiên", "sáng tạo", "sinh sôi"], reversed: ["phụ thuộc", "ngột ngạt", "tắc nghẽn sáng tạo", "thiếu tăng trưởng"] },
  { upright: ["quyền lực", "cấu trúc", "kiểm soát", "nền tảng vững chắc"], reversed: ["độc đoán", "cứng nhắc", "kém hiệu quả", "mất kiểm soát"] },
  { upright: ["truyền thống", "khuôn mẫu", "trí tuệ tinh thần", "tổ chức"], reversed: ["nổi loạn", "phá cách", "con đường mới", "cố chấp"] },
  { upright: ["tình yêu", "hòa hợp", "lựa chọn", "liên kết"], reversed: ["bất hòa", "lệch nhịp", "lựa chọn sai lầm", "thiếu tự ái"] },
  { upright: ["kiểm soát", "ý chí", "chiến thắng", "quyết tâm"], reversed: ["mất phương hướng", "thiếu tự chủ", "hung hăng", "trở ngại"] },
  { upright: ["can đảm", "sức mạnh nội tâm", "sức ảnh hưởng", "trắc ẩn"], reversed: ["nghi ngờ bản thân", "yếu đuối", "cảm xúc lấn át", "bất lực"] },
  { upright: ["tìm kiếm bản ngã", "định hướng dẫn lối", "cô độc", "chiêm nghiệm"], reversed: ["cô lập", "cô đơn", "thu mình", "hoang tưởng"] },
  { upright: ["may mắn", "định mệnh", "nhân quả", "bước ngoặt"], reversed: ["vận rủi", "kháng cự thay đổi", "phá vỡ vòng lặp", "mất kiểm soát"] },
  { upright: ["công lý", "sự thật", "công bằng", "nhân quả"], reversed: ["bất công", "không trung thực", "thiếu trách nhiệm", "thiên vị"] },
  { upright: ["đầu hàng", "góc nhìn mới", "buông bỏ", "hy sinh"], reversed: ["đình trệ", "kháng cự", "do dự", "trì hoãn"] },
  { upright: ["kết thúc", "thay đổi", "chuyển giao", "tái sinh"], reversed: ["kháng cự thay đổi", "thanh lọc", "thối rữa", "níu kéo"] },
  { upright: ["cân bằng", "tiết độ", "kiên nhẫn", "mục đích"], reversed: ["mất cân bằng", "thái quá", "vội vã", "lệch lạc"] },
  { upright: ["trói buộc", "nghiện ngập", "vật chất", "hoang dã"], reversed: ["buông bỏ", "giải thoát", "hồi phục", "giác ngộ"] },
  { upright: ["thay đổi đột ngột", "sụp đổ", "khải huyền", "hỗn loạn"], reversed: ["tránh được tai họa", "sợ thay đổi", "trì hoãn điều tất yếu", "tái thiết"] },
  { upright: ["hy vọng", "niềm tin", "mục đích", "đổi mới"], reversed: ["mất niềm tin", "tuyệt vọng", "nản lòng", "tắc nghẽn ý tưởng"] },
  { upright: ["ảo tưởng", "sợ hãi", "lo âu", "tiềm thức"], reversed: ["giải tỏa nỗi sợ", "sự thật phơi bày", "vượt qua lo âu", "mơ hồ"] },
  { upright: ["thành công", "ấm áp", "sinh lực", "niềm vui"], reversed: ["u ám tạm thời", "thiếu rõ ràng", "kỳ vọng phi thực tế", "nỗi buồn"] },
  { upright: ["chiêm nghiệm", "phán xét", "thức tỉnh", "xá tội"], reversed: ["nghi ngờ bản thân", "chỉ trích nội tâm", "phớt lờ tiếng gọi", "hối tiếc"] },
  { upright: ["hoàn thành", "thành tựu", "hành trình", "trọn vẹn"], reversed: ["dở dang", "thiếu khép lại", "đi đường tắt", "trì hoãn"] }
];

// Minor Arcana ranks and keywords in Vietnamese
const rankDetailsVi = {
  "01": { rank: "Ace", name: "Ace", keywords: { upright: ["khởi đầu mới", "cơ hội", "tiềm năng"], reversed: ["tắc nghẽn sáng tạo", "bỏ lỡ cơ hội", "do dự"] } },
  "02": { rank: "Two", name: "Two", keywords: { upright: ["cân bằng", "lựa chọn", "đối tác"], reversed: ["do dự", "xung đột", "mất cân bằng"] } },
  "03": { rank: "Three", name: "Three", keywords: { upright: ["hợp tác", "tình bạn", "tăng trưởng"], reversed: ["cô lập", "hiểu lầm", "trì hoãn"] } },
  "04": { rank: "Four", name: "Four", keywords: { upright: ["ổn định", "nghỉ ngơi", "chiêm nghiệm"], reversed: ["bồn chồn", "kiệt sức", "thức tỉnh"] } },
  "05": { rank: "Five", name: "Five", keywords: { upright: ["tổn thất", "xung đột", "thất bại"], reversed: ["hồi phục", "hòa giải", "bước tiếp"] } },
  "06": { rank: "Six", name: "Six", keywords: { upright: ["hoài niệm", "hào phóng", "chia sẻ"], reversed: ["mắc kẹt trong quá khứ", "độc lập", "tăng trưởng"] } },
  "07": { rank: "Seven", name: "Seven", keywords: { upright: ["lựa chọn", "đánh giá", "chiến lược"], reversed: ["mơ hồ", "phân tâm", "do dự"] } },
  "08": { rank: "Eight", name: "Eight", keywords: { upright: ["hành động", "cống hiến", "chuyển động"], reversed: ["trì trệ", "nản lòng", "thiếu tập trung"] } },
  "09": { rank: "Nine", name: "Nine", keywords: { upright: ["hài lòng", "mãn nguyện", "ước nguyện"], reversed: ["không hạnh phúc", "tham lam", "thất vọng"] } },
  "10": { rank: "Ten", name: "Ten", keywords: { upright: ["hoàn thành", "di sản", "hòa hợp"], reversed: ["bất hòa", "mơ ước tan vỡ", "tổn thất"] } },
  "11": { rank: "Page", name: "Page", keywords: { upright: ["tò mò", "thông điệp", "cảm hứng"], reversed: ["thiếu chín chắn", "tin xấu", "mơ mộng"] } },
  "12": { rank: "Knight", name: "Knight", keywords: { upright: ["hành động", "theo đuổi", "phiêu lưu"], reversed: ["liều lĩnh", "kiệt sức", "trì trệ"] } },
  "13": { rank: "Queen", name: "Queen", keywords: { upright: ["nuôi dưỡng", "an toàn cảm xúc", "trực giác"], reversed: ["không an toàn", "bất ổn cảm xúc", "lạnh lùng"] } },
  "14": { rank: "King", name: "King", keywords: { upright: ["làm chủ", "quyền lực", "kiểm soát"], reversed: ["độc đoán", "thao túng", "yếu đuối"] } }
};

const suits = ["Cups", "Pentacles", "Swords", "Wands"];

const cards = [];

// Helper to copy file
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.error(`File not found: ${src}`);
  }
}

// Function to generate template meanings for a card based on its name and keywords
function generateMeanings(cardName, kwUp, kwRev, suit) {
  const suitText = suit ? `bộ ${suit}` : "Ẩn chính";
  const name = cardName;
  
  // Safe helper to extract keywords
  const u1 = kwUp[0] || "tích cực";
  const u2 = kwUp[1] || "cơ hội";
  const u3 = kwUp[2] || "phát triển";
  
  const r1 = kwRev[0] || "chậm trễ";
  const r2 = kwRev[1] || "thách thức";
  const r3 = kwRev[2] || "cản trở";

  return {
    keywords_upright: kwUp,
    keywords_reversed: kwRev,
    
    general_upright: `Lá bài ${name} biểu thị sự ${u1}, ${u2} và ${u3}. Đây là thời điểm tuyệt vời để đón nhận những thay đổi tích cực và tin tưởng vào hành trình phía trước.`,
    general_reversed: `Khi đảo ngược, ${name} chỉ ra sự ${r1} hoặc ${r2}. Bạn có thể đang gặp phải ${r3}, hãy kiên nhẫn nhìn nhận lại và tránh hành động bốc đồng.`,
    
    love_upright: `Trong tình cảm, ${name} mang đến năng lượng của sự ${u1} và ${u2}. Nếu đã có đôi, hai bạn đang tiến đến sự ${u3} bền chặt. Nếu độc thân, một mối quan hệ mới đầy hứa hẹn đang mở ra.`,
    love_reversed: `Ở trạng thái ngược, ${name} khuyên bạn cẩn thận với sự ${r1} hoặc cảm giác ${r2} trong tình cảm. Hãy cẩn thận tránh để sự ${r3} gây hiểu lầm hoặc rạn nứt không đáng có.`,
    
    career_upright: `Về sự nghiệp, ${name} báo hiệu sự ${u1} và mở ra các cơ hội ${u2}. Hãy tự tin phát huy khả năng ${u3} của bạn để đạt được các mục tiêu công việc.`,
    career_reversed: `Trạng thái ngược cảnh báo công việc có sự ${r1} hoặc ${r2}. Hãy tránh đưa ra các quyết định đầu tư mạo hiểm hoặc đối diện với sự ${r3} bằng sự chuẩn bị chu đáo.`,
    
    money_upright: `Tài chính đang ghi nhận xu hướng ${u1} và có cơ hội ${u2}. Việc chi tiêu hợp lý và đầu tư vào sự ${u3} sẽ mang lại kết quả tài lộc ổn định.`,
    money_reversed: `Cảnh báo tài chính có thể gặp sự ${r1} hoặc ${r2}. Nên thắt chặt hầu bao và đề phòng sự ${r3} làm thâm hụt ngân sách.`,
    
    family_upright: `Gia đạo yên ổn, ngập tràn sự ${u1} và ${u2}. Sự gắn kết và chia sẻ ${u3} là chìa khóa kết nối mọi thành viên.`,
    family_reversed: `Mối quan hệ gia đình có thể gặp sự ${r1} hoặc bất đồng ${r2}. Cần kiên nhẫn đối thoại để giải tỏa ${r3} tích tụ.`,
    
    feelings_upright: `Cảm xúc của bạn hoặc đối phương lúc này là sự ${u1}, tràn đầy ${u2} và háo hức hướng tới ${u3}.`,
    feelings_reversed: `Cảm xúc đang có phần ${r1} hoặc ${r2}. Có sự ${r3} khiến tâm lý chưa thực sự thoải mái và cởi mở.`,
    
    action_upright: `Lời khuyên hành động: Hãy tự tin thực hiện ${u1}, nắm bắt ${u2} và chủ động thúc đẩy sự ${u3} diễn ra.`,
    action_reversed: `Lời khuyên ngược: Hãy tạm dừng để giải quyết sự ${r1}, xem xét kỹ sự ${r2} và tránh đưa ra hành động vội vã do ${r3}.`
  };
}

// Process CardBacks
copyFile(path.join(sourceDir, 'CardBacks.jpg'), path.join(destDir, 'card-back.jpg'));

// 1. Process Major Arcana
for (let i = 0; i <= 21; i++) {
  const fileNum = String(i).padStart(2, '0');
  const sourceName = `${fileNum}-TheFool.jpg`.replace('TheFool', majorArcanaNames[i].replace(/ /g, ''));
  let actualSrcName = sourceName;
  if (i === 10) actualSrcName = "10-WheelOfFortune.jpg";
  
  const srcPath = path.join(sourceDir, actualSrcName);
  const destName = `major-${i}.jpg`;
  const destPath = path.join(destDir, destName);
  
  copyFile(srcPath, destPath);

  const keywordsVi = majorArcanaKeywordsVi[i];
  const meanings = generateMeanings(majorArcanaNames[i], keywordsVi.upright, keywordsVi.reversed, null);

  cards.push({
    id: `major-${i}`,
    name: majorArcanaNames[i],
    arcana: "Major",
    suit: null,
    rank: i,
    number: i,
    image: `/assets/cards/${destName}`,
    alt: `${majorArcanaNames[i]} tarot card`,
    uprightKeywords: keywordsVi.upright,
    reversedKeywords: keywordsVi.reversed,
    meanings: meanings
  });
}

// 2. Process Minor Arcana
for (const suit of suits) {
  for (let num = 1; num <= 14; num++) {
    const numStr = String(num).padStart(2, '0');
    const actualSrcName = `${suit}${numStr}.jpg`;
    
    const srcPath = path.join(sourceDir, actualSrcName);
    
    const rankInfo = rankDetailsVi[numStr];
    const rankLabel = rankInfo.rank.toLowerCase();
    const destName = `${suit.toLowerCase()}-${rankLabel}.jpg`;
    const destPath = path.join(destDir, destName);
    
    copyFile(srcPath, destPath);

    let displayName = `${rankInfo.name} of ${suit}`;
    if (num >= 11) {
      displayName = `${rankInfo.name} of ${suit}`;
    }

    const keywordsVi = rankInfo.keywords;
    const meanings = generateMeanings(displayName, keywordsVi.upright, keywordsVi.reversed, suit);

    cards.push({
      id: `${suit.toLowerCase()}-${rankLabel}`,
      name: displayName,
      arcana: "Minor",
      suit: suit,
      rank: rankInfo.name,
      number: num,
      image: `/assets/cards/${destName}`,
      alt: `${displayName} tarot card`,
      uprightKeywords: keywordsVi.upright,
      reversedKeywords: keywordsVi.reversed,
      meanings: meanings
    });
  }
}

// Write out JSON
fs.writeFileSync(path.join(dataDir, 'cards.json'), JSON.stringify(cards, null, 2));
console.log(`Successfully processed ${cards.length} cards with meanings metadata.`);
