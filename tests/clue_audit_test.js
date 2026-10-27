import { createHash } from "node:crypto";
import { loadApp } from "../scripts/app-harness.js";
import { validateClueAudit } from "../scripts/validate-cases.js";

const hash = (text) => createHash("sha256").update(text).digest("hex");
function fixture() {
  const row = loadApp().rows[0];
  return {
    rows: [row],
    ledger: {
      sources: {reference: {title:"Test reference", section:"Diagnosis", accessed_at:"2026-10-26", url:"https://example.org/reference"}},
      cases: [{case_id:Number(row.id), clue_audit: {
        status:"editorial_complete", checked_by:"Test editorial check",
        started_at:"2026-10-25", completed_at:"2026-10-26",
        case_content_sha256:hash(JSON.stringify(Object.values(row))),
        clues:Array.from({length:6}, (_, i) => {
          const field = `clue${i + 1}`;
          return {field, reviewed_text:row[field], previous_text:row[field], changed:false,
            text_sha256:hash(row[field]), review_note:`Individual test note ${i + 1}`, source_ids:["reference"]};
        }),
      }}],
    },
  };
}
function rejects(mutate, pattern) {
  const data = fixture();
  mutate(data, data.ledger.cases[0].clue_audit);
  try { validateClueAudit(data.rows, data.ledger); } catch (error) {
    if (!pattern.test(error.message)) throw error;
    return;
  }
  throw new Error("Expected invalid clue audit to fail");
}

Deno.test("complete clue audit validates without access to private files", () => {
  const {rows, ledger} = fixture();
  validateClueAudit(rows, ledger);
});

Deno.test("clue audit rejects missing, duplicated or incomplete six-clue coverage", () => {
  rejects((data) => { data.ledger.cases = []; }, /one record per case/);
  rejects((data) => { delete data.ledger.cases[0].clue_audit; }, /missing or incomplete/);
  rejects((_, audit) => { audit.status = "pending"; }, /missing or incomplete/);
  rejects((_, audit) => { audit.clues.pop(); }, /six individual/);
  rejects((_, audit) => { audit.clues[5] = {...audit.clues[0]}; }, /duplicate clue coverage/);
  rejects((_, audit) => { audit.clues[5].field = "summary"; }, /invalid or duplicate/);
});

Deno.test("clue audit becomes stale after clue or surrounding case context changes", () => {
  rejects((data) => { data.rows[0].clue6 += " changed"; }, /stale after case/);
  rejects((data) => { data.rows[0].diagnosis += " changed"; }, /stale after case/);
  rejects((data) => { data.rows[0].summary += " changed"; }, /stale after case/);
  rejects((_, audit) => { audit.clues[0].reviewed_text += " changed"; }, /stale text/);
  rejects((_, audit) => { audit.clues[0].text_sha256 = "stale"; }, /stale text/);
});

Deno.test("clue audit requires traceable notes, sources, attribution and change history", () => {
  rejects((_, audit) => { audit.checked_by = " "; }, /attribution/);
  rejects((_, audit) => { audit.completed_at = "2026-02-30"; }, /ordered dates/);
  rejects((_, audit) => { audit.completed_at = "2026-10-24"; }, /ordered dates/);
  rejects((_, audit) => { audit.clues[0].review_note = " "; }, /individual note/);
  rejects((_, audit) => { audit.clues[0].source_ids = []; }, /source references/);
  rejects((_, audit) => { audit.clues[0].source_ids = ["unknown"]; }, /incomplete source/);
  rejects((data) => { delete data.ledger.sources.reference.section; }, /incomplete source/);
  rejects((_, audit) => { audit.clues[0].changed = true; }, /inconsistent change history/);
});

Deno.test("all six clues reveal in order spending one guess per reveal and leaving a final answer", async () => {
  const {run, nodes} = loadApp();
  await run("init()");
  for (let count = 2; count <= 6; count++) {
    nodes.get("#reveal-button").listeners.get("click")();
    if (run("revealed") !== count || run("attempts.length") !== count - 1 || run("finished")) {
      throw new Error("Clue reveal did not spend exactly one guess or ended the game early");
    }
    const markup = nodes.get("#clue-list").innerHTML;
    const clues = run("currentCase.clues.slice(0, revealed)");
    const positions = clues.map((text) => markup.indexOf(text));
    if (positions.some((position, i) => position < 0 || (i > 0 && position <= positions[i - 1]))) {
      throw new Error("Clues missing or out of order");
    }
  }
  if (!nodes.get("#reveal-button").disabled) throw new Error("Reveal still enabled after six clues");
  nodes.get("#guess-input").value = run("currentCase.icdCode");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  if (!run("finished && attempts.length === 6 && attempts[5].correct")) throw new Error("Answer failed after full reveal");
});
