// Import verified six-clue patient cases from the medical-dataset-claude project
// into cases.csv: clue1-clue6, plus the dataset disease name as the answer
// (the previous answer and dataset aliases become accepted aliases).
//
//   deno task import:clues            # dry run: report matches and rejections
//   deno task import:clues --write    # replace clue1-clue6 for imported cases
//
// scripts/clue-import-map.json overrides matching per dataset disease:
//   { "VN-MED-0022": { "caseId": 42, "case": "K02", "note": "..." } }  map (optional case pick)
//   { "VN-MED-0034": { "skip": "reason" } }                           never import
// Diseases that only share an ICD code with a case are reported until mapped.
//
// Options:
//   --dataset=<dir>   dataset project root (default: ../medical-dataset-claude)
//   --only=VN-MED-0001,VN-MED-0002   limit to these dataset diseases
//
// Only clue, diagnosis and aliases columns change. Titles, ICD codes, summaries, pearls, differentials,
// treatment data and difficulty ratings are left alone, and review fingerprints
// are never refreshed: imported clues must be source-checked before the
// internal ledger is updated.
import { loadApp } from "./app-harness.js";

const ROOT = new URL("../", import.meta.url);
const CSV_URL = new URL("cases.csv", ROOT);
const MAP_URL = new URL("scripts/clue-import-map.json", ROOT);
const CLUE_FIELDS = ["clue1", "clue2", "clue3", "clue4", "clue5", "clue6"];
// Clue-verifier outcomes that may be published unchanged.
const ACCEPTED = new Set(["SUPPORTED/none", "PARTLY_SUPPORTED/minor"]);

function parseArgs(args) {
  const options = { write: false, dataset: null, only: null };
  for (const arg of args) {
    if (arg === "--write") options.write = true;
    else if (arg.startsWith("--dataset=")) options.dataset = arg.slice(10);
    else if (arg.startsWith("--only=")) options.only = new Set(arg.slice(7).split(",").filter(Boolean));
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

const readJson = (path) => {
  try {
    return JSON.parse(Deno.readTextFileSync(path));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw new Error(`${path}: ${error.message}`);
  }
};

const quote = (value) => `"${String(value).replaceAll("\"", "\"\"")}"`;

export function serializeCsv(rows, headers) {
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((items) => items.map(quote).join(",")).join("\n") + "\n";
}

// Find the cases.csv row for a dataset disease: an explicit map entry first,
// then a unique name/alias match, then a unique ICD-10 match.
export function matchRow(disease, rows, normalize, override) {
  if (override !== undefined) {
    if (override?.skip) return { skip: `map: ${override.skip}` };
    const row = rows.find((item) => Number(item.id) === override?.caseId);
    const caseId = override?.caseId;
    return row ? { row, how: "map" } : { error: `mapped case ${caseId} does not exist` };
  }
  const names = new Set([
    disease.name_vi, disease.name_en, disease.icd10?.official_name_vi,
    ...(disease.aliases_vi ?? []),
  ].filter(Boolean).map(normalize));
  const labels = (row) => [row.diagnosis, ...row.aliases.split("|")].map(normalize).filter(Boolean);
  const byName = rows.filter((row) => labels(row).some((label) => names.has(label)));
  if (byName.length === 1) return { row: byName[0], how: "name" };
  if (byName.length > 1) return { error: `ambiguous name match: cases ${byName.map((row) => row.id).join(", ")}` };

  const codes = [...new Set([...(disease.icd10?.codes ?? []), disease.icd10?.code, disease.icd10_candidate]
    .filter(Boolean))];
  const byCode = rows.filter((row) => codes.some((code) => row.icd_code === code || row.icd_code.startsWith(`${code}.`)));
  // A shared ICD code often means the game answer is narrower than the dataset
  // disease (cirrhosis vs primary biliary cholangitis), so never import on it.
  if (byCode.length) {
    return { skip: `ICD candidate ${byCode.map((row) => `case ${row.id} ${row.diagnosis}`).join(", ")}; confirm in clue-import-map.json` };
  }
  return { skip: "no matching case in cases.csv" };
}

// Reasons a dataset case cannot be published; an empty list means it is eligible.
export function caseProblems(item, { verify, grounding, answers, forbidden, normalize }) {
  const problems = [];
  const clues = [...(item.clues ?? [])].sort((a, b) => a.order - b.order);
  if (clues.length !== 6 || clues.some((clue, index) => clue.order !== index + 1)) {
    problems.push("needs clues ordered 1-6");
  }
  if (clues.some((clue) => typeof clue.text_vi !== "string" || !clue.text_vi.trim())) problems.push("has an empty clue");
  if (!verify) problems.push("no clue verification");
  if (!grounding) problems.push("no grounding record");
  for (const clue of clues) {
    const verdict = verify?.clues.find((record) => record.case_id === item.case_id && record.order === clue.order);
    const status = verdict ? `${verdict.status}/${verdict.severity}` : "missing";
    if (verify && !ACCEPTED.has(status)) problems.push(`clue ${clue.order} verification ${status}`);
    const ground = grounding?.clues.find((record) => record.case_id === item.case_id && record.order === clue.order);
    if (grounding && ground?.status !== "grounded") problems.push(`clue ${clue.order} grounding ${ground?.status ?? "missing"}`);
    const text = ` ${normalize(clue.text_vi ?? "")} `;
    const leak = [...answers, ...forbidden].find((term) => term && text.includes(` ${term} `));
    if (leak) problems.push(`clue ${clue.order} names the answer ("${leak}")`);
  }
  return { problems, clues };
}

// Use the dataset name as the answer. The previous answer stays accepted as an
// alias, and dataset aliases are added. A label already owned by another case,
// or one that would give away this case's treatment clues, is refused.
export function renameAnswer(row, disease, { owners, treatmentClues, normalize }) {
  const refused = [];
  const free = (label) => {
    const key = normalize(label);
    if (!key) return false;
    const owner = owners.get(key);
    if (owner && owner !== row.id) {
      refused.push(`"${label}" belongs to case ${owner}`);
      return false;
    }
    if (treatmentClues.some((clue) => ` ${normalize(clue)} `.includes(` ${key} `))) {
      refused.push(`"${label}" appears in a treatment clue`);
      return false;
    }
    return true;
  };
  const target = disease.name_vi?.trim();
  const diagnosis = target && target !== row.diagnosis && free(target) ? target : row.diagnosis;
  const aliases = row.aliases.split("|").map((item) => item.trim())
    .filter((item) => item && (diagnosis === row.diagnosis || normalize(item) !== normalize(diagnosis)));
  const has = (label) => [diagnosis, ...aliases].some((item) => normalize(item) === normalize(label));
  for (const label of [row.diagnosis, ...(disease.aliases_vi ?? [])]) {
    if (!has(label) && free(label)) aliases.push(label.trim());
  }
  // Keep the replaced answer first so it reads as the main synonym.
  if (diagnosis !== row.diagnosis) {
    aliases.splice(aliases.indexOf(row.diagnosis), 1);
    aliases.unshift(row.diagnosis);
  }
  for (const label of [diagnosis, ...aliases]) owners.set(normalize(label), row.id);
  return { diagnosis, aliases: aliases.join("|"), refused };
}

export function planImport({ rows, normalize, catalog, clueDir, map, only, treatment = new Map() }) {
  const plan = { updates: [], skipped: [], rejected: [] };
  const claimed = new Map();
  const owners = new Map();
  for (const row of rows) {
    for (const label of [row.diagnosis, ...row.aliases.split("|"), row.icd_code]) {
      if (normalize(label)) owners.set(normalize(label), row.id);
    }
  }
  const files = [...Deno.readDirSync(clueDir)]
    .map((entry) => entry.name).filter((name) => /^VN-MED-\d{4}\.json$/.test(name)).sort();
  for (const file of files) {
    const id = file.slice(0, -5);
    if (only && !only.has(id)) continue;
    const source = readJson(new URL(file, clueDir));
    // Names in the clue file are the corrected ones; the catalog supplies ICD data
    // and names for older files that do not carry them.
    const names = Object.fromEntries(["name_vi", "name_en", "aliases_vi"]
      .filter((key) => source[key]?.length).map((key) => [key, source[key]]));
    if (!catalog.has(id) && !names.name_vi) {
      plan.rejected.push({ id, reason: "no disease name in the clue file or data/catalog.jsonl" });
      continue;
    }
    const disease = { ...catalog.get(id), ...names };
    const override = Object.hasOwn(map, id) ? map[id] : undefined;
    const match = matchRow(disease, rows, normalize, override);
    if (match.skip) {
      plan.skipped.push({ id, name: disease.name_vi, reason: match.skip });
      continue;
    }
    if (match.error) {
      plan.rejected.push({ id, name: disease.name_vi, reason: match.error });
      continue;
    }
    const row = match.row;
    if (claimed.has(row.id)) {
      plan.rejected.push({ id, name: disease.name_vi, reason: `case ${row.id} already matched by ${claimed.get(row.id)}` });
      continue;
    }
    claimed.set(row.id, id);

    const context = {
      verify: readJson(new URL(`${id}.cverify.json`, clueDir)),
      grounding: readJson(new URL(`${id}.grounding.json`, clueDir)),
      answers: [row.diagnosis, ...row.aliases.split("|"), row.icd_code, disease.name_vi, ...(disease.aliases_vi ?? [])]
        .filter(Boolean).map(normalize),
      forbidden: (readJson(new URL(`${id}.brief.json`, clueDir))?.forbidden_terms ?? []).map(normalize),
      normalize,
    };
    const preferred = override?.case ? `${id}-${override.case}` : null;
    const candidates = (source.cases ?? []).filter((item) => !preferred || item.case_id === preferred);
    const reasons = [];
    let chosen = null;
    for (const item of candidates) {
      const { problems, clues } = caseProblems(item, context);
      if (!problems.length) {
        chosen = { item, clues };
        break;
      }
      reasons.push(`${item.case_id}: ${problems.join("; ")}`);
    }
    if (!chosen) {
      plan.rejected.push({ id, name: disease.name_vi, caseId: row.id, reason: reasons.join(" | ") || `no case ${preferred}` });
      continue;
    }
    const answer = renameAnswer(row, disease, {
      owners, normalize, treatmentClues: treatment.get(Number(row.id)) ?? [],
    });
    plan.updates.push({
      id, caseId: Number(row.id), diagnosis: row.diagnosis, how: match.how,
      sourceCase: chosen.item.case_id, clues: chosen.clues.map((clue) => clue.text_vi.trim()),
      newDiagnosis: answer.diagnosis, newAliases: answer.aliases, refused: answer.refused,
      changed: CLUE_FIELDS.some((field, index) => row[field] !== chosen.clues[index].text_vi.trim()) ||
        answer.diagnosis !== row.diagnosis || answer.aliases !== row.aliases,
    });
  }
  return plan;
}

if (import.meta.main) {
  const options = parseArgs(Deno.args);
  const dataset = new URL(`${options.dataset ?? "../medical-dataset-claude"}/`, ROOT);
  const clueDir = new URL("work/clues/", dataset);
  const catalog = new Map(Deno.readTextFileSync(new URL("data/catalog.jsonl", dataset))
    .split("\n").filter(Boolean).map((line) => JSON.parse(line)).map((item) => [item.disease_id, item]));
  const map = readJson(MAP_URL) ?? {};

  const app = loadApp();
  const normalize = (value) => app.context.normalize(String(value));
  const csv = Deno.readTextFileSync(CSV_URL);
  const rows = app.run("parseCsv(csvText)");
  const headers = Object.keys(rows[0]);
  if (serializeCsv(rows, headers) !== csv) throw new Error("cases.csv does not round-trip; refusing to rewrite it");

  const treatment = new Map(app.revision.cases.map((item) => [item.caseId, item.treatmentClues]));
  const plan = planImport({ rows, normalize, catalog, clueDir, map, only: options.only, treatment });
  for (const update of plan.updates) {
    const renamed = update.newDiagnosis !== update.diagnosis ? ` => ${update.newDiagnosis}` : "";
    console.log(`${update.changed ? "UPDATE" : "same  "} ${update.id} -> case ${update.caseId} ${update.diagnosis}${renamed} [${update.how}, ${update.sourceCase}]`);
    for (const reason of update.refused) console.log(`         name refused: ${reason}`);
  }
  for (const item of plan.skipped) console.log(`skip   ${item.id} ${item.name}: ${item.reason}`);
  for (const item of plan.rejected) console.log(`REJECT ${item.id} ${item.name ?? ""}${item.caseId ? ` (case ${item.caseId})` : ""}: ${item.reason}`);
  const changed = plan.updates.filter((update) => update.changed);
  console.log(`\n${plan.updates.length} importable (${changed.length} changed), ${plan.skipped.length} skipped, ${plan.rejected.length} rejected.`);

  if (!options.write) {
    console.log("Dry run; pass --write to update cases.csv.");
  } else if (changed.length) {
    for (const update of changed) {
      const row = rows.find((item) => Number(item.id) === update.caseId);
      CLUE_FIELDS.forEach((field, index) => { row[field] = update.clues[index]; });
      row.diagnosis = update.newDiagnosis;
      row.aliases = update.newAliases;
    }
    Deno.writeTextFileSync(CSV_URL, serializeCsv(rows, headers));
    // Re-run the app's own startup validation on the written file; restore it if that fails.
    try {
      loadApp();
    } catch (error) {
      Deno.writeTextFileSync(CSV_URL, csv);
      throw new Error(`Imported bank failed app validation; cases.csv restored. ${error.message}`);
    }
    console.log(`Updated ${changed.length} cases (clues, answers, aliases). Summaries and review records were not changed.`);
  }
}
