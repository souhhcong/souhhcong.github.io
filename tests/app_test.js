import { loadApp } from "../scripts/app-harness.js";
import { validateInternal } from "../scripts/validate-cases.js";
import { createHash } from "node:crypto";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, pattern) {
  try { fn(); } catch (error) {
    assert(pattern.test(error.message), `Unexpected error: ${error.message}`);
    return;
  }
  throw new Error("Expected validation failure");
}

Deno.test("startup, difficulty switching and a winning submission work together", async () => {
  const { run, nodes } = loadApp();
  await run("init()");
  const select = nodes.get("#difficulty-select");
  select.value = "hard";
  select.listeners.get("change")();
  assert(nodes.get("#case-title").textContent === run('"Ca bệnh #" + String(currentCase.id).padStart(3, "0")'), "Hard mode does not use the neutral case heading");
  assert(nodes.get("#guess-input").getAttribute("role") === "combobox", "Hard mode removed autocomplete");
  nodes.get("#guess-input").value = run("currentCase.aliases[0]");
  nodes.get("#guess-form").listeners.get("submit")({ preventDefault() {} });
  assert(run("finished && attempts[0].correct"), "Winning submission did not complete the game");
  assert(nodes.get("#answer").textContent === run("currentCase.diagnosis"), "Wrong clinical answer shown");
  assert(nodes.get("#guess-input").disabled, "Finished game still accepts guesses");
});

Deno.test("all diagnoses, codes and synonyms work in all difficulties and Unicode forms", () => {
  const { run } = loadApp();
  assert(run(`CASES.every((item) => {
    currentCase = item;
    return Object.keys(DIFFICULTY_LABELS).every((level) => {
      difficulty = level;
      return [item.diagnosis, item.icdCode, ...item.aliases].every((answer) =>
        [answer, answer.toUpperCase(), answer.normalize("NFD"), normalize(answer)]
          .every((variant) => isCorrect(variant)));
    });
  })`), "A valid answer was rejected");
});

Deno.test("different diagnoses and empty guesses are rejected", () => {
  const { run } = loadApp();
  assert(run(`CASES.every((item, index) => {
    currentCase = item;
    return !isCorrect(CASES[(index + 1) % CASES.length].diagnosis) &&
      !isCorrect("") && !isCorrect("   ") && !isCorrect("???");
  })`), "An incorrect or empty answer was accepted");
});

Deno.test("a broad ICD category is not a clinical synonym", () => {
  const { run } = loadApp();
  run("currentCase = CASES.find((item) => item.id === 53)");
  assert(run('isCorrect("Bệnh Graves") && isCorrect("Basedow")'), "Graves synonym rejected");
  assert(run(`CASES.every((item) => {
    currentCase = item;
    const own = [item.diagnosis, item.icdCode, ...item.aliases].map(normalize);
    return own.includes(normalize(item.icdLabel)) || !isCorrect(item.icdLabel);
  })`), "Broad ICD category accepted as equivalent");
});

Deno.test("different diagnoses may share a category label without sharing accepted answers", () => {
  const { run, rows, context } = loadApp();
  const nextId = Math.max(...rows.map((row) => Number(row.id))) + 1;
  const sameCategory = {...rows[0], id: String(nextId), diagnosis: "Một bệnh khác cùng nhóm ICD", icd_code:"Z99.9", aliases: ""};
  context.extendedRows = [...rows, sameCategory];
  run("validateCaseRows(extendedRows)");
});

Deno.test("result shows clinical diagnosis separately from ICD category", () => {
  const { run, nodes } = loadApp();
  run("currentCase = CASES.find((item) => item.id === 12); showResult()");
  assert(nodes.get("#answer").textContent.includes("Viêm túi mật cấp"), "Clinical answer missing");
  assert(nodes.get("#icd-label").textContent.includes("K80.0"), "ICD category missing");
});

Deno.test("Anki exports the vignette and summary without differentials, teaching points or internal metadata", () => {
  const { run } = loadApp();
  assert(run(`CASES.every((item) => {
    currentCase = item;
    const card = ankiText();
    return item.clues.every((clue) => card.includes(clue)) &&
      card.includes(item.diagnosis) && card.includes(item.summary) &&
      item.differentials.every(([name, note]) => !card.includes(note)) &&
      Object.values(item.pearls).every((note) => !card.includes(note)) &&
      !card.includes("source_checked") && !card.includes("clinical_reviewer") && !card.includes("https://");
  })`), "Incomplete or private content in Anki export");
});

Deno.test("CSV handles quoted commas, quotes, multiline text and CRLF", () => {
  const { run, context } = loadApp();
  context.fixture = 'id,note\r\n1,"a,b"\r\n2,"say ""hello""\nand continue"\r\n';
  const parsed = run("parseCsv(fixture)");
  assert(parsed.length === 2 && parsed[0].note === "a,b", "Quoted comma failed");
  assert(parsed[1].note === 'say "hello"\nand continue', "Quoted multiline failed");
});

Deno.test("malformed CSV and invalid clinical records fail validation", () => {
  const { run, context, rows } = loadApp();
  for (const fixture of ['id,id\n1,2', 'id,note\n1', 'id,note\n1,"unclosed']) {
    context.fixture = fixture;
    assertThrows(() => run("parseCsv(fixture)"), /CSV|CSV fields|quote/);
  }
  const mutations = [
    (copy) => { copy[0].clue4 = ""; },
    (copy) => { copy[1].id = copy[0].id; },
    (copy) => { copy[0].icd_code = "not-a-code"; },
    (copy) => { copy[1].aliases += `|${copy[0].diagnosis}`; },
    (copy) => { copy[0].differential1_note = ""; },
  ];
  for (const mutate of mutations) {
    const copy = JSON.parse(JSON.stringify(rows));
    mutate(copy);
    context.badRows = copy;
    assertThrows(() => run("validateCaseRows(badRows)"), /Case|case|Answer/);
  }
});

Deno.test("incorrect legacy codes no longer count as correct answers", () => {
  const { run } = loadApp();
  run("currentCase = CASES.find((item) => item.id === 12)");
  assert(run('isCorrect("K80.0") && !isCorrect("K81.0")'), "Calculous cholecystitis code correction not applied");
});

Deno.test("source-checked cases have specific explanations and differentials", () => {
  const { rows } = loadApp();
  for (const row of rows) {
    assert(row.differential1_name && row.differential2_name, `Missing differential: ${row.id}`);
    assert(row.pearl1_text && row.pearl2_text, `Missing explanation: ${row.id}`);
    assert(row.summary !== row.pearl1_text, `Repeated summary: ${row.id}`);
  }
  assert(rows.every((row) => row.pearl2_title !== "Mục tiêu ôn tập"), "Placeholder explanation remains");
});

Deno.test("newly specified ICD codes do not retain incorrect old code aliases", () => {
  const { run, context } = loadApp();
  context.codeChanges = [[84,"O14.1","O14.9"]];
  assert(run(`codeChanges.every(([id, code, oldCode]) => {
    currentCase = CASES.find((item) => item.id === id);
    return isCorrect(code) && !isCorrect(oldCode);
  })`), "A superseded code is still accepted");
});

Deno.test("internal records reject stale checks and unsupported clinician sign-off", () => {
  const { rows } = loadApp();
  const ledger = {
    sources: {},
    cases: rows.map((row) => ({case_id: Number(row.id), status: "pending", content_sha256: "stale", source_ids: []})),
  };
  assertThrows(() => validateInternal(rows, ledger), /stale/);
  for (const [index, record] of ledger.cases.entries()) {
    record.content_sha256 = createHash("sha256").update(JSON.stringify(Object.values(rows[index]))).digest("hex");
  }
  validateInternal(rows, ledger);
  ledger.cases[0].status = "source_checked";
  assertThrows(() => validateInternal(rows, ledger), /missing source-check/);
  ledger.sources.example = {title: "Example", section: "Diagnosis", accessed_at: "2026-10-25", url: "https://example.org/guideline"};
  Object.assign(ledger.cases[0], {
    status: "clinically_reviewed", source_ids: ["example"],
    source_checked_by: "Editorial check", source_checked_at: "2026-10-25",
  });
  assertThrows(() => validateInternal(rows, ledger), /real reviewer and date/);
  Object.assign(ledger.cases[0], {clinical_reviewer: "Test reviewer", clinically_reviewed_at: "2026-10-25"});
  validateInternal(rows, ledger);
});

Deno.test("browser assets contain no editorial metadata or source links", () => {
  for (const file of ["app.js", "index.html", "cases.csv", "revision-data.json", "case-difficulty.json"]) {
    const text = Deno.readTextFileSync(new URL(`../${file}`, import.meta.url));
    assert(!/\.internal\/|source_checked|clinical_reviewer|clinically_reviewed_at|source_ids|review_note|content_sha256|checked_by|accessed_at/.test(text), `Internal metadata in ${file}`);
  }
});
