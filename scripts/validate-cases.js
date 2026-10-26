import { loadApp } from "./app-harness.js";
import { createHash } from "node:crypto";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const caseHash = (row) => sha256(JSON.stringify(Object.values(row)));

export function validateInternal(rows, ledger) {
  const records = new Map(ledger.cases.map((record) => [record.case_id, record]));
  if (records.size !== rows.length || ledger.cases.length !== rows.length) {
    throw new Error("Internal ledger must have one record per case");
  }
  for (const row of rows) {
    const record = records.get(Number(row.id));
    if (!record) throw new Error(`Missing internal record: ${row.id}`);
    const hash = caseHash(row);
    if (hash !== record.content_sha256) throw new Error(`Case ${row.id}: internal check is stale after content changes`);
    if (!["pending", "source_checked", "clinically_reviewed"].includes(record.status)) {
      throw new Error(`Case ${row.id}: unknown internal status`);
    }
    if (record.status !== "pending" && (!record.source_ids.length || !record.source_checked_by || !record.source_checked_at)) {
      throw new Error(`Case ${row.id}: missing source-check details`);
    }
    for (const id of record.source_ids) {
      const source = ledger.sources[id];
      if (!source?.title || !source?.section || !source?.accessed_at || !source?.url?.startsWith("https://")) {
        throw new Error(`Case ${row.id}: incomplete source ${id}`);
      }
    }
    if (record.status === "clinically_reviewed" && (!record.clinical_reviewer || !record.clinically_reviewed_at)) {
      throw new Error(`Case ${row.id}: clinical review requires a real reviewer and date`);
    }
  }
}

export function validateClueAudit(rows, ledger) {
  const records = new Map(ledger.cases.map((record) => [record.case_id, record]));
  if (records.size !== rows.length || ledger.cases.length !== rows.length) {
    throw new Error("Clue audit must have one record per case");
  }
  const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
  const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  for (const row of rows) {
    const audit = records.get(Number(row.id))?.clue_audit;
    const fail = (message) => { throw new Error(`Case ${row.id}: clue audit ${message}`); };
    if (!audit || audit.status !== "editorial_complete") fail("is missing or incomplete");
    if (!nonempty(audit.checked_by) || !validDate(audit.started_at) || !validDate(audit.completed_at) ||
      audit.completed_at < audit.started_at) fail("requires reviewer attribution and ordered dates");
    if (audit.case_content_sha256 !== caseHash(row)) fail("is stale after case content changes");
    if (!Array.isArray(audit.clues) || audit.clues.length !== 6) fail("requires six individual clue records");
    const fields = new Set();
    for (const clue of audit.clues) {
      if (!/^clue[1-6]$/.test(clue.field) || fields.has(clue.field)) fail("has invalid or duplicate clue coverage");
      fields.add(clue.field);
      if (!nonempty(clue.reviewed_text) || clue.reviewed_text !== row[clue.field] ||
        clue.text_sha256 !== sha256(row[clue.field])) fail(`has stale text for ${clue.field}`);
      if (!nonempty(clue.previous_text) || typeof clue.changed !== "boolean" ||
        clue.changed !== (clue.previous_text !== clue.reviewed_text)) fail(`has inconsistent change history for ${clue.field}`);
      if (!nonempty(clue.review_note)) fail(`requires an individual note for ${clue.field}`);
      if (!Array.isArray(clue.source_ids) || !clue.source_ids.length ||
        new Set(clue.source_ids).size !== clue.source_ids.length) fail(`requires source references for ${clue.field}`);
      for (const id of clue.source_ids) {
        const source = ledger.sources[id];
        if (!nonempty(source?.title) || !nonempty(source?.section) || !validDate(source?.accessed_at) ||
          !source?.url?.startsWith("https://")) fail(`has an incomplete source ${id}`);
      }
    }
  }
}

export function validateTreatmentAudit(rows, revision, ledger) {
  const records = new Map(ledger.cases.map((record) => [record.case_id,record]));
  const clinical = new Map(rows.map((row) => [Number(row.id),row]));
  const seen = new Set();
  if (revision.cases.length !== rows.length) throw new Error("Treatment audit requires complete case coverage");
  for (const item of revision.cases) {
    const fail = (message) => { throw new Error(`Case ${item.caseId}: treatment audit ${message}`); };
    if (seen.has(item.caseId) || !clinical.has(item.caseId)) fail("has duplicate or unknown case");
    seen.add(item.caseId);
    const audit = records.get(item.caseId)?.treatment_audit;
    if (!audit || audit.status !== "editorial_complete") fail("is missing or incomplete");
    if (audit.clinical_content_sha256 !== caseHash(clinical.get(item.caseId)) ||
      audit.revision_content_sha256 !== sha256(JSON.stringify(item))) fail("is stale after content changes");
    const date = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    const nonempty = (value) => typeof value === "string" && Boolean(value.trim());
    if (!nonempty(audit.checked_by) || !date(audit.started_at) || !date(audit.completed_at) ||
      audit.started_at > audit.completed_at || !nonempty(audit.explanation_note)) fail("requires attribution, dates and explanation review");
    if (!Array.isArray(audit.clues) || audit.clues.length !== 6) fail("requires six individual records");
    const fields = new Set();
    for (const clue of audit.clues) {
      if (!/^treatment[1-6]$/.test(clue.field) || fields.has(clue.field)) fail("has invalid or duplicate clue coverage");
      fields.add(clue.field);
      const text = item.treatmentClues[Number(clue.field.at(-1)) - 1];
      if (!nonempty(text) || clue.reviewed_text !== text || clue.text_sha256 !== sha256(text)) fail("has stale clue text");
      if (!nonempty(clue.review_note) || !Array.isArray(clue.source_ids) || !clue.source_ids.length ||
        new Set(clue.source_ids).size !== clue.source_ids.length) fail("requires individual notes and sources");
      for (const id of clue.source_ids) {
        const source = ledger.sources[id];
        if (!nonempty(source?.title) || !nonempty(source?.section) || !date(source?.accessed_at) ||
          !source?.url?.startsWith("https://")) fail(`has incomplete source ${id}`);
      }
    }
  }
}

export function validateDifficultyAudit(data, rows, review) {
  const fail = message => { throw new Error(`Case difficulty audit: ${message}`); };
  if (review?.status !== "editorial_estimate" || !review.assessed_by || !review.assessed_at ||
    !Array.isArray(review.sources) || !review.sources.length ||
    review.sources.some(source => !source.title || !source.url?.startsWith("https://") || !source.use)) fail("missing attribution or calibration sources");
  if (!Array.isArray(review.ratings) || review.ratings.length !== rows.length) fail("incomplete rating coverage");
  const ratings = new Map(review.ratings.map(item => [item.caseId, item]));
  const clinical = new Map(rows.map(row => [Number(row.id), row]));
  if (ratings.size !== rows.length) fail("duplicate rating records");
  for (const item of data.cases) {
    const record = ratings.get(item.caseId);
    if (!record || record.hardness !== item.hardness || record.diagnosis !== clinical.get(item.caseId)?.diagnosis) fail(`stale rating or diagnosis in case ${item.caseId}`);
    if (typeof record.reason !== "string" || !record.reason.trim()) fail(`missing rationale in case ${item.caseId}`);
  }
}

if (import.meta.main) {
  const { run, rows, revision, hardness } = loadApp();
  run(`
    for (const item of CASES) {
      currentCase = item;
      for (const type of Object.keys(GAME_LABELS)) for (const level of Object.keys(DIFFICULTY_LABELS)) {
        gameType = type;
        difficulty = level;
        for (const answer of [item.diagnosis, item.icdCode, ...item.aliases]) {
          if (!isCorrect(answer)) throw new Error("Rejected answer in case " + item.id);
        }
      }
    }
  `);
  console.log(`Validated ${rows.length} cases in both game types: familiarity ratings, categories, six-clue banks, code format, answer collisions and grading in all difficulties.`);
  if (Deno.args.includes("--internal")) {
    const ledger = JSON.parse(Deno.readTextFileSync(new URL("../.internal/medical-review.json", import.meta.url)));
    validateInternal(rows, ledger);
    validateClueAudit(rows, ledger);
    validateTreatmentAudit(rows, revision, ledger);
    const difficultyReview = JSON.parse(Deno.readTextFileSync(new URL("../.internal/case-hardness-review.json", import.meta.url)));
    validateDifficultyAudit(hardness, rows, difficultyReview);
    const count = (status) => ledger.cases.filter((record) => record.status === status).length;
    console.log(`Internal ledger matches current content: ${count("source_checked")} source-checked; ${count("pending")} pending; ${count("clinically_reviewed")} clinician sign-offs.`);
    console.log(`Complete editorial clue coverage: ${rows.length * 6} individually recorded checks. No clinical sign-off inferred.`);
    console.log(`Complete treatment coverage: ${revision.cases.length * 6} individually recorded checks, with current explanations and case context.`);
    console.log(`Familiarity calibration: ${hardness.cases.length} current editorial ratings with individual rationales; not learner-measured difficulty.`);
  }
}
