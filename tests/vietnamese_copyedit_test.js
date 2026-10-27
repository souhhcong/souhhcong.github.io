import {
  collectEdits,
  combineReports,
  decideEdits,
  editableFields,
  factFieldsFor,
  guardEdit,
  languageFlags,
  loadBank,
  makePlan,
  normalize,
  saveArtifact,
  sha,
  validateCondition,
  validateEvidence,
  validateOutput,
  validatePlan,
} from "../scripts/vietnamese-copyedit.js";
import { requestCopyedit } from "../scripts/language-api.js";

const assert = (v, m = "assertion failed") => {
  if (!v) throw new Error(m);
};
const throws = (fn) => {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error("invalid input accepted");
};
const rejects = async (fn) => {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error("invalid input accepted");
};
const bank = loadBank();
const condition = bank.conditions.find((c) => c.caseId === 31);
const edit = {
  field: "clinical.pearl1_text",
  before: condition.clinical.pearl1_text,
  after: condition.clinical.pearl1_text.replace(
    "Màu đàm đơn độc chưa đủ để xác định tác nhân hoặc chọn kháng sinh.",
    "Không thể xác định tác nhân hoặc chọn kháng sinh chỉ dựa vào màu đàm.",
  ),
  reason: "More natural wording.",
};
function reports(c = condition, proposals = [edit]) {
  const conditions = [c];
  const plan = makePlan({
    phase: "editor",
    conditions,
    run: "test",
    promptLanguage: "vi",
  });
  const editor = {
    plan,
    output: { conditions: [{ caseId: c.caseId, edits: proposals, notes: [] }] },
  };
  const edits = collectEdits(plan, editor.output);
  const meaningPlan = makePlan({
    phase: "meaning",
    conditions,
    edits,
    run: "blind",
  });
  const meaning = {
    plan: meaningPlan,
    output: {
      decisions: edits.map((e) => ({
        editId: e.editId,
        verdict: "preserved",
        reason: "Test verdict.",
      })),
    },
  };
  const style = (reverse) => {
    const p = makePlan({
      phase: "naturalness",
      conditions,
      edits,
      reverse,
      run: "blind",
    });
    return {
      plan: p,
      output: {
        decisions: p.pairs.map((pair) => ({
          editId: pair.editId,
          preference:
            pair.A === edits.find((e) => e.editId === pair.editId).after
              ? "A"
              : "B",
          reason: "Test preference.",
        })),
      },
    };
  };
  return {
    editor,
    meaning,
    naturalness: style(false),
    reverse: style(true),
    conditions,
  };
}

Deno.test("copyedit plans match context/model/effort across languages and bind cache to prompts", () => {
  const en = makePlan({
    phase: "editor",
    conditions: [condition],
    promptLanguage: "en",
  });
  const vi = makePlan({
    phase: "editor",
    conditions: [condition],
    promptLanguage: "vi",
  });
  assert(en.model === vi.model && en.reasoning === vi.reasoning);
  assert(JSON.stringify(en.conditions) === JSON.stringify(vi.conditions));
  assert(en.cacheKey !== vi.cacheKey && en.instructions !== vi.instructions);
  const stale = structuredClone(en);
  stale.instructions += "x";
  throws(() => validatePlan(stale));
  throws(() =>
    makePlan({ phase: "editor", conditions: Array(21).fill(condition) })
  );
});
Deno.test("editor rejects omitted IDs, extra keys, protected fields, stale text and duplicate edits", () => {
  const r = reports();
  const bad = [{ conditions: [] }, {
    conditions: [{ caseId: 31, edits: [], notes: [], extra: true }],
  }, {
    conditions: [{
      caseId: 31,
      edits: [{ ...edit, field: "clinical.diagnosis" }],
      notes: [],
    }],
  }, {
    conditions: [{
      caseId: 31,
      edits: [{ ...edit, before: "wrong" }],
      notes: [],
    }],
  }, { conditions: [{ caseId: 31, edits: [edit, edit], notes: [] }] }];
  bad.forEach((o) => throws(() => validateOutput(r.editor.plan, o)));
  assert(!Object.hasOwn(editableFields(condition), "clinical.diagnosis"));
});
Deno.test("guards preserve quantities, units, polarity, drugs, uncertainty and identity", () => {
  const c = bank.conditions[0];
  for (
    const [before, after, flag] of [
      ["Dùng 5 mg", "Dùng 50 mg", "numbers_changed"],
      ["Dùng 5 mg", "Dùng 5 kg", "units_changed"],
      ["SpO2 < 90%", "SpO2 > 90%", "comparators_changed"],
      ["Không dùng thuốc", "Dùng thuốc", "negation_count_changed"],
      ["Dùng aspirin", "Dùng thuốc", "protected_term_changed:aspirin"],
      ["Có thể dùng thuốc", "Dùng thuốc", "protected_term_changed:có thể"],
      ["NS1 dương tính", "PCR dương tính", "acronyms_changed"],
    ]
  ) assert(guardEdit({ before, after }, c).includes(flag), flag);
  assert(guardEdit(edit, condition).length === 0);
  assert(normalize(" ĐÀM  ") === "đàm");
});
Deno.test("blinded pair order reverses without exposing candidate origin or editor rationale", () => {
  const r = reports(),
    a = r.naturalness.plan.pairs[0],
    b = r.reverse.plan.pairs[0];
  assert(a.A === b.B && a.B === b.A);
  assert(!JSON.stringify(r.naturalness.plan).includes(edit.reason));
  assert(r.naturalness.plan.edits.length === 0);
  assert(!Object.hasOwn(a, "candidateIsA"));
});
Deno.test("only preserved edits preferred in both orders become candidates; originals stay immutable", () => {
  const before = JSON.stringify(condition), r = reports();
  const result = decideEdits(r);
  assert(result.summary.acceptedEdits === 1);
  assert(result.candidates[0].clinical.pearl1_text === edit.after);
  assert(JSON.stringify(condition) === before);
  assert(
    result.candidates[0].hardness.hardness === condition.hardness.hardness,
  );
  for (const verdict of ["changed", "uncertain"]) {
    const x = reports();
    x.meaning.output.decisions[0].verdict = verdict;
    assert(decideEdits(x).accepted.length === 0);
  }
  for (const preference of ["tie", "uncertain"]) {
    const x = reports();
    x.reverse.output.decisions[0].preference = preference;
    assert(decideEdits(x).accepted.length === 0);
  }
});
Deno.test("ambiguity notes and any unresolved edit block the whole condition", () => {
  const r = reports();
  r.editor.output.conditions[0].notes = ["Clinical intent unclear."];
  assert(decideEdits(r).accepted.length === 0);
  const r2 = reports(condition, [edit, {
    field: "clinical.pearl2_text",
    before: condition.clinical.pearl2_text,
    after: condition.clinical.pearl2_text + " ",
    reason: "Test only.",
  }]);
  r2.meaning.output.decisions[1].verdict = "uncertain";
  const result = decideEdits(r2);
  assert(result.accepted.length === 0 && result.summary.retainedEdits === 2);
});
Deno.test("reviews of different edits or changed source contexts cannot approve a candidate", () => {
  const r = reports();
  r.meaning.plan.edits[0].after += " khác";
  const { cacheKey: _cacheKey, ...payload } = r.meaning.plan;
  r.meaning.plan.cacheKey = sha(payload);
  throws(() => decideEdits(r));
  const r2 = reports();
  r2.conditions = structuredClone(r2.conditions);
  r2.conditions[0].revision.treatmentExplanation += " khác";
  throws(() => decideEdits(r2));
});
Deno.test("unchanged flagged phrasing remains visible for false-negative review", () => {
  const flags = languageFlags(bank.conditions.find((c) => c.caseId === 116));
  assert(flags.some((f) => f.text.includes("đơn độc chưa đủ")));
});
Deno.test("new IDs, exact fields, alias collisions and clue giveaways use real bank validators", () => {
  throws(() =>
    validateCondition({ ...condition, kind: "new" }, bank, { draft: true })
  );
  const changed = structuredClone(condition);
  changed.clinical.extra = "x";
  throws(() => validateCondition(changed, bank));
  const giveaway = structuredClone(condition);
  giveaway.clinical.clue1 = giveaway.clinical.diagnosis;
  throws(() => validateCondition(giveaway, bank));
});
Deno.test("evidence receipts require snapshots and full in-scope field coverage", () => {
  const fields = factFieldsFor(condition);
  const receipt = {
    id: "test-source",
    title: "Synthetic test only",
    locator: "Test paragraph",
    url: "https://example.org/test",
    snapshotText: "Test source",
    excerpt: "Test source",
    snapshotSha256: sha("Test source"),
    capturedAt: "2026-10-27T00:00:00Z",
    fields,
    caseIds: [31],
  };
  validateEvidence([receipt]);
  throws(() => validateEvidence([{ ...receipt, snapshotSha256: "fake" }]));
  throws(() => validateEvidence([{ ...receipt, excerpt: "not retrieved" }]));
  const plan = makePlan({
    phase: "facts",
    conditions: [condition],
    evidence: [receipt],
  });
  const output = {
    conditions: [{
      caseId: 31,
      verdict: "supported",
      coveredFields: fields,
      sourceIds: [receipt.id],
      reason: "Synthetic test only.",
    }],
  };
  validateOutput(plan, output);
  const incomplete = structuredClone(output);
  incomplete.conditions[0].coveredFields.pop();
  throws(() => validateOutput(plan, incomplete));
  const wrongCase = makePlan({
    phase: "facts",
    conditions: [condition],
    evidence: [{ ...receipt, caseIds: [1] }],
  });
  throws(() => validateOutput(wrongCase, output));
});
Deno.test("new conditions require separate supported evidence even with no language edits", () => {
  const c = structuredClone(condition);
  c.kind = "new";
  const r = reports(c, []), result = decideEdits(r);
  assert(
    result.summary.readyNewConditions === 0 &&
      result.blockedCases[0].reason === "source_review_not_supported",
  );
});
Deno.test("complete source review permits a structurally valid new candidate without inventing sign-off", () => {
  const c = structuredClone(condition);
  c.kind = "new";
  c.caseId = 401;
  c.clinical.id = "401";
  c.clinical.diagnosis = "Bệnh thử nghiệm";
  c.clinical.aliases = "Synthetic condition";
  c.clinical.icd_code = "Z99.9";
  c.clinical.icd_label = "Synthetic test only";
  c.revision.caseId = 401;
  c.hardness.caseId = 401;
  validateCondition(c, bank, { draft: true });
  const r = reports(c, []), fields = factFieldsFor(c);
  r.facts = {
    plan: makePlan({
      phase: "facts",
      conditions: [c],
      evidence: [{
        id: "test",
        fields,
        caseIds: [401],
        title: "Synthetic test only",
        locator: "Test paragraph",
        url: "https://example.org/test",
        snapshotText: "Synthetic test",
        excerpt: "Synthetic test",
        snapshotSha256: sha("Synthetic test"),
        capturedAt: "2026-10-27T00:00:00Z",
      }],
    }),
    output: {
      conditions: [{
        caseId: 401,
        verdict: "supported",
        coveredFields: fields,
        sourceIds: ["test"],
        reason: "Mock verdict only; not a medical assertion.",
      }],
    },
  };
  const result = decideEdits(r);
  assert(
    result.summary.readyNewConditions === 1 &&
      result.status === "automatically_copyedited_not_clinically_certified",
  );
});
Deno.test("combined staging aggregates disjoint decisions and rejects overlapping conditions", () => {
  const a = decideEdits(reports()),
    b = decideEdits(reports(bank.conditions[0], []));
  const combined = combineReports([a, b]);
  assert(
    combined.summary.conditions === 2 && combined.summary.acceptedEdits === 1 &&
      combined.candidates.length === 2,
  );
  throws(() => combineReports([a, a]));
});
Deno.test("artifact paths cannot escape the private directory", async () => {
  await rejects(() => saveArtifact("../../escape.json", {}));
  await rejects(() => saveArtifact("/tmp/escape.json", {}));
});

function apiResponse(output, extra = {}) {
  return new Response(
    JSON.stringify({
      status: "completed",
      id: "test",
      model: "test-model",
      usage: { input_tokens: 12, output_tokens: 5 },
      output: [{
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(output) }],
      }],
      ...extra,
    }),
    { status: 200 },
  );
}
Deno.test("API uses strict Responses schema, no storage and records actual usage", async () => {
  const r = reports();
  let request;
  const result = await requestCopyedit(r.editor.plan, {
    apiKey: "test-secret",
    fetcher: (_url, opts) => {
      request = JSON.parse(opts.body);
      return Promise.resolve(apiResponse(r.editor.output));
    },
  });
  assert(request.store === false && request.text.format.strict === true);
  assert(
    request.reasoning.effort === "medium" && request.temperature === undefined,
  );
  assert(
    result.transport.actualModel === "test-model" &&
      result.transport.usage.input_tokens === 12,
  );
});
Deno.test("missing key, HTTP errors, incomplete/refused/malformed outputs never accept edits", async () => {
  const r = reports();
  await rejects(() => requestCopyedit(r.editor.plan));
  for (
    const fetcher of [
      () => Promise.resolve(new Response("test-secret", { status: 401 })),
      () =>
        Promise.resolve(apiResponse(r.editor.output, { status: "incomplete" })),
      () =>
        Promise.resolve(
          apiResponse(r.editor.output, {
            output: [{
              type: "message",
              content: [{ type: "refusal", refusal: "No" }],
            }],
          }),
        ),
      () => Promise.resolve(apiResponse({ conditions: [] })),
      () => Promise.reject(new Error("test-secret")),
    ]
  ) {
    try {
      await requestCopyedit(r.editor.plan, { apiKey: "test-secret", fetcher });
      throw new Error("accepted");
    } catch (e) {
      assert(e.message !== "accepted" && !e.message.includes("test-secret"));
    }
  }
});
