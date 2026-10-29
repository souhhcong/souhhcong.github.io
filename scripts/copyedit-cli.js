import {
  BASE,
  collectEdits,
  combineReports,
  decideEdits,
  languageFlags,
  loadBank,
  makePlan,
  POLICY,
  readDraft,
  saveArtifact,
  savePlan,
  saveReport,
  sha,
  stageReport,
  validateOutput,
  validatePlan,
} from "./vietnamese-copyedit.js";
import { requestCopyedit } from "./language-api.js";
import { importFeedback, reviewTargetsFrom } from "./language-feedback.js";

const read = async (path) => JSON.parse(await Deno.readTextFile(path));
const fail = (message) => {
  throw new Error(`Copyedit CLI: ${message}`);
};
const argv = [...Deno.args];
const command = argv.shift() ?? "plan";
const options = {};
for (const arg of argv) {
  const m = arg.match(/^--([a-z-]+)=(.+)$/);
  if (!m || Object.hasOwn(options, m[1])) {
    fail("use unique --option=value arguments");
  }
  options[m[1]] = m[2];
}
const allowed = {
  template: ["id"],
  plan: ["ids", "draft", "run", "language", "feedback"],
  ingest: ["plan", "input"],
  review: ["editor", "phase", "reverse"],
  stage: ["editor", "meaning", "naturalness", "reverse", "facts", "run"],
  run: ["ids", "draft", "run", "language", "limit", "max-calls", "feedback"],
  capture: ["url", "id", "title", "locator", "fields", "excerpt-file"],
  "proofread": ["english", "vietnamese", "run"],
  feedback: ["run"],
};
if (
  !allowed[command] ||
  Object.keys(options).some((k) => !allowed[command].includes(k))
) fail("unknown command or option");
const bank = loadBank();
function select() {
  if (options.draft && options.ids) fail("choose --draft or --ids");
  if (options.draft) {
    const d = readDraft(options.draft, bank);
    return { conditions: [d.condition], evidence: d.evidence };
  }
  const ids = options.ids
    ? options.ids.split(",").map(Number)
    : POLICY.pilotIds;
  if (
    !ids.length || new Set(ids).size !== ids.length ||
    ids.some((id) => !bank.conditions.some((c) => c.caseId === id))
  ) fail("invalid or duplicate IDs");
  return {
    conditions: ids.map((id) => bank.conditions.find((c) => c.caseId === id)),
    evidence: [],
  };
}
function originals(plan) {
  return plan.conditions.map((c) => {
    const live = bank.conditions.find((x) => x.caseId === c.caseId);
    if (c.kind === "existing") return live ?? fail("case no longer exists");
    // Draft review packets retain the exact clinical/revision baseline. Hardness is
    // read from the original draft when staging/running via --draft.
    return { ...c, hardness: { caseId: c.caseId, hardness: 3 } };
  });
}
if (command === "feedback") {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.run ?? "")) {
    fail("feedback requires --run=COMPARISON_ID");
  }
  const dir = new URL(`comparisons/${options.run}/`, BASE);
  const result = importFeedback({
    markdown: await Deno.readTextFile(new URL("PROOFREAD.md", dir)),
    sheet: await read(new URL("proofread.json", dir)),
    answerKey: await read(new URL("answer-key.json", dir)),
    unchangedMarkdown: await Deno.readTextFile(
      new URL("UNCHANGED-CHECKS.md", dir),
    ),
  });
  console.log(
    (await saveArtifact(`feedback/${sha(result)}.json`, result)).pathname,
  );
  console.log(JSON.stringify(result.summary));
} else if (command === "template") {
  const id = Number(options.id);
  if (
    !Number.isSafeInteger(id) || id < 1 ||
    bank.conditions.some((c) => c.caseId === id)
  ) fail("template requires an unused positive --id");
  const clinical = Object.fromEntries(
    Object.keys(bank.conditions[0].clinical).map(
      (k) => [k, k === "id" ? String(id) : ""],
    ),
  );
  const condition = {
    caseId: id,
    clinical,
    revision: {
      caseId: id,
      categoryIds: [],
      treatmentClues: Array(6).fill(""),
      treatmentExplanation: "",
    },
    hardness: { caseId: id, hardness: 3 },
    kind: "new",
  };
  console.log(
    (await saveArtifact(`intake/${id}.json`, {
      version: 1,
      condition,
      evidence: [],
    })).pathname,
  );
} else if (command === "plan") {
  const { conditions } = select();
  const plan = makePlan({
    phase: "editor",
    conditions,
    run: options.run ?? "default",
    promptLanguage: options.language ?? "en",
    reviewTargets: options.feedback
      ? reviewTargetsFrom(await read(options.feedback), conditions)
      : [],
  });
  // Hardness is administrative/provisional; never exposed to the copyeditor.
  const url = await savePlan(plan);
  console.log(url.pathname);
  if (options.draft) {
    await saveArtifact(
      `drafts/${plan.cacheKey}.json`,
      readDraft(options.draft, bank),
    );
  }
} else if (command === "ingest") {
  if (!options.plan || !options.input) {
    fail("ingest requires --plan and --input");
  }
  const plan = validatePlan(await read(options.plan));
  console.log((await saveReport(plan, await read(options.input))).pathname);
} else if (command === "review") {
  if (
    !options.editor ||
    !["meaning", "naturalness", "facts"].includes(options.phase) ||
    options.reverse && !["true", "false"].includes(options.reverse)
  ) fail("review requires --editor and --phase=meaning|naturalness|facts");
  const editor = await read(options.editor);
  validateOutput(editor.plan, editor.output);
  const conditions = originals(editor.plan),
    edits = collectEdits(editor.plan, editor.output);
  let evidence = [];
  if (options.phase === "facts") {
    const d = await read(new URL(`drafts/${editor.plan.cacheKey}.json`, BASE));
    evidence = d.evidence;
  }
  const plan = makePlan({
    phase: options.phase,
    conditions,
    edits,
    evidence,
    run: `review-${sha(editor.plan.cacheKey).slice(0, 12)}`,
    reverse: options.reverse === "true",
  });
  console.log((await savePlan(plan)).pathname);
} else if (command === "stage") {
  for (const k of ["editor", "meaning", "naturalness", "reverse"]) {
    if (!options[k]) fail(`stage requires --${k}`);
  }
  const reports = Object.fromEntries(
    await Promise.all(
      [
        "editor",
        "meaning",
        "naturalness",
        "reverse",
        ...(options.facts ? ["facts"] : []),
      ].map(async (k) => [k, await read(options[k])]),
    ),
  );
  let conditions = originals(reports.editor.plan);
  if (conditions.some((c) => c.kind === "new")) {
    conditions = [
      (await read(new URL(`drafts/${reports.editor.plan.cacheKey}.json`, BASE)))
        .condition,
    ];
  }
  const report = decideEdits({ ...reports, conditions });
  console.log(
    (await stageReport(report, options.run ?? reports.editor.plan.run))
      .pathname,
  );
  console.log(JSON.stringify(report.summary));
} else if (command === "run") {
  const { conditions, evidence } = select();
  const limit = Number(options.limit ?? 20),
    maxCalls = Number(options["max-calls"] ?? 80);
  if (
    !Number.isSafeInteger(limit) || limit < 1 || conditions.length > limit ||
    !Number.isSafeInteger(maxCalls) || maxCalls < 0
  ) fail("explicit limit/max-calls exceeded");
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    fail(
      "OPENAI_API_KEY is absent. Use native plan/ingest/review/stage handoffs, or configure the optional API transport.",
    );
  }
  let calls = 0;
  const execute = async (plan) => {
    await savePlan(plan);
    try {
      const cached = await read(new URL(`cache/${plan.cacheKey}.json`, BASE));
      validateOutput(plan, cached.output);
      return cached;
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
    }
    if (calls >= maxCalls) {
      fail("maximum API call budget reached; completed responses are cached");
    }
    const pending = new URL(`pending/${plan.cacheKey}.json`, BASE);
    try {
      await Deno.stat(pending);
      fail(
        "request receipt already exists without a cached result; inspect the API run before retrying with a new run ID",
      );
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
    }
    await saveArtifact(`pending/${plan.cacheKey}.json`, {
      cacheKey: plan.cacheKey,
      requestedAt: new Date().toISOString(),
      model: plan.model,
    });
    calls++;
    const result = await requestCopyedit(plan, { apiKey });
    await saveReport(plan, result.output, result.transport);
    return { plan, ...result };
  };
  const run = options.run ?? "default", summaries = [], reports = [];
  const feedback = options.feedback ? await read(options.feedback) : null;
  for (const c of conditions) {
    const editor = await execute(
      makePlan({
        phase: "editor",
        conditions: [c],
        run,
        promptLanguage: options.language ?? "en",
        reviewTargets: feedback ? reviewTargetsFrom(feedback, [c]) : [],
      }),
    );
    const edits = collectEdits(editor.plan, editor.output);
    const reviews = {};
    for (
      const [key, phase, reverse] of [["meaning", "meaning", false], [
        "naturalness",
        "naturalness",
        false,
      ], ["reverse", "naturalness", true]]
    ) {
      const plan = makePlan({ phase, conditions: [c], edits, run, reverse });
      if (edits.length) reviews[key] = await execute(plan);
      else {
        await savePlan(plan);
        const output = { decisions: [] },
          transport = { kind: "empty_edit_set_no_model_call" };
        await saveReport(plan, output, transport);
        reviews[key] = { plan, output, transport };
      }
    }
    const facts = c.kind === "new"
      ? await execute(
        makePlan({ phase: "facts", conditions: [c], evidence, run }),
      )
      : null;
    const report = decideEdits({ editor, ...reviews, facts, conditions: [c] });
    await saveArtifact(`decisions/${editor.plan.cacheKey}.json`, report);
    reports.push(report);
    summaries.push({ caseId: c.caseId, ...report.summary });
    console.log(JSON.stringify(summaries.at(-1)));
  }
  const location = await stageReport(combineReports(reports), run);
  await saveArtifact(`runs/${run}.json`, {
    run,
    summaries,
    location: location.pathname,
  });
  console.log(
    JSON.stringify({
      apiCallsThisExecution: calls,
      location: location.pathname,
    }),
  );
} else if (command === "capture") {
  for (const k of ["url", "id", "title", "locator", "fields", "excerpt-file"]) {
    if (!options[k]) fail(`capture requires --${k}`);
  }
  const url = new URL(options.url);
  if (url.protocol !== "https:" || url.username || url.password) {
    fail("source URL must be public HTTPS without credentials");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) fail(`source retrieval failed: HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!/text\/|application\/json/.test(type)) {
    fail(
      "capture supports text/HTML/JSON; use a trusted extractor for PDF and preserve its source receipt separately",
    );
  }
  const snapshotText = await response.text(),
    excerpt = await Deno.readTextFile(options["excerpt-file"]);
  if (!snapshotText.includes(excerpt.trim())) {
    fail("excerpt must appear verbatim in the retrieved source snapshot");
  }
  const receipt = {
    id: options.id,
    url: response.url,
    title: options.title,
    locator: options.locator,
    fields: options.fields.split(","),
    snapshotText,
    excerpt: excerpt.trim(),
    snapshotSha256: sha(snapshotText),
    capturedAt: new Date().toISOString(),
  };
  console.log(
    (await saveArtifact(`evidence/${sha(receipt)}.json`, receipt)).pathname,
  );
} else {
  if (!options.english || !options.vietnamese) {
    fail("proofread requires --english and --vietnamese editor reports");
  }
  const en = await read(options.english), vi = await read(options.vietnamese);
  validateOutput(en.plan, en.output);
  validateOutput(vi.plan, vi.output);
  if (
    en.plan.promptLanguage !== "en" || vi.plan.promptLanguage !== "vi" ||
    JSON.stringify(en.plan.conditions) !== JSON.stringify(vi.plan.conditions) ||
    en.plan.model !== vi.plan.model || en.plan.reasoning !== vi.plan.reasoning
  ) {
    fail(
      "comparison must use matched conditions/model/effort with en and vi prompts",
    );
  }
  const editsA = collectEdits(en.plan, en.output),
    editsB = collectEdits(vi.plan, vi.output);
  const fields = [
    ...new Set([...editsA, ...editsB].map((e) => `${e.caseId}:${e.field}`)),
  ];
  const answerKey = [], sheet = [];
  for (const key of fields) {
    const [id, ...rest] = key.split(":"),
      field = rest.join(":"),
      c = en.plan.conditions.find((c) => c.caseId === Number(id));
    const original = field.split(".").reduce((v, k) => v[k], c);
    const variants = [{ origin: "original", text: original }, {
      origin: "english_prompt",
      text: editsA.find((e) =>
        e.caseId === c.caseId && e.field === field
      )?.after ?? original,
    }, {
      origin: "vietnamese_prompt",
      text: editsB.find((e) =>
        e.caseId === c.caseId && e.field === field
      )?.after ?? original,
    }];
    const order = variants.map((v) => ({ ...v, order: sha([key, v.origin]) }))
      .sort((a, b) => a.order.localeCompare(b.order));
    answerKey.push({
      caseId: c.caseId,
      field,
      choices: order.map((v, i) => ({
        label: ["A", "B", "C"][i],
        origin: v.origin,
      })),
    });
    sheet.push({
      caseId: c.caseId,
      diagnosis: c.clinical.diagnosis,
      field,
      choices: order.map((v, i) => ({
        label: ["A", "B", "C"][i],
        text: v.text,
      })),
      preferred: null,
      comment: "",
    });
  }
  const run = options.run ?? "prompt-comparison";
  await saveArtifact(`comparisons/${run}/proofread.json`, {
    instructions:
      "Choose A/B/C, tie, or none. Judge naturalness and meaning. Leave uncertain items blank; variants may legitimately be identical. Origins are concealed in a separate key.",
    items: sheet,
  });
  await saveArtifact(`comparisons/${run}/answer-key.json`, answerKey);
  const md = [
    "# So sánh cách diễn đạt",
    "",
    "Chọn A, B, C; có thể chọn ngang nhau hoặc không chọn câu nào. Đánh giá độ tự nhiên và việc giữ đúng ý. Các phương án có thể trùng nhau. Không cần xem tệp đáp án.",
    "",
  ];
  sheet.forEach((s, i) => {
    md.push(
      `## ${i + 1}. ${s.diagnosis} — ${s.field}`,
      "",
      ...s.choices.flatMap((v) => [`**${v.label}.** ${v.text}`, ""]),
      "Lựa chọn: ___  Ghi chú: ___",
      "",
    );
  });
  const writeInitialText = async (name, text) => {
    try {
      await Deno.writeTextFile(
        new URL(`comparisons/${run}/${name}`, BASE),
        text,
        { createNew: true },
      );
    } catch (e) {
      if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
    }
  };
  await writeInitialText("PROOFREAD.md", md.join("\n"));
  const flags = new Map(
    en.plan.conditions.flatMap(languageFlags).map(
      (f) => [`${f.caseId}:${f.field}`, f],
    ),
  );
  for (const target of en.plan.reviewTargets ?? []) {
    flags.set(`${target.caseId}:${target.field}`, {
      ...target,
      text: target.before,
    });
  }
  await writeInitialText(
    "UNCHANGED-CHECKS.md",
    [
      "# Kiểm tra các câu có thể bị bỏ sót",
      "",
      "Đây là dấu hiệu cần xem lại trong ngữ cảnh, không phải kết luận câu sai. Ghi câu đã ổn, hoặc nêu vấn đề còn lại.",
      "",
      ...[...flags.values()].flatMap(
        (f) => [
          `## ${f.caseId} — ${f.field}`,
          "",
          f.text,
          "",
          "Ghi chú / đề xuất: ___",
          "",
        ],
      ),
    ].join("\n"),
  );
  console.log(new URL(`comparisons/${run}/PROOFREAD.md`, BASE).pathname);
}
