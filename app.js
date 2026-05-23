const CASES_CSV_URL = "cases.csv";
const MAX_CLUES = 6;
const MAX_ATTEMPTS = MAX_CLUES;
const STORAGE_KEY = "chanle-stats-v1";
const STATE_KEY = "chanle-daily-state-v1";

let CASES = [];

let mode = "daily";
let currentCase;
let revealed = 1;
let attempts = [];
let finished = false;

const $ = (selector) => document.querySelector(selector);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        value += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows.filter((items) => items.some(Boolean));
  return records.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, items[index] || ""]))
  );
}

function splitList(value) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pairList(row, prefix, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const name = row[`${prefix}${number}_name`] || row[`${prefix}${number}_title`];
    const note = row[`${prefix}${number}_note`] || row[`${prefix}${number}_text`];
    return name && note ? [name, note] : null;
  }).filter(Boolean);
}

function rowToCase(row) {
  const clues = Array.from({ length: MAX_CLUES }, (_, index) => row[`clue${index + 1}`]);
  const pearls = Object.fromEntries(pairList(row, "pearl", 2));

  return {
    id: Number(row.id),
    title: row.title,
    icdCode: row.icd_code,
    diagnosis: row.diagnosis,
    aliases: splitList(row.aliases),
    clues,
    summary: row.summary,
    pearls,
    differentials: pairList(row, "differential", 3)
  };
}

async function loadCases() {
  const response = await fetch(CASES_CSV_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${CASES_CSV_URL}: ${response.status}`);
  }

  CASES = parseCsv(await response.text()).map(rowToCase);
}

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
  differentialBlock: $("#differential-block"),
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
  elements.answer.textContent = currentCase.icdCode
    ? `${currentCase.icdCode} - ${currentCase.diagnosis}`
    : currentCase.diagnosis;
  elements.summary.textContent = currentCase.summary;
  const differentials = currentCase.differentials || [];
  elements.differentialBlock.classList.toggle("hidden", differentials.length === 0);
  elements.differentials.innerHTML = differentials
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

async function init() {
  try {
    await loadCases();
  } catch (error) {
    console.error(error);
    elements.caseTitle.textContent = "Không tải được cases.csv";
    elements.feedback.textContent =
      "Không thể tải dữ liệu ca bệnh. Khi chạy cục bộ, hãy dùng một static server thay vì mở file trực tiếp.";
    elements.feedback.className = "feedback bad";
    return;
  }

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
