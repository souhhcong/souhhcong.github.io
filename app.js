const CASES_CSV_URL = "cases.csv";
const REVISION_URL = "revision-data.json";
const DIFFICULTY_URL = "case-difficulty.json";
const MAX_CLUES = 6;
const MAX_ATTEMPTS = MAX_CLUES;
const STORAGE_KEY = "chanle-stats-v1";
const STATE_KEY = "chanle-daily-state-v4";
const PREVIOUS_STATE_KEY = "chanle-daily-state-v3";
const LEGACY_STATE_KEY = "chanle-daily-state-v2";
const GAME_KEY = "chanle-game-type-v1";
const CATEGORY_KEY = "chanle-category-v1";
// Treatment mode is paused; its optional data stays in revision-data.json.
const GAME_LABELS = { clinical: "Dữ kiện lâm sàng" };
const DIFFICULTY_KEY = "chanle-difficulty-v1";
const DIFFICULTY_LABELS = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó"
};
// Relative sampling weights for authored familiarity scores 1 (core) to 5 (rare).
const DIFFICULTY_WEIGHTS = {
  easy: [16, 8, 3, 1, 0.25],
  medium: [1, 4, 10, 4, 1],
  hard: [0.25, 1, 3, 8, 16]
};
const DIFFICULTY_DESCRIPTIONS = {
  easy: "Ưu tiên kiến thức thường gặp",
  medium: "Ưu tiên kiến thức mức trung bình",
  hard: "Ưu tiên bệnh hiếm và kiến thức chuyên sâu"
};

let CASES = [];
let CATEGORIES = [];
const practiceHistory = new Map();

let mode = "daily";
let difficulty = localStorage.getItem(DIFFICULTY_KEY) || "easy";
if (!Object.hasOwn(DIFFICULTY_LABELS, difficulty)) difficulty = "easy";
let gameType = localStorage.getItem(GAME_KEY) || "clinical";
if (!Object.hasOwn(GAME_LABELS, gameType)) gameType = "clinical";
let practiceCategory = localStorage.getItem(CATEGORY_KEY) || "all";
let currentCase;
let revealed = 1;
let attempts = [];
let finished = false;
let gaveUp = false;

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

  if (quoted) throw new Error("Unclosed quote in cases.csv");
  const [headers, ...records] = rows.filter((items) => items.some(Boolean));
  if (!headers || new Set(headers).size !== headers.length) {
    throw new Error("Missing or duplicate CSV headers");
  }
  if (records.some((items) => items.length !== headers.length)) {
    throw new Error("A case has the wrong number of CSV fields");
  }
  return records.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, items[index] || ""]))
  );
}

function validateCaseRows(rows) {
  if (!rows.length) throw new Error("The case bank is empty");
  const ids = new Set();
  const diagnoses = new Map();
  const answers = new Map();
  const required = ["id", "title", "diagnosis", "icd_code", "icd_label", "summary",
    ...Array.from({ length: MAX_CLUES }, (_, index) => `clue${index + 1}`)];
  rows.forEach((row) => {
    required.forEach((field) => {
      if (!row[field]?.trim()) throw new Error(`Case ${row.id || "?"}: missing ${field}`);
    });
    if (!/^\d+$/.test(row.id) || Number(row.id) < 1 || ids.has(Number(row.id))) {
      throw new Error(`Invalid or duplicate case ID: ${row.id}`);
    }
    ids.add(Number(row.id));
    const diagnosis = normalize(row.diagnosis);
    if (!diagnosis) throw new Error(`Case ${row.id}: empty normalized diagnosis`);
    if (diagnoses.has(diagnosis)) {
      throw new Error(`Duplicate diagnosis in cases ${diagnoses.get(diagnosis)} and ${row.id}: ${row.diagnosis}`);
    }
    diagnoses.set(diagnosis, row.id);
    if (!/^[A-Z]\d{2}(?:\.\d{1,2})?$/.test(row.icd_code)) {
      throw new Error(`Case ${row.id}: invalid ICD code format`);
    }
    for (const prefix of ["pearl1", "pearl2", "differential1", "differential2", "differential3"]) {
      const isPearl = prefix.startsWith("pearl");
      const name = row[`${prefix}_${isPearl ? "title" : "name"}`]?.trim();
      const note = row[`${prefix}_${isPearl ? "text" : "note"}`]?.trim();
      if (Boolean(name) !== Boolean(note)) throw new Error(`Case ${row.id}: incomplete ${prefix}`);
    }
    [row.diagnosis, row.icd_code, ...splitList(row.aliases)].forEach((answer) => {
      const key = normalize(answer);
      if (!key) throw new Error(`Case ${row.id}: empty normalized answer`);
      const previous = answers.get(key);
      if (previous && previous.id !== row.id) {
        throw new Error(`Answer shared by cases ${previous.id} and ${row.id}: ${answer}`);
      }
      answers.set(key, { id: row.id });
    });
  });
}

function splitList(value = "") {
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
    icdLabel: row.icd_label,
    diagnosis: row.diagnosis,
    aliases: splitList(row.aliases),
    clues,
    summary: row.summary,
    pearls,
    differentials: pairList(row, "differential", 3)
  };
}

function validateRevisionData(data, rows) {
  const fail = (message) => { throw new Error(`Revision data: ${message}`); };
  const onlyFields = (value, fields) => value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).every((key) => fields.includes(key));
  if (!onlyFields(data, ["categories", "cases"])) fail("unknown public fields");
  if (!Array.isArray(data?.categories) || !data.categories.length || !Array.isArray(data?.cases)) fail("missing categories or cases");
  const categories = new Set();
  for (const category of data.categories) {
    if (!onlyFields(category, ["id", "label"])) fail("unknown public category fields");
    if (!/^[a-z][a-z0-9_]*$/.test(category?.id) || category.id === "all" || categories.has(category.id) ||
      typeof category.label !== "string" || !category.label.trim()) fail("invalid or duplicate category");
    categories.add(category.id);
  }
  const known = new Set(rows.map((row) => Number(row.id)));
  const seen = new Set();
  const used = new Set();
  for (const item of data.cases) {
    if (!onlyFields(item, ["caseId", "categoryIds", "treatmentClues", "treatmentExplanation"])) fail("unknown public case fields");
    if (!known.has(item?.caseId) || seen.has(item.caseId)) fail("unknown or duplicate case ID");
    seen.add(item.caseId);
    if (!Array.isArray(item.categoryIds) || !item.categoryIds.length || new Set(item.categoryIds).size !== item.categoryIds.length ||
      item.categoryIds.some((id) => !categories.has(id))) fail(`invalid categories for case ${item.caseId}`);
    item.categoryIds.forEach((id) => used.add(id));
    // Treatment content is optional while treatment mode is paused, but must be complete when present.
    if (item.treatmentClues === undefined && item.treatmentExplanation === undefined) continue;
    if (!Array.isArray(item.treatmentClues) || item.treatmentClues.length !== MAX_CLUES ||
      item.treatmentClues.some((clue) => typeof clue !== "string" || !clue.trim()) ||
      typeof item.treatmentExplanation !== "string" || !item.treatmentExplanation.trim()) fail(`incomplete treatment for case ${item.caseId}`);
    const clinical = rows.find((row) => Number(row.id) === item.caseId);
    const answerLabels = [clinical.diagnosis, ...splitList(clinical.aliases)]
      .map(normalize);
    answerLabels.push(normalize(clinical.icd_code));
    if (item.treatmentClues.some((clue) => answerLabels.some((label) => ` ${normalize(clue)} `.includes(` ${label} `)))) {
      fail(`treatment clue names an accepted answer in case ${item.caseId}`);
    }
  }
  if (seen.size !== known.size || used.size !== categories.size) fail("incomplete case coverage or empty category");
}

function applyRevisionData(data, rows) {
  validateRevisionData(data, rows);
  CATEGORIES = data.categories;
  const records = new Map(data.cases.map((item) => [item.caseId, item]));
  CASES = rows.map((row) => {
    const {categoryIds, treatmentClues, treatmentExplanation} = records.get(Number(row.id));
    return {...rowToCase(row), categoryIds, treatmentClues, treatmentExplanation};
  });
  if (!CATEGORIES.some((category) => category.id === practiceCategory)) practiceCategory = "all";
}

function validateDifficultyData(data, rows) {
  const fail = (message) => { throw new Error(`Case difficulty: ${message}`); };
  const only = (item, keys) => item && typeof item === "object" && !Array.isArray(item) &&
    Object.keys(item).every(key => keys.includes(key));
  if (!only(data, ["version", "cases"]) || data.version !== 1 || !Array.isArray(data.cases)) fail("invalid schema");
  const ids = new Set(rows.map(row => Number(row.id)));
  const seen = new Set();
  for (const item of data.cases) {
    if (!only(item, ["caseId", "hardness"]) || !ids.has(item.caseId) || seen.has(item.caseId)) fail("unknown, duplicate or invalid case");
    if (!Number.isInteger(item.hardness) || item.hardness < 1 || item.hardness > 5) fail(`hardness must be an integer from 1 to 5 in case ${item.caseId}`);
    seen.add(item.caseId);
  }
  if (seen.size !== ids.size) fail("incomplete case coverage");
}

function applyDifficultyData(data, rows) {
  validateDifficultyData(data, rows);
  const scores = new Map(data.cases.map(item => [item.caseId, item.hardness]));
  CASES = CASES.map(item => ({...item, hardness:scores.get(item.id)}));
}

async function loadCases() {
  const [response, revision, ratings] = await Promise.all([CASES_CSV_URL, REVISION_URL, DIFFICULTY_URL].map((url) => fetch(url, { cache: "no-store" })));
  if (!response.ok || !revision.ok || !ratings.ok) throw new Error("Could not load the complete case banks and difficulty ratings");
  const rows = parseCsv(await response.text());
  validateCaseRows(rows);
  applyRevisionData(await revision.json(), rows);
  applyDifficultyData(await ratings.json(), rows);
}

const elements = {
  app: $("#app"),
  clueCount: $("#clue-count"),
  clueProgress: $("#clue-progress"),
  clueSteps: $("#clue-steps"),
  attemptTrack: $("#attempt-track"),
  historyCount: $("#history-count"),
  accuracy: $("#accuracy"),
  playTip: $("#play-tip"),
  roundStatus: $("#round-status"),
  reviewNext: $("#review-next"),
  caseNumber: $("#case-number"),
  modeLabel: $("#mode-label"),
  caseTitle: $("#case-title"),
  caseKicker: $("#case-kicker"),
  category: $("#category-select"),
  categoryNote: $("#category-note"),
  difficulty: $("#difficulty-select"),
  attemptsLeft: $("#attempts-left"),
  clueList: $("#clue-list"),
  form: $("#guess-form"),
  input: $("#guess-input"),
  suggestions: $("#suggestions"),
  feedback: $("#feedback"),
  reveal: $("#reveal-button"),
  giveUp: $("#give-up-button"),
  next: $("#new-case-button"),
  history: $("#history"),
  result: $("#result"),
  resultCard: $("#result-card"),
  answer: $("#answer"),
  icdLabel: $("#icd-label"),
  summary: $("#summary"),
  played: $("#played"),
  solved: $("#solved"),
  streak: $("#streak"),
  copyShare: $("#copy-share"),
  copyAnki: $("#copy-anki")
};

// Only a newly opened clue (from "Mở dữ kiện" or a wrong guess) plays the reveal animation; loads and resets do not.
let animateReveal = false;

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

function dailyCase() {
  // Pin each started difficulty independently through bank or rating changes.
  const rounds = dailyStore().rounds;
  const pinned = {};
  for (const type of Object.keys(GAME_LABELS)) {
    pinned[type] = {};
    for (const level of Object.keys(DIFFICULTY_LABELS)) {
      const saved = rounds[type]?.[level];
      const existing = CASES.find(item => item.id === saved?.caseId);
      if (existing && validRound(saved, existing)) pinned[type][level] = existing;
    }
  }
  return dailySchedule(todayKey(), pinned)[gameType][difficulty];
}

function caseWeight(item, level = difficulty) {
  return DIFFICULTY_WEIGHTS[level][item.hardness - 1];
}

function weightedCase(pool, level = difficulty, random = Math.random) {
  if (!pool.length) throw new Error("Cannot sample an empty case pool");
  let target = random() * pool.reduce((sum, item) => sum + caseWeight(item, level), 0);
  for (const item of pool) {
    target -= caseWeight(item, level);
    if (target < 0) return item;
  }
  return pool.at(-1);
}

function hashUnit(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return ((hash >>> 0) + 1) / 4294967297;
}

function dailySchedule(date, pinned = {}) {
  const reserved = new Set(Object.values(pinned).flatMap(levels => Object.values(levels)).map(item => item.id));
  let available = CASES.filter(item => !reserved.has(item.id));
  const result = {};
  for (const type of Object.keys(GAME_LABELS)) {
    result[type] = {};
    for (const level of Object.keys(DIFFICULTY_LABELS)) {
      let selected = pinned[type]?.[level];
      if (!selected) {
        // Exponential race: deterministic weighted sampling, independent of row order.
        let best = Infinity;
        for (const item of available.length ? available : CASES) {
          const score = -Math.log(hashUnit(`${date}:${type}:${level}:${item.id}`)) / caseWeight(item, level);
          if (score < best || (score === best && item.id < selected.id)) { best = score; selected = item; }
        }
        available = available.filter(item => item.id !== selected.id);
      }
      result[type][level] = selected;
    }
  }
  return result;
}

function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

function getStats() {
  const stats = readStored(STORAGE_KEY, {});
  return Object.fromEntries(["played", "solved", "streak"].map((key) => [key,
    Number.isInteger(stats?.[key]) && stats[key] >= 0 ? stats[key] : 0]));
}

function setStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function updateStatsView() {
  const stats = getStats();
  elements.played.textContent = stats.played;
  elements.solved.textContent = stats.solved;
  elements.streak.textContent = stats.streak;
  elements.accuracy.textContent = stats.played ? `${Math.round(stats.solved / stats.played * 100)}%` : "—";
}

function validRound(saved, caseData) {
  return saved && saved.caseId === caseData.id && Number.isInteger(saved.revealed) && saved.revealed >= 1 &&
    saved.revealed <= MAX_CLUES && Array.isArray(saved.attempts) && saved.attempts.length <= MAX_ATTEMPTS &&
    saved.attempts.every((attempt) => typeof attempt?.text === "string" && typeof attempt.correct === "boolean" &&
      (attempt.kind === undefined || attempt.kind === "reveal") && !(attempt.kind === "reveal" && attempt.correct)) &&
    (saved.gaveUp === undefined || typeof saved.gaveUp === "boolean") &&
    !(saved.gaveUp && saved.attempts.some(a => a.correct)) &&
    typeof saved.finished === "boolean" && saved.finished === (saved.gaveUp === true || saved.attempts.some((a) => a.correct) || saved.attempts.length === MAX_ATTEMPTS);
}

function dailyStore() {
  const stored = readStored(STATE_KEY, null);
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (stored?.date === todayKey() && object(stored.rounds) && object(stored.recorded) &&
    Object.keys(GAME_LABELS).every(type => (stored.rounds[type] === undefined || object(stored.rounds[type])) &&
      (stored.recorded[type] === undefined || object(stored.recorded[type])))) return stored;
  const result = {date:todayKey(), rounds:{}, recorded:{}};
  // A v4 record, including one from another day, must never reimport old saves.
  if (stored) return result;
  const previous = readStored(PREVIOUS_STATE_KEY, null);
  if (previous) {
    if (previous.date !== todayKey() || !object(previous.rounds) || !object(previous.recorded)) return result;
    for (const type of Object.keys(GAME_LABELS)) {
      result.rounds[type] = {};
      result.recorded[type] = {};
      for (const level of Object.keys(DIFFICULTY_LABELS)) {
        const saved = previous.rounds[type]?.[level];
        const item = CASES.find(item => item.id === saved?.caseId);
        if (item && validRound(saved, item)) result.rounds[type][level] = saved;
      }
      if (previous.recorded[type] === true) {
        const slots = Object.entries(result.rounds[type]);
        const completed = slots.filter(([, round]) => round.finished);
        for (const [level] of completed.length ? completed : slots) result.recorded[type][level] = true;
        if (!slots.length) for (const level of Object.keys(DIFFICULTY_LABELS)) result.recorded[type][level] = true;
      }
    }
    return result;
  }
  const legacy = readStored(LEGACY_STATE_KEY, null);
  const legacyCase = CASES.find((item) => item.id === legacy?.caseId);
  if (legacyCase && legacy?.date === todayKey() && Object.hasOwn(DIFFICULTY_LABELS, legacy.difficulty) && validRound(legacy, legacyCase)) {
    result.rounds.clinical = {[legacy.difficulty]:legacy};
    result.recorded.clinical = {[legacy.difficulty]:legacy.finished};
  }
  return result;
}

function saveDailyState() {
  if (mode !== "daily") return;
  const store = dailyStore();
  store.rounds[gameType] ??= {};
  store.rounds[gameType][difficulty] = {caseId:currentCase.id, revealed, attempts, finished, gaveUp};
  localStorage.setItem(STATE_KEY, JSON.stringify(store));
}

function loadDailyState(caseData) {
  const saved = dailyStore().rounds[gameType]?.[difficulty];
  if (!validRound(saved, caseData)) return false;
  revealed = saved.revealed;
  attempts = saved.attempts || [];
  finished = Boolean(saved.finished);
  gaveUp = saved.gaveUp === true;
  return true;
}

function isCorrect(guess) {
  const accepted = [currentCase.diagnosis, currentCase.icdCode, ...currentCase.aliases];
  const normalizedGuess = normalize(guess);
  return Boolean(normalizedGuess) && accepted.some((answer) => normalize(answer) === normalizedGuess);
}

function setCase(caseData, restore = false) {
  currentCase = caseData;
  animateReveal = false;
  revealed = 1;
  attempts = [];
  finished = false;
  gaveUp = false;

  if (restore) loadDailyState(caseData);
  if (finished) revealed = activeClues().length;

  elements.caseNumber.textContent = `Ca #${String(caseData.id).padStart(3, "0")}`;
  elements.input.setAttribute("role", "combobox");
  elements.input.placeholder = "Tên bệnh hoặc mã ICD";
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.input.value = "";
  elements.input.disabled = finished;
  render();
}

function activeClues() {
  return currentCase.clues;
}

function activeCategory() { return mode === "daily" ? "all" : practiceCategory; }
function categoryLabel(id = activeCategory()) {
  return CATEGORIES.find((category) => category.id === id)?.label || "Tất cả chuyên khoa";
}
function practicePool() {
  return practiceCategory === "all" ? CASES : CASES.filter((item) => item.categoryIds.includes(practiceCategory));
}
function syncControls() {
  elements.app.setAttribute("data-game-type", gameType);
  elements.category.value = activeCategory();
  elements.difficulty.value = difficulty;
  const summary = $("#settings-summary");
  if (summary) summary.textContent = [DIFFICULTY_LABELS[difficulty],
    mode === "practice" && practiceCategory !== "all" ? categoryLabel() : null].filter(Boolean).join(" · ");
  elements.categoryNote.textContent = mode === "daily" ? `Ca hằng ngày · ${DIFFICULTY_DESCRIPTIONS[difficulty]} · Tất cả chuyên khoa` :
    `${practicePool().length} bệnh cảnh · ${DIFFICULTY_DESCRIPTIONS[difficulty]}`;
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  hydrateDiagnosisList();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}

function render() {
  const justRevealed = animateReveal;
  animateReveal = false;
  elements.app.setAttribute("data-round", finished ? (attempts.some(item => item.correct) ? "solved" : "complete") : "active");
  elements.attemptsLeft.textContent = Math.max(0, MAX_ATTEMPTS - attempts.length);
  elements.clueCount.textContent = `${revealed} / ${MAX_CLUES}`;
  elements.clueProgress.value = revealed;
  elements.clueProgress.textContent = elements.clueCount.textContent;
  elements.clueSteps.innerHTML = Array.from({length:MAX_CLUES}, (_, index) =>
    `<span class="${index < revealed ? "is-open" : ""} ${index === revealed - 1 && !finished ? "is-current" : ""}"></span>`).join("");
  elements.historyCount.textContent = `${attempts.length} / ${MAX_ATTEMPTS}`;
  elements.attemptTrack.innerHTML = Array.from({length:MAX_ATTEMPTS}, (_, index) => {
    const attempt = attempts[index];
    const state = attempt ? (attempt.correct ? "is-hit" : "is-miss") : index === attempts.length && !finished ? "is-next" : "";
    return `<span class="attempt-dot ${state}" aria-hidden="true"></span>`;
  }).join("");
  elements.attemptTrack.setAttribute("aria-label", `Đã dùng ${attempts.length} trên ${MAX_ATTEMPTS} lượt đoán`);
  elements.roundStatus.textContent = gaveUp ? "Đã bỏ cuộc" : finished ? "Ca đã hoàn thành" : "Đáp án sẽ mở khi ca kết thúc";
  elements.playTip.textContent = "Chọn từ gợi ý hoặc tự nhập tên bệnh, tên tương đương hay mã ICD. Không cần gõ đúng dấu tiếng Việt.";
  elements.modeLabel.textContent = `${mode === "daily" ? "Ca hằng ngày" : "Luyện tập"}\u00a0· ${GAME_LABELS[gameType]}\u00a0· ${DIFFICULTY_LABELS[difficulty]}`;
  elements.caseKicker.textContent = "Ca bệnh";
  elements.caseTitle.textContent = `Ca bệnh #${String(currentCase.id).padStart(3, "0")}`;
  elements.clueList.innerHTML = activeClues()
    .map((clue, index) => {
      const visible = index < revealed;
      const latest = visible && index === revealed - 1;
      const number = String(index + 1).padStart(2, "0");
      return visible
        ? `<li class="clue ${latest ? "is-latest" : ""} ${latest && justRevealed ? "is-new" : ""}"><span class="clue-number" aria-hidden="true">${number}</span><p class="clue-text"><span class="mark">${escapeHtml(clue)}</span></p></li>`
        : `<li class="clue locked" aria-label="Dữ kiện ${index + 1} chưa mở"><span aria-hidden="true">${number}</span></li>`;
    })
    .join("");

  elements.history.innerHTML = Array.from({length: MAX_ATTEMPTS}, (_, index) => {
    const item = attempts[index];
    if (!item) return `<li class="slot"><span class="slot-n" aria-hidden="true">${index + 1}</span><span class="slot-line"></span></li>`;
    const state = item.correct ? "hit" : "miss";
    const body = item.kind === "reveal"
      ? `<span class="slot-note">Mở dữ kiện</span>`
      : `<span class="guess ${state}">${escapeHtml(item.text)}</span><span class="sr-only">${item.correct ? " Đúng" : " Sai"}</span>`;
    return `<li class="slot is-filled ${item.kind === "reveal" ? "is-reveal" : ""}"><span class="slot-n" aria-hidden="true">${index + 1}</span><span class="slot-line">${body}</span></li>`;
  }).join("");

  elements.reveal.disabled = finished || revealed >= activeClues().length;
  resetGiveUp();
  elements.giveUp.disabled = finished;
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
  if (finished) return;
  finished = true;
  revealed = activeClues().length;
  const stats = getStats();
  const store = mode === "daily" ? dailyStore() : null;
  const alreadyRecorded = store && (store.recorded[gameType]?.[difficulty] === true ||
    Object.entries(store.rounds[gameType] || {}).some(([level, round]) =>
      store.recorded[gameType]?.[level] === true && round.caseId === currentCase.id));

  if (!alreadyRecorded || mode === "practice") {
    stats.played += 1;
    stats.solved += solved ? 1 : 0;
    stats.streak = solved ? stats.streak + 1 : 0;
    setStats(stats);
  }
  if (store) {
    store.recorded[gameType] ??= {};
    store.recorded[gameType][difficulty] = true;
    localStorage.setItem(STATE_KEY, JSON.stringify(store));
  }

  elements.feedback.textContent = solved
    ? "Chính xác"
    : gaveUp ? "Đã bỏ cuộc · Xem đáp án bên dưới" : "Đã hết lượt đoán";
  elements.feedback.className = `feedback ${solved ? "good" : "bad"}`;
  render();
  if (!elements.resultCard.open) elements.resultCard.showModal?.();
  elements.answer.focus?.();
}

function showResult() {
  elements.result.classList.remove("hidden");
  elements.answer.textContent = currentCase.diagnosis;
  elements.icdLabel.textContent = `ICD-10: ${currentCase.icdCode} — ${currentCase.icdLabel}`;
  elements.summary.textContent = currentCase.summary;
}

// A picked ICD suggestion reads "CODE — name": judge by the code.
function guessKey(text) {
  return normalize(text.match(/^([A-Z]\d{2}(?:\.\d{1,2})?) — /)?.[1] ?? text);
}
let nameCases = new Map();
let codeCases = new Map();
// Case ids a key stands for. A name or alias is one disease; an ICD code counts only when it is unique.
function casesFor(key) {
  if (nameCases.has(key)) return nameCases.get(key);
  const code = codeCases.get(key);
  return code?.size === 1 ? code : new Set();
}
function guessedKeys() {
  const direct = attempts.filter((item) => item.kind !== "reveal").map((item) => guessKey(item.text));
  const keys = new Set(direct);
  const ids = new Set(direct.flatMap((key) => [...casesFor(key)]));
  for (const [key, set] of [...nameCases, ...codeCases]) {
    if ([...casesFor(key)].some((id) => ids.has(id)) && set) keys.add(key);
  }
  return keys;
}

function submitGuess(event) {
  closeSuggestions();
  event.preventDefault();
  const shown = elements.input.value.trim();
  if (!shown || finished) return;
  // Judge the code of a picked ICD suggestion, but keep the full label in the history.
  const text = shown.match(/^([A-Z]\d{2}(?:\.\d{1,2})?) — /)?.[1] ?? shown;
  if (!allowedGuessKeys.has(normalize(text))) {
    elements.feedback.textContent = "Hãy chọn một chẩn đoán trong danh sách gợi ý";
    elements.feedback.className = "feedback bad";
    updateSuggestions();
    elements.input.focus();
    return;
  }

  if (guessedKeys().has(normalize(text))) {
    elements.feedback.textContent = "Bạn đã đoán chẩn đoán này rồi";
    elements.feedback.className = "feedback bad";
    elements.input.focus();
    return;
  }

  const correct = isCorrect(text);
  attempts.push({ text: shown, correct });
  elements.input.value = "";

  if (correct) {
    finish(true);
    return;
  }

  if (attempts.length >= MAX_ATTEMPTS) {
    revealed = activeClues().length;
    finish(false);
    return;
  }

  const canReveal = revealed < activeClues().length;
  revealed = Math.min(activeClues().length, revealed + 1);
  animateReveal = canReveal;
  elements.feedback.textContent = canReveal ? "Chưa đúng · Đã mở dữ kiện tiếp theo" : "Chưa đúng · Bạn đã mở đủ dữ kiện";
  elements.feedback.className = "feedback bad";
  render();
}

function revealClue() {
  if (finished || revealed >= activeClues().length || attempts.length >= MAX_ATTEMPTS) return;
  attempts.push({text: "Mở thêm dữ kiện", correct: false, kind: "reveal"});
  revealed = Math.min(activeClues().length, revealed + 1);
  animateReveal = true;
  if (attempts.length >= MAX_ATTEMPTS) {
    finish(false);
    return;
  }
  elements.feedback.textContent = "Đã mở thêm dữ kiện";
  elements.feedback.className = "feedback";
  render();
}

let giveUpArmed = null;
function resetGiveUp() {
  giveUpArmed = null;
  elements.giveUp.textContent = "Bỏ cuộc";
}
function giveUp() {
  if (finished) return;
  if (!giveUpArmed || Date.now() - giveUpArmed > 4000) {
    elements.giveUp.textContent = "Bấm lại để bỏ cuộc";
    giveUpArmed = Date.now();
    globalThis.setTimeout?.(() => { if (giveUpArmed && !finished) resetGiveUp(); }, 4000);
    return;
  }
  resetGiveUp();
  gaveUp = true;
  finish(false);
}

function practiceRepeatWindow(size = practicePool().length) {
  return size > 1 ? Math.min(12, Math.max(1, Math.floor(size / 4))) : 0;
}

function rememberPracticeCase(item) {
  const key = `${gameType}:${practiceCategory}`;
  const history = [...(practiceHistory.get(key) || []), item.id];
  const size = practiceRepeatWindow();
  practiceHistory.set(key, size ? history.slice(-size) : []);
}

function randomPracticeCase(random = Math.random) {
  const pool = practicePool();
  const key = `${gameType}:${practiceCategory}`;
  const recent = new Set(practiceHistory.get(key) || []);
  let eligible = pool.filter(item => item.id !== currentCase?.id && !recent.has(item.id));
  if (!eligible.length) eligible = pool.filter(item => item.id !== currentCase?.id);
  const item = weightedCase(eligible.length ? eligible : pool, difficulty, random);
  rememberPracticeCase(item);
  return item;
}

function nextCase() {
  elements.resultCard.close?.();
  if (mode === "daily") switchMode("practice");
  else setCase(randomPracticeCase());
  elements.caseTitle.focus?.();
  globalThis.scrollTo?.(0, 0);
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
  const label = button.querySelector("span") || button;
  const original = label.textContent;
  label.textContent = "Đã sao chép";
  setTimeout(() => {
    label.textContent = original;
  }, 1400);
}

function shareText() {
  const solvedAt = attempts.findIndex((item) => item.correct) + 1;
  const marks = attempts
    .map((item) => (item.correct ? "🟩" : item.kind === "reveal" ? "🟨" : "⬜"))
    .concat(Array(Math.max(0, MAX_ATTEMPTS - attempts.length)).fill("⬛"))
    .join("");
  return `chanle #${String(currentCase.id).padStart(3, "0")} · ${GAME_LABELS[gameType]} · ${categoryLabel()} · ${DIFFICULTY_LABELS[difficulty]} ${solvedAt || "X"}/${MAX_ATTEMPTS}\n${marks}\nhttps://souhhcong.github.io/`;
}

function ankiText() {
  return [
    "Mặt trước:",
    `${GAME_LABELS[gameType]} · ${categoryLabel()}`,
    ...activeClues().map((clue, index) => `${index + 1}. ${clue}`),
    "Chẩn đoán có khả năng nhất là gì?",
    "",
    `Mặt sau: ${currentCase.diagnosis}`,
    `ICD-10: ${currentCase.icdCode} — ${currentCase.icdLabel}`,
    currentCase.summary
  ].join("\n");
}

function switchMode(nextMode) {
  if (!["daily", "practice"].includes(nextMode)) return;
  mode = nextMode;
  syncControls();
  setCase(mode === "daily" ? dailyCase() : randomPracticeCase(), mode === "daily");
}

function switchCategory(nextCategory) {
  if (nextCategory !== "all" && !CATEGORIES.some((category) => category.id === nextCategory)) return;
  practiceCategory = nextCategory;
  localStorage.setItem(CATEGORY_KEY, practiceCategory);
  switchMode("practice");
}

function switchDifficulty(nextDifficulty) {
  if (!Object.hasOwn(DIFFICULTY_LABELS, nextDifficulty) || nextDifficulty === difficulty) return;
  difficulty = nextDifficulty;
  localStorage.setItem(DIFFICULTY_KEY, difficulty);
  syncControls();
  setCase(mode === "daily" ? dailyCase() : randomPracticeCase(), mode === "daily");
}

let suggestionNames = [];
let allowedGuessKeys = new Set();
let activeSuggestion = -1;

function hydrateDiagnosisList() {
  const names = new Set();
  const pool = mode === "daily" ? CASES : practicePool();
  allowedGuessKeys = new Set(pool.map((item) => normalize(item.icdCode)));
  nameCases = new Map();
  codeCases = new Map();
  const link = (map, key, id) => map.set(key, (map.get(key) ?? new Set()).add(id));
  pool.forEach((item) => {
    names.add(item.diagnosis);
    item.aliases.forEach((alias) => names.add(alias));
    [item.diagnosis, ...item.aliases].forEach((name) => link(nameCases, normalize(name), item.id));
    link(codeCases, normalize(item.icdCode), item.id);
  });
  names.forEach((name) => allowedGuessKeys.add(normalize(name)));
  suggestionNames = [...names]
    .sort((a, b) => a.localeCompare(b, "vi"))
    .map((name) => ({name, key: normalize(name), label: name}))
    // Drop accentless aliases that only duplicate an accented name.
    .filter((entry) => entry.name !== entry.key);
  const codes = new Map();
  pool.forEach((item) => { if (!codes.has(item.icdCode)) codes.set(item.icdCode, item.icdLabel); });
  [...codes].sort(([a], [b]) => a.localeCompare(b)).forEach(([code, label]) =>
    suggestionNames.push({name: code, key: normalize(code), label: `${code} — ${label}`}));
  suggestionNames.forEach((entry) => allowedGuessKeys.add(entry.key));
  closeSuggestions();
}

function closeSuggestions() {
  activeSuggestion = -1;
  elements.suggestions.hidden = true;
  elements.suggestions.innerHTML = "";
  elements.input.setAttribute("aria-expanded", "false");
  elements.input.removeAttribute("aria-activedescendant");
}

function setActiveSuggestion(index) {
  const items = [...elements.suggestions.children];
  if (items[index]?.getAttribute("aria-disabled") === "true") index = -1;
  activeSuggestion = index;
  items.forEach((item, i) => item.setAttribute("aria-selected", String(i === index)));
  if (items[index]) {
    elements.input.setAttribute("aria-activedescendant", items[index].id);
    items[index].scrollIntoView({block: "nearest"});
  } else {
    elements.input.removeAttribute("aria-activedescendant");
  }
}

function updateSuggestions() {
  const query = normalize(elements.input.value);
  if (!query || elements.input.disabled) return closeSuggestions();
  const starts = [];
  const contains = [];
  for (const entry of suggestionNames) {
    if (entry.key === query) continue;
    if (entry.key.startsWith(query)) starts.push(entry);
    else if (entry.key.includes(query)) contains.push(entry);
  }
  const guessed = guessedKeys();
  const matches = [...starts, ...contains].slice(0, 6).map((entry) => ({...entry, used: guessed.has(entry.key)}));
  if (!matches.length) return closeSuggestions();
  elements.suggestions.innerHTML = matches
    .map((entry, i) => `<li role="option" id="suggestion-${i}" aria-selected="false"${entry.used ? ' aria-disabled="true" class="used"' : ""} data-value="${escapeHtml(entry.label)}">${escapeHtml(entry.label)}</li>`)
    .join("");
  elements.suggestions.hidden = false;
  elements.input.setAttribute("aria-expanded", "true");
  setActiveSuggestion(-1);
  elements.suggestions.scrollIntoView?.({block: "nearest"});
}

function pickSuggestion(value) {
  elements.input.value = value;
  closeSuggestions();
  elements.input.focus();
}

function bindSuggestions() {
  elements.input.addEventListener("input", updateSuggestions);
  elements.input.addEventListener("blur", () => setTimeout(closeSuggestions, 120));
  elements.input.addEventListener("keydown", (event) => {
    const count = elements.suggestions.children.length;
    if (elements.suggestions.hidden || !count) return;
    const step = (dir) => {
      const items = [...elements.suggestions.children];
      for (let n = 1; n <= count; n++) {
        const next = (activeSuggestion + dir * n + count * (n + 1)) % count;
        if (items[next].getAttribute("aria-disabled") !== "true") return next;
      }
      return -1;
    };
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveSuggestion(step(1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveSuggestion(step(-1)); }
    else if (event.key === "Escape") closeSuggestions();
    else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      pickSuggestion(elements.suggestions.children[activeSuggestion].dataset.value);
    }
  });
  // pointerdown keeps focus on the input so the mobile keyboard stays open.
  elements.suggestions.addEventListener("pointerdown", (event) => {
    const item = event.target.closest("li");
    if (!item) return;
    event.preventDefault();
    if (item.getAttribute("aria-disabled") === "true") return;
    pickSuggestion(item.dataset.value);
  });
}

function localPreviewOptions() {
  if (typeof location === "undefined" || !["localhost", "127.0.0.1"].includes(location.hostname)) return null;
  const params = new URLSearchParams(location.search);
  const caseData = CASES.find((item) => item.id === Number(params.get("case")));
  if (!caseData) return null;
  const level = params.get("difficulty");
  const requestedCategory = params.get("category");
  return {caseData, difficulty:Object.hasOwn(DIFFICULTY_LABELS, level) ? level : difficulty,
    category:caseData.categoryIds.includes(requestedCategory) ? requestedCategory : "all"};
}

async function init() {
  try {
    await loadCases();
  } catch (error) {
    console.error(error);
    elements.caseTitle.textContent = "Không tải được dữ liệu ca bệnh";
    elements.feedback.textContent =
      "Không thể tải dữ liệu ca bệnh. Khi chạy cục bộ, hãy dùng một static server thay vì mở file trực tiếp.";
    elements.feedback.className = "feedback bad";
    return;
  }

  elements.category.innerHTML = `<option value="all">Tất cả chuyên khoa (${CASES.length})</option>` + CATEGORIES.map((category) =>
    `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)} (${CASES.filter((item) => item.categoryIds.includes(category.id)).length})</option>`).join("");
  const preview = localPreviewOptions();
  if (preview) {
    mode = "practice";
    difficulty = preview.difficulty;
    practiceCategory = preview.category;
  }
  elements.difficulty.value = difficulty;
  updateStatsView();
  syncControls();
  setCase(preview?.caseData || dailyCase(), !preview);
  if (preview) rememberPracticeCase(currentCase);

  elements.form.addEventListener("submit", submitGuess);
  bindSuggestions();
  elements.reveal.addEventListener("click", revealClue);
  elements.giveUp.addEventListener("click", giveUp);
  elements.next.addEventListener("click", nextCase);
  elements.reviewNext.addEventListener("click", nextCase);
  elements.copyShare.addEventListener("click", () => copyText(shareText(), elements.copyShare));
  elements.copyAnki.addEventListener("click", () => copyText(ankiText(), elements.copyAnki));
  elements.difficulty.addEventListener("change", () => switchDifficulty(elements.difficulty.value));
  elements.category.addEventListener("change", () => switchCategory(elements.category.value));
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
  });
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.open}`).showModal());
  });
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.close}`).close());
  });
  for (const id of ["#help", "#result-card", "#settings"]) {
    $(id).addEventListener("click", (event) => {
      if (event.target === $(id)) $(id).close();
    });
  }
}

init();
