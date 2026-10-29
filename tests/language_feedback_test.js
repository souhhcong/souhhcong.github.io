import {
  importFeedback,
  parseProofreading,
  parseUnchangedChecks,
  reviewTargetsFrom,
} from "../scripts/language-feedback.js";
import {
  editableFields,
  loadBank,
  makePlan,
  validateOutput,
} from "../scripts/vietnamese-copyedit.js";
const assert = (v) => {
  if (!v) throw new Error("assertion failed");
};
const rejects = (fn) => {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error("invalid feedback accepted");
};
const sheet = {
  items: [{
    caseId: 1,
    diagnosis: "Test",
    field: "clinical.summary",
    choices: [{ label: "A", text: "Better" }, { label: "B", text: "Better" }, {
      label: "C",
      text: "Original",
    }],
  }],
};
const key = [{
  caseId: 1,
  field: "clinical.summary",
  choices: [{ label: "A", origin: "vietnamese_prompt" }, {
    label: "B",
    origin: "english_prompt",
  }, { label: "C", origin: "original" }],
}];
const md =
  "# Review\n\n## 1. Test — clinical.summary\n\n**A.** Better\n\n**B.** Better\n\n**C.** Original\n\nLựa chọn: A  Ghi chú: Still awkward.\n";
const unchanged =
  "## 1 — clinical.summary\n\nOriginal\n\nGhi chú / đề xuất: Sounds awkward\n\n## 2 — clinical.clue1\n\nControl\n\nGhi chú / đề xuất: OK\n";

Deno.test("identical selected variants receive tied credit without becoming final approvals", () => {
  const r = parseProofreading(md, sheet, key);
  assert(
    r.summary.ties === 1 && r.summary.englishWins === 0 &&
      r.summary.vietnameseWins === 0,
  );
  assert(
    r.items[0].finalApproval === false &&
      r.items[0].comment === "Still awkward.",
  );
});
Deno.test("comparisons reject altered options, unknown choices and missing or duplicate entries", () => {
  for (
    const bad of [
      md.replace("**A.** Better", "**A.** Changed"),
      md.replace("Lựa chọn: A", "Lựa chọn: Z"),
      "# Empty",
      md + md,
    ]
  ) rejects(() => parseProofreading(bad, sheet, key));
});
Deno.test("explicit ties, abstentions and multiline comments stay distinct", () => {
  const tie = parseProofreading(
    md.replace("Lựa chọn: A", "Lựa chọn: A=B"),
    sheet,
    key,
  );
  assert(tie.summary.ties === 1);
  const none = parseProofreading(
    md.replace("Lựa chọn: A", "Lựa chọn: none"),
    sheet,
    key,
  );
  assert(none.summary.abstentions === 1);
  const multiline = parseProofreading(
    md.replace("Still awkward.", "Still awkward.\nMore detail."),
    sheet,
    key,
  );
  assert(multiline.items[0].comment.includes("More detail."));
});
Deno.test("JSON preferences are supported and conflicting formats stop import", () => {
  const json = structuredClone(sheet);
  json.items[0].preferred = "A";
  json.items[0].comment = "Still awkward.";
  const blank = md.replace(
    "Lựa chọn: A  Ghi chú: Still awkward.",
    "Lựa chọn: ___  Ghi chú: ___",
  );
  assert(parseProofreading(blank, json, key).summary.ties === 1);
  rejects(() =>
    parseProofreading(md.replace("Lựa chọn: A", "Lựa chọn: C"), json, key)
  );
});
Deno.test("unchanged-field feedback preserves negative controls and is not clinical approval", () => {
  const r = parseUnchangedChecks(unchanged);
  assert(
    r[0].status === "reported_issue" && r[1].status === "explicit_no_problem",
  );
  assert(r.every((x) => x.clinicalApproval === false));
  rejects(() => parseUnchangedChecks(unchanged + unchanged));
});
Deno.test("feedback import is deterministic, immutable by hash and separates preferences from approval", () => {
  const input = {
    markdown: md,
    sheet,
    answerKey: key,
    unchangedMarkdown: unchanged,
  };
  const a = importFeedback(input), b = importFeedback(input);
  assert(
    JSON.stringify(a) === JSON.stringify(b) && a.summary.finalApprovals === 0,
  );
  assert(a.summary.unchangedIssues === 1 && a.summary.unchangedControls === 1);
  assert(
    a.sourceHashes.markdown !==
      importFeedback({ ...input, markdown: md + "\n" }).sourceHashes.markdown,
  );
});
Deno.test("known human issues cannot silently return as unchanged natural fields", () => {
  const c = loadBank().conditions[0], field = "clinical.summary";
  const feedback = {
    scope: "wording_preferences_only_not_clinical_sign_off",
    items: [],
    unchanged: [{
      caseId: 1,
      field,
      before: c.clinical.summary,
      comment: "Awkward",
      status: "reported_issue",
    }],
  };
  const targets = reviewTargetsFrom(feedback, [c]);
  const plan = makePlan({
    phase: "editor",
    conditions: [c],
    reviewTargets: targets,
  });
  const output = {
    conditions: [{
      caseId: 1,
      edits: [],
      notes: [],
      checks: Object.keys(editableFields(c)).map((field) => ({
        field,
        verdict: "natural",
        reason: "Test.",
      })),
    }],
  };
  rejects(() => validateOutput(plan, output));
  output.conditions[0].checks.find((c) => c.field === field).verdict =
    "uncertain";
  validateOutput(plan, output);
  const stale = structuredClone(feedback);
  stale.unchanged[0].before = "Old text";
  rejects(() => reviewTargetsFrom(stale, [c]));
  rejects(() =>
    makePlan({
      phase: "editor",
      conditions: [c],
      reviewTargets: [...targets, ...targets],
    })
  );
});
