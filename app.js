const CASES = [
  {
    id: 1,
    title: "Sốt và xuất huyết sau đi thực địa",
    diagnosis: "Sốt xuất huyết Dengue",
    aliases: ["dengue", "sot xuat huyet", "sot xuat huyet dengue", "sxh"],
    clues: [
      "Nam 21 tuổi, sinh viên y, sốt cao đột ngột 39,5 độ C kèm đau mỏi toàn thân sau 3 ngày đi thực địa tại miền Tây.",
      "Bệnh nhân đau đầu vùng hốc mắt, buồn nôn, không ho, không đau họng, không tiểu buốt.",
      "Khám có chấm xuất huyết rải rác hai cẳng chân, dấu dây thắt dương tính.",
      "Công thức máu: bạch cầu 2,8 G/L, tiểu cầu 92 G/L, hematocrit tăng nhẹ so với nền.",
      "Men gan tăng nhẹ, test NS1 dương tính vào ngày bệnh thứ 4.",
      "Điều trị chủ yếu là theo dõi dấu hiệu cảnh báo, bù dịch hợp lý và tránh NSAID."
    ],
    summary:
      "Sốt cao đột ngột, đau hốc mắt, giảm bạch cầu, giảm tiểu cầu, cô đặc máu và NS1 dương tính gợi ý sốt xuất huyết Dengue.",
    pearls: {
      "Dấu hiệu cảnh báo": "Đau bụng nhiều, nôn ói dai dẳng, lừ đừ, gan to, xuất huyết niêm mạc hoặc hematocrit tăng nhanh.",
      "Bẫy thường gặp": "Dùng ibuprofen hoặc aspirin để hạ sốt có thể làm tăng nguy cơ xuất huyết."
    }
  },
  {
    id: 2,
    title: "Khó thở kèm đau ngực kiểu màng phổi",
    diagnosis: "Thuyên tắc phổi",
    aliases: ["thuyen tac phoi", "pulmonary embolism", "pe"],
    clues: [
      "Nữ 33 tuổi khó thở đột ngột, đau ngực tăng khi hít sâu sau chuyến bay dài 12 giờ.",
      "Mạch 118 lần/phút, SpO2 91% khí phòng, phổi nghe gần như bình thường.",
      "Bệnh nhân đang dùng thuốc tránh thai phối hợp và có sưng đau bắp chân trái 2 ngày nay.",
      "Khí máu cho thấy kiềm hô hấp nhẹ; D-dimer tăng rõ.",
      "CTPA phát hiện khuyết thuốc cản quang ở nhánh động mạch phổi phải.",
      "Xử trí tùy nguy cơ: chống đông là nền tảng, tiêu sợi huyết khi huyết động không ổn định."
    ],
    summary:
      "Khó thở đột ngột, đau ngực kiểu màng phổi, nhịp nhanh và yếu tố nguy cơ huyết khối hướng đến thuyên tắc phổi.",
    pearls: {
      "Tư duy nhanh": "Phổi nghe bình thường không loại trừ thuyên tắc phổi.",
      "Điểm học thi": "Wells/Geneva giúp ước lượng xác suất trước xét nghiệm."
    }
  },
  {
    id: 3,
    title: "Đau thượng vị lan ra sau lưng",
    diagnosis: "Viêm tụy cấp",
    aliases: ["viem tuy cap", "acute pancreatitis"],
    clues: [
      "Nam 45 tuổi đau thượng vị dữ dội, lan ra sau lưng, giảm nhẹ khi ngồi cúi người.",
      "Bệnh nhân buồn nôn nhiều, uống rượu nặng trong tiệc tối hôm trước.",
      "Khám ấn đau thượng vị, bụng chướng nhẹ, không có phản ứng thành bụng rõ.",
      "Lipase máu tăng hơn 3 lần giới hạn trên bình thường.",
      "Siêu âm bụng ghi nhận sỏi túi mật nhỏ, đường mật không giãn.",
      "Điều trị ban đầu gồm bù dịch, giảm đau, dinh dưỡng sớm khi dung nạp và xử trí nguyên nhân."
    ],
    summary:
      "Đau thượng vị lan sau lưng kèm lipase tăng cao đủ tiêu chuẩn chẩn đoán viêm tụy cấp.",
    pearls: {
      "Nguyên nhân nhớ nhanh": "Sỏi mật và rượu là hai nguyên nhân thường gặp.",
      "Không nên quên": "Đánh giá mức độ nặng và dấu suy tạng trong 48 giờ đầu."
    }
  },
  {
    id: 4,
    title: "Phù và tiểu bọt sau viêm họng",
    diagnosis: "Viêm cầu thận cấp hậu nhiễm liên cầu",
    aliases: ["viem cau than cap hau nhiem lien cau", "post streptococcal glomerulonephritis", "psgn"],
    clues: [
      "Bé trai 9 tuổi phù mi mắt buổi sáng và tiểu sẫm màu như nước trà.",
      "Hai tuần trước trẻ có viêm họng mủ, tự hết sau vài ngày.",
      "Huyết áp 145/92 mmHg, phù nhẹ hai chân, lượng nước tiểu giảm.",
      "Tổng phân tích nước tiểu có hồng cầu biến dạng, trụ hồng cầu và protein niệu mức vừa.",
      "ASO tăng, C3 giảm, chức năng thận tăng nhẹ creatinin.",
      "Điều trị chủ yếu hỗ trợ: hạn muối nước, lợi tiểu khi quá tải, kiểm soát huyết áp."
    ],
    summary:
      "Hội chứng viêm cầu thận sau viêm họng, nước tiểu màu cola, tăng huyết áp, C3 giảm và ASO tăng gợi ý PSGN.",
    pearls: {
      "Phân biệt": "Protein niệu thường không nặng như hội chứng thận hư.",
      "Theo dõi": "C3 thường trở về bình thường sau vài tuần; nếu kéo dài cần nghĩ chẩn đoán khác."
    }
  },
  {
    id: 5,
    title: "Sốt kéo dài và tiếng thổi mới",
    diagnosis: "Viêm nội tâm mạc nhiễm khuẩn",
    aliases: ["viem noi tam mac nhiem khuan", "infective endocarditis", "endocarditis"],
    clues: [
      "Nam 29 tuổi sốt nhẹ kéo dài 2 tuần, mệt mỏi, sụt cân và vã mồ hôi đêm.",
      "Bệnh nhân có tiền sử tiêm chích ma túy, gần đây đau lưng âm ỉ.",
      "Khám thấy tiếng thổi tâm thu mới ở bờ trái xương ức và vài nốt xuất huyết dưới móng.",
      "Cấy máu 2 mẫu mọc Staphylococcus aureus.",
      "Siêu âm tim qua thành ngực gợi ý sùi trên van ba lá.",
      "Cần kháng sinh tĩnh mạch kéo dài sau khi lấy cấy máu, đánh giá biến chứng và chỉ định ngoại khoa."
    ],
    summary:
      "Sốt kéo dài, yếu tố nguy cơ tiêm chích, cấy máu dương tính và sùi van tim phù hợp viêm nội tâm mạc nhiễm khuẩn.",
    pearls: {
      "Nguyên tắc": "Lấy nhiều mẫu cấy máu trước kháng sinh nếu người bệnh ổn định.",
      "Van ba lá": "Hay gặp hơn ở người tiêm chích, có thể gây thuyên tắc phổi nhiễm khuẩn."
    }
  },
  {
    id: 6,
    title: "Khát nhiều, thở nhanh và đau bụng",
    diagnosis: "Nhiễm toan ceton đái tháo đường",
    aliases: ["nhiem toan ceton dai thao duong", "dka", "diabetic ketoacidosis"],
    clues: [
      "Nữ 18 tuổi khát nhiều, tiểu nhiều, sụt 5 kg trong một tháng và mệt lả.",
      "Bệnh nhân đau bụng, nôn, thở sâu nhanh, hơi thở có mùi trái cây.",
      "Đường huyết mao mạch 32 mmol/L, mạch nhanh, da niêm khô.",
      "Khí máu: pH 7,12, HCO3- 8 mmol/L, khoảng trống anion tăng.",
      "Cetone máu dương tính mạnh, kali máu ban đầu 5,4 mmol/L.",
      "Điều trị gồm dịch truyền, insulin tĩnh mạch và theo dõi bù kali cẩn thận."
    ],
    summary:
      "Tăng đường huyết, toan chuyển hóa khoảng trống anion cao và cetone dương tính là bộ ba của DKA.",
    pearls: {
      "Kali": "Kali toàn cơ thể thường thiếu dù xét nghiệm ban đầu có thể tăng.",
      "Sai lầm hay gặp": "Bắt đầu insulin khi kali quá thấp có thể gây loạn nhịp nguy hiểm."
    }
  },
  {
    id: 7,
    title: "Ho ra máu và tổn thương thận",
    diagnosis: "Hội chứng Goodpasture",
    aliases: ["hoi chung goodpasture", "benh khang mang day cau than", "anti gbm disease"],
    clues: [
      "Nam 24 tuổi ho ra máu, khó thở tăng dần và mệt nhiều trong một tuần.",
      "Nước tiểu sẫm màu, phù nhẹ, huyết áp tăng.",
      "X-quang ngực có đám mờ hai phế trường gợi ý xuất huyết phế nang.",
      "Nước tiểu có trụ hồng cầu, creatinin tăng nhanh.",
      "Kháng thể anti-GBM dương tính; sinh thiết thận nhuộm miễn dịch dạng đường thẳng dọc màng đáy.",
      "Điều trị thường phối hợp thay huyết tương, corticosteroid và cyclophosphamide."
    ],
    summary:
      "Xuất huyết phế nang kèm viêm cầu thận tiến triển nhanh và anti-GBM dương tính là hội chứng Goodpasture.",
    pearls: {
      "Hình ảnh miễn dịch": "Lắng đọng IgG dạng đường thẳng giúp phân biệt với lupus hoặc IgA.",
      "Cấp cứu": "Điều trị sớm quyết định khả năng bảo tồn chức năng thận."
    }
  },
  {
    id: 8,
    title: "Sốt hậu sản và đau hạ vị",
    diagnosis: "Viêm nội mạc tử cung hậu sản",
    aliases: ["viem noi mac tu cung hau san", "postpartum endometritis", "endometritis"],
    clues: [
      "Sản phụ 27 tuổi sốt 38,8 độ C vào ngày thứ 3 sau sinh mổ.",
      "Bệnh nhân đau hạ vị, sản dịch hôi, tử cung co hồi chậm và ấn đau.",
      "Không đau vú, không tiểu buốt, vết mổ khô.",
      "Bạch cầu tăng, CRP tăng; cấy sản dịch có thể đa vi khuẩn.",
      "Yếu tố nguy cơ gồm sinh mổ, chuyển dạ kéo dài, vỡ ối lâu và nhiều lần thăm khám âm đạo.",
      "Kháng sinh phổ rộng đường tĩnh mạch như clindamycin phối hợp gentamicin thường được dùng."
    ],
    summary:
      "Sốt hậu sản sau sinh mổ, đau tử cung và sản dịch hôi phù hợp viêm nội mạc tử cung hậu sản.",
    pearls: {
      "Nguồn nhiễm": "Thường đa vi khuẩn, gồm kỵ khí đường sinh dục.",
      "Phân biệt": "Luôn rà soát thêm viêm vú, nhiễm trùng tiểu và nhiễm trùng vết mổ."
    }
  },
  {
    id: 9,
    title: "Đau đầu sét đánh",
    diagnosis: "Xuất huyết dưới nhện",
    aliases: ["xuat huyet duoi nhen", "subarachnoid hemorrhage", "sah"],
    clues: [
      "Nữ 52 tuổi đau đầu dữ dội đột ngột, mô tả là nặng nhất đời.",
      "Bệnh nhân nôn, sợ ánh sáng và cứng gáy nhẹ.",
      "Huyết áp 180/100 mmHg, không sốt, không tiền sử migraine tương tự.",
      "CT sọ không cản quang trong vài giờ đầu thấy máu ở rãnh cuộn não và bể nền.",
      "CTA phát hiện phình động mạch thông trước.",
      "Xử trí gồm hồi sức thần kinh, nimodipine, kiểm soát huyết áp và can thiệp kẹp hoặc coil túi phình."
    ],
    summary:
      "Đau đầu sét đánh kèm dấu màng não và máu trong khoang dưới nhện trên CT gợi ý xuất huyết dưới nhện.",
    pearls: {
      "Khi CT âm tính": "Nếu nghi ngờ cao, chọc dò dịch não tủy tìm hồng cầu/xanthochromia theo bối cảnh.",
      "Biến chứng": "Co thắt mạch não muộn là lý do dùng nimodipine."
    }
  },
  {
    id: 10,
    title: "Tiêu chảy sau kháng sinh",
    diagnosis: "Viêm đại tràng do Clostridioides difficile",
    aliases: ["viem dai trang do clostridioides difficile", "clostridium difficile", "c difficile", "c diff"],
    clues: [
      "Nam 68 tuổi tiêu chảy nước 8 lần/ngày sau điều trị ceftriaxone vì viêm phổi.",
      "Bệnh nhân đau quặn bụng, sốt nhẹ và mệt, không đi ngoài máu rõ.",
      "Khám bụng chướng nhẹ, ấn đau lan tỏa; bạch cầu 18 G/L.",
      "Xét nghiệm phân phát hiện độc tố C. difficile.",
      "Nội soi trong ca nặng có thể thấy giả mạc vàng trắng bám niêm mạc đại tràng.",
      "Điều trị đầu tay thường là vancomycin uống hoặc fidaxomicin, đồng thời ngừng kháng sinh gây bệnh nếu có thể."
    ],
    summary:
      "Tiêu chảy sau kháng sinh, bạch cầu tăng và độc tố C. difficile dương tính gợi ý viêm đại tràng do C. difficile.",
    pearls: {
      "Đường dùng": "Vancomycin phải dùng đường uống để tác dụng tại lòng ruột trong bệnh này.",
      "Kiểm soát lây nhiễm": "Rửa tay bằng xà phòng và nước vì bào tử kháng cồn."
    }
  }
];

const MAX_ATTEMPTS = 6;
const STORAGE_KEY = "chanle-stats-v1";
const STATE_KEY = "chanle-daily-state-v1";

const DIFFERENTIALS = {
  1: [
    ["Sốt rét", "Cần hỏi vùng dịch tễ và lam máu/test nhanh; thường có cơn rét run theo chu kỳ."],
    ["Leptospirosis", "Hay đau bắp chân, vàng da, suy thận sau tiếp xúc nước bẩn."],
    ["Cúm", "Có triệu chứng hô hấp nổi bật hơn và không giải thích tốt giảm tiểu cầu kèm xuất huyết."]
  ],
  2: [
    ["Tràn khí màng phổi", "Đau ngực và khó thở đột ngột nhưng thường giảm rì rào phế nang một bên."],
    ["Hội chứng vành cấp", "Cần ECG/troponin, nhưng đau kiểu màng phổi và nguy cơ huyết khối hướng PE hơn."],
    ["Viêm phổi", "Thường sốt, ho, ran phổi hoặc tổn thương nhu mô trên X-quang."]
  ],
  3: [
    ["Loét dạ dày tá tràng thủng", "Đau dữ dội và phản ứng thành bụng rõ; X-quang có thể thấy hơi tự do."],
    ["Nhồi máu cơ tim thành dưới", "Có thể đau thượng vị nên cần ECG/troponin ở người nguy cơ."],
    ["Viêm túi mật cấp", "Đau hạ sườn phải, Murphy dương tính và siêu âm túi mật gợi ý hơn."]
  ],
  4: [
    ["Bệnh thận IgA", "Thường tiểu máu đồng thời hoặc rất gần đợt nhiễm hô hấp, C3 thường bình thường."],
    ["Hội chứng thận hư", "Phù và protein niệu nặng, ít tiểu máu/trụ hồng cầu hơn."],
    ["Lupus nephritis", "Nghĩ khi có biểu hiện hệ thống, ANA/anti-dsDNA dương tính hoặc bổ thể giảm kéo dài."]
  ],
  5: [
    ["Sốt kéo dài do lao", "Có sụt cân, vã mồ hôi nhưng không giải thích tốt cấy máu và sùi van tim."],
    ["Áp xe ngoài màng cứng", "Đau lưng ở người tiêm chích là cảnh báo, có thể là biến chứng đi kèm."],
    ["Sốt thấp khớp", "Có viêm tim sau viêm họng liên cầu nhưng cấy máu thường âm tính."]
  ],
  6: [
    ["Tăng áp lực thẩm thấu do đái tháo đường", "Đường huyết rất cao, mất nước nặng nhưng cetone và toan thường nhẹ hơn."],
    ["Nhiễm toan lactic", "Khoảng trống anion tăng nhưng không có cetone máu mạnh."],
    ["Viêm dạ dày ruột cấp", "Có nôn đau bụng nhưng không giải thích thở Kussmaul và tăng đường huyết nặng."]
  ],
  7: [
    ["Viêm mạch ANCA", "Cũng gây phổi-thận, nhưng anti-GBM âm tính và miễn dịch huỳnh quang không dạng đường thẳng."],
    ["Lupus ban đỏ hệ thống", "Có thể viêm cầu thận và xuất huyết phổi, cần ANA/anti-dsDNA và bổ thể."],
    ["Viêm phổi nặng", "Ho máu và khó thở nhưng không giải thích tốt trụ hồng cầu/creatinin tăng nhanh."]
  ],
  8: [
    ["Nhiễm trùng tiểu hậu sản", "Sốt kèm tiểu buốt, cấy nước tiểu dương tính; tử cung thường không ấn đau."],
    ["Viêm vú", "Đau, đỏ, căng vú khu trú, không có sản dịch hôi."],
    ["Nhiễm trùng vết mổ", "Đau, đỏ, chảy dịch tại vết mổ thay vì đau tử cung và sản dịch hôi."]
  ],
  9: [
    ["Migraine", "Có thể đau dữ dội nhưng thường không khởi phát sét đánh và không có máu dưới nhện."],
    ["Viêm màng não", "Sốt và cứng gáy nổi bật hơn; dịch não tủy có bạch cầu tăng."],
    ["Bóc tách động mạch cổ", "Đau đầu/cổ cấp tính, có thể kèm Horner hoặc dấu thần kinh khu trú."]
  ],
  10: [
    ["Tiêu chảy do virus", "Thường tự giới hạn và không liên quan mạnh với kháng sinh gần đây."],
    ["Bệnh ruột viêm", "Có thể tiêu chảy kéo dài hoặc máu, nhưng độc tố C. difficile dương tính định hướng rõ."],
    ["Thiếu máu đại tràng", "Đau bụng và tiêu máu ở người nguy cơ mạch máu, không phải tiêu chảy nước sau kháng sinh điển hình."]
  ]
};

let mode = "daily";
let currentCase;
let revealed = 1;
let attempts = [];
let finished = false;

const $ = (selector) => document.querySelector(selector);

const elements = {
  caseNumber: $("#case-number"),
  modeLabel: $("#mode-label"),
  caseTitle: $("#case-title"),
  attemptsLeft: $("#attempts-left"),
  clueList: $("#clue-list"),
  form: $("#guess-form"),
  input: $("#guess-input"),
  diagnosisList: $("#diagnosis-list"),
  feedback: $("#feedback"),
  reveal: $("#reveal-button"),
  next: $("#new-case-button"),
  history: $("#history"),
  result: $("#result"),
  answer: $("#answer"),
  summary: $("#summary"),
  differentials: $("#differentials"),
  pearls: $("#pearls"),
  played: $("#played"),
  solved: $("#solved"),
  streak: $("#streak"),
  copyShare: $("#copy-share"),
  copyAnki: $("#copy-anki")
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyIndex() {
  const now = new Date();
  const start = new Date(2026, 0, 1);
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((localMidnight - start) / 86400000) % CASES.length;
}

function getStats() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"played":0,"solved":0,"streak":0}');
}

function setStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function updateStatsView() {
  const stats = getStats();
  elements.played.textContent = stats.played;
  elements.solved.textContent = stats.solved;
  elements.streak.textContent = stats.streak;
}

function saveDailyState() {
  if (mode !== "daily") return;
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      date: todayKey(),
      caseId: currentCase.id,
      revealed,
      attempts,
      finished
    })
  );
}

function loadDailyState(caseData) {
  const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
  if (!saved || saved.date !== todayKey() || saved.caseId !== caseData.id) return false;
  revealed = saved.revealed;
  attempts = saved.attempts || [];
  finished = Boolean(saved.finished);
  return true;
}

function isCorrect(guess) {
  const accepted = [currentCase.diagnosis, ...currentCase.aliases].map(normalize);
  return accepted.includes(normalize(guess));
}

function setCase(caseData, restore = false) {
  currentCase = caseData;
  revealed = 1;
  attempts = [];
  finished = false;

  if (restore) loadDailyState(caseData);

  elements.caseNumber.textContent = `Ca #${String(caseData.id).padStart(3, "0")}`;
  elements.modeLabel.textContent = mode === "daily" ? "Ca hằng ngày" : "Luyện tập";
  elements.caseTitle.textContent = caseData.title;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.input.value = "";
  elements.input.disabled = finished;
  render();
}

function render() {
  elements.attemptsLeft.textContent = Math.max(0, MAX_ATTEMPTS - attempts.length);
  elements.clueList.innerHTML = currentCase.clues
    .map((clue, index) => {
      const visible = index < revealed;
      return `<li class="clue ${visible ? "" : "locked"}">${visible ? clue : "Dữ kiện đang khóa"}</li>`;
    })
    .join("");

  elements.history.innerHTML = attempts.length
    ? attempts
        .map(
          (item, index) =>
            `<li><span>${index + 1}. ${item.text}</span><strong class="${item.correct ? "hit" : "miss"}">${item.correct ? "Đúng" : "Sai"}</strong></li>`
        )
        .join("")
    : "<li><span>Chưa có lượt đoán</span><strong>-</strong></li>";

  elements.reveal.disabled = finished || revealed >= currentCase.clues.length;
  elements.form.querySelector("button").disabled = finished;
  elements.input.disabled = finished;

  if (finished) {
    showResult();
  } else {
    elements.result.classList.add("hidden");
  }

  updateStatsView();
  saveDailyState();
}

function finish(solved) {
  finished = true;
  const stats = getStats();
  const alreadyRecorded =
    mode === "daily" &&
    JSON.parse(localStorage.getItem(STATE_KEY) || "null")?.date === todayKey() &&
    JSON.parse(localStorage.getItem(STATE_KEY) || "null")?.finished;

  if (!alreadyRecorded || mode === "practice") {
    stats.played += 1;
    stats.solved += solved ? 1 : 0;
    stats.streak = solved ? stats.streak + 1 : 0;
    setStats(stats);
  }

  elements.feedback.textContent = solved
    ? "Chính xác. Mở phần ôn tập để chốt lại điểm mấu chốt."
    : "Hết lượt. Xem đáp án và tự hỏi dữ kiện nào nên làm mình đổi hướng.";
  elements.feedback.className = `feedback ${solved ? "good" : "bad"}`;
  render();
}

function showResult() {
  elements.result.classList.remove("hidden");
  elements.answer.textContent = currentCase.diagnosis;
  elements.summary.textContent = currentCase.summary;
  elements.differentials.innerHTML = (DIFFERENTIALS[currentCase.id] || [])
    .map(([name, note]) => `<li><strong>${name}</strong><span>${note}</span></li>`)
    .join("");
  elements.pearls.innerHTML = Object.entries(currentCase.pearls)
    .map(([term, detail]) => `<div><dt>${term}</dt><dd>${detail}</dd></div>`)
    .join("");
}

function submitGuess(event) {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text || finished) return;

  const correct = isCorrect(text);
  attempts.push({ text, correct });
  elements.input.value = "";

  if (correct) {
    finish(true);
    return;
  }

  if (attempts.length >= MAX_ATTEMPTS) {
    revealed = currentCase.clues.length;
    finish(false);
    return;
  }

  revealed = Math.min(currentCase.clues.length, revealed + 1);
  elements.feedback.textContent = "Chưa đúng. Dữ kiện tiếp theo đã được mở.";
  elements.feedback.className = "feedback bad";
  render();
}

function revealClue() {
  if (finished) return;
  revealed = Math.min(currentCase.clues.length, revealed + 1);
  elements.feedback.textContent = "Đã mở thêm một dữ kiện. Bạn vẫn còn lượt đoán.";
  elements.feedback.className = "feedback";
  render();
}

function randomPracticeCase() {
  const pool = CASES.filter((item) => item.id !== currentCase?.id);
  return pool[Math.floor(Math.random() * pool.length)] || CASES[0];
}

async function copyText(text, button) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  const original = button.textContent;
  button.textContent = "Đã sao chép";
  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function shareText() {
  const solvedAt = attempts.findIndex((item) => item.correct) + 1;
  const marks = attempts
    .map((item) => (item.correct ? "🟩" : "⬜"))
    .concat(Array(Math.max(0, MAX_ATTEMPTS - attempts.length)).fill("⬛"))
    .join("");
  return `chanle #${String(currentCase.id).padStart(3, "0")} ${solvedAt || "X"}/${MAX_ATTEMPTS}\n${marks}\nhttps://souhhcong.github.io/`;
}

function ankiText() {
  return [
    `Mặt trước: ${currentCase.clues[0]} Chẩn đoán có khả năng nhất là gì?`,
    `Mặt sau: ${currentCase.diagnosis}. ${currentCase.summary}`
  ].join("\n");
}

function switchMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  setCase(mode === "daily" ? CASES[dailyIndex()] : randomPracticeCase(), mode === "daily");
}

function hydrateDiagnosisList() {
  const names = new Set();
  CASES.forEach((item) => {
    names.add(item.diagnosis);
    item.aliases.forEach((alias) => names.add(alias));
  });
  elements.diagnosisList.innerHTML = [...names]
    .sort((a, b) => a.localeCompare(b, "vi"))
    .map((name) => `<option value="${name}"></option>`)
    .join("");
}

function init() {
  hydrateDiagnosisList();
  updateStatsView();
  setCase(CASES[dailyIndex()], true);

  elements.form.addEventListener("submit", submitGuess);
  elements.reveal.addEventListener("click", revealClue);
  elements.next.addEventListener("click", () => {
    if (mode === "daily") switchMode("practice");
    else setCase(randomPracticeCase());
  });
  elements.copyShare.addEventListener("click", () => copyText(shareText(), elements.copyShare));
  elements.copyAnki.addEventListener("click", () => copyText(ankiText(), elements.copyAnki));

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
  });
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.open}`).showModal());
  });
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.close}`).close());
  });
}

init();
