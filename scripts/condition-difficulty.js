// Offline, pilot-only research pipeline. Never writes the public game bank.
import { loadApp } from "./app-harness.js";

export const ROOT = new URL("../", import.meta.url);
export const RUBRIC = JSON.parse(Deno.readTextFileSync(new URL("difficulty/rubric.json", import.meta.url)));
export const DIMENSIONS = Object.keys(RUBRIC.weights);
export const MODELS = { luna: "gpt-6-luna", terra: "gpt-6.1-terra", sol: "gpt-6.1-sol" };
const fail = (message) => { throw new Error(`Condition familiarity: ${message}`); };
const nonempty = (s) => typeof s === "string" && s.trim().length > 0;
const keysExactly = (o, keys) => o && typeof o === "object" && !Array.isArray(o) &&
  Object.keys(o).length === keys.length && keys.every(k => Object.hasOwn(o, k));
export const normalizeName = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" };
const strings = { type: "array", items: str };
const dimensionSchema = obj({ value: { type: ["integer", "null"], minimum: 0, maximum: 4 },
  basis: { type: "string", enum: ["evidence_backed", "llm_estimate", "unknown"] }, evidenceIds: strings, rationale: str });
export const ASSESSMENT_SCHEMA = obj({ assessments: { type: "array", items: obj({
  caseId: { type: "integer" }, nameStatus: { type: "string", enum: ["resolved", "ambiguous", "subtype_review"] },
  dimensions: obj(Object.fromEntries(DIMENSIONS.map(k => [k, dimensionSchema]))),
  confidence: { type: "string", enum: ["low", "medium", "high"] }, uncertainties: strings,
}) } });
export const PAIR_SCHEMA = obj({ a: { type: "integer" }, b: { type: "integer" },
  moreFamiliar: { type: "string", enum: ["A", "B", "tie", "insufficient_evidence"] }, rationale: str,
  evidenceIds: strings, confidence: { type: "string", enum: ["low", "medium", "high"] } });

export function tier(score) {
  if (!Number.isFinite(score) || score < 0 || score > 100) fail("invalid score");
  return score <= RUBRIC.tierUpperBounds.easy ? "easy" : score <= RUBRIC.tierUpperBounds.medium ? "medium" : "hard";
}

export async function digest(value) {
  function stable(v) {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])]));
    return v;
  }
  const bytes = new TextEncoder().encode(JSON.stringify(stable(value)));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function validateAssessment(assessment, condition, evidence) {
  if (!keysExactly(assessment, ["caseId", "nameStatus", "dimensions", "confidence", "uncertainties"]) ||
      assessment.caseId !== condition.caseId || !["resolved", "ambiguous", "subtype_review"].includes(assessment.nameStatus) ||
      !["low", "medium", "high"].includes(assessment.confidence) || !Array.isArray(assessment.uncertainties) ||
      !assessment.uncertainties.every(nonempty) || !keysExactly(assessment.dimensions, DIMENSIONS)) fail("invalid assessment identity or fields");
  for (const dimension of DIMENSIONS) {
    const d = assessment.dimensions[dimension];
    if (!keysExactly(d, ["value", "basis", "evidenceIds", "rationale"]) || !nonempty(d.rationale) ||
        !Array.isArray(d.evidenceIds) || !d.evidenceIds.every(nonempty) || new Set(d.evidenceIds).size !== d.evidenceIds.length ||
        !["evidence_backed", "llm_estimate", "unknown"].includes(d.basis)) fail(`invalid ${dimension} assessment`);
    if (d.value === null) {
      if (d.basis !== "unknown" || d.evidenceIds.length) fail("missing dimension must be unknown without citations");
    } else if (!Number.isInteger(d.value) || d.value < 0 || d.value > 4 || d.basis === "unknown") fail("invalid dimension value");
    for (const id of d.evidenceIds) {
      const e = evidence.find(x => x.id === id);
      if (!e || !e.caseIds.includes(condition.caseId) || !e.dimensions.includes(dimension)) fail(`unknown or out-of-scope evidence ${id}`);
    }
    if (d.basis === "evidence_backed" && (!d.evidenceIds.length || !d.evidenceIds.some(id => {
      const e = evidence.find(x => x.id === id);
      return e.verified && e.allowedLevels?.[dimension]?.includes(d.value);
    }))) fail(`unverified or unsupported ${dimension} level`);
  }
  return assessment;
}

export function scoreAssessment(a, { humanReviewed = false, repeatScore = null, pairConflict = false } = {}) {
  let rawScore = 0, lower = 0, upper = 0, evidenceCoverage = 0;
  const reviewReasons = [];
  for (const name of DIMENSIONS) {
    const d = a.dimensions[name], weight = RUBRIC.weights[name];
    const value = d.value ?? RUBRIC.missingValue;
    // Sensitivity bounds, NOT statistical confidence intervals.
    const radius = d.basis === "evidence_backed" ? 0.5 : d.basis === "llm_estimate" ? 1 : 2;
    rawScore += weight * value / 4;
    lower += weight * Math.max(0, value - radius) / 4;
    upper += weight * Math.min(4, value + radius) / 4;
    if (d.basis === "evidence_backed") evidenceCoverage += weight;
    if (d.value === null) reviewReasons.push(`missing_${name}`);
  }
  if (!humanReviewed) reviewReasons.push("no_human_review");
  if (evidenceCoverage < RUBRIC.review.minimumEvidenceCoverage) reviewReasons.push("low_evidence_coverage");
  if ([30, 60].some(x => Math.abs(rawScore - x) <= RUBRIC.review.boundaryMargin)) reviewReasons.push("near_tier_boundary");
  if (tier(lower) !== tier(upper)) reviewReasons.push("sensitivity_range_crosses_tiers");
  if (a.nameStatus !== "resolved") reviewReasons.push(a.nameStatus);
  if (a.dimensions.curriculum.value >= 3 && a.dimensions.curriculum.basis !== "evidence_backed") reviewReasons.push("advanced_curriculum_level_lacks_positive_evidence");
  if (repeatScore !== null && Math.abs(rawScore - repeatScore) > RUBRIC.review.repeatDifference) reviewReasons.push("repeat_disagreement");
  if (pairConflict) reviewReasons.push("pairwise_conflict");
  if (a.uncertainties.length) reviewReasons.push("model_reported_uncertainty");
  return { caseId: a.caseId, rawScore, displayScore: Math.round(rawScore / 5) * 5, tier: tier(rawScore),
    sensitivityRange: [lower, upper], possibleTiers: ["easy", "medium", "hard"].filter(t =>
      t === tier(lower) || t === tier(upper) || t === "medium" && lower <= 60 && upper > 30),
    evidenceCoverage, reviewReasons, requiresHumanReview: reviewReasons.length > 0,
    releaseEligible: false, status: "pilot_unvalidated" };
}

export async function buildPlan({ conditions, evidence, sources = [], model = "luna", run = "pilot-1", pair = null, reviewContext = null }) {
  if (!MODELS[model] || !nonempty(run)) fail("unknown model or missing run label");
  if (!conditions.length || conditions.length > 50 || new Set(conditions.map(c => c.caseId)).size !== conditions.length) fail("pilot requires 1-50 unique conditions");
  if (pair && (pair.length !== 2 || pair[0] === pair[1] || pair.some(id => !conditions.some(c => c.caseId === id)))) fail("invalid pair");
  const safeConditions = conditions.map(c => ({ caseId: c.caseId, diagnosisVi: c.diagnosisVi,
    aliases: c.aliases, specialtyIds: c.specialtyIds, identityNote: c.identityNote ?? "" }));
  const selectedEvidence = evidence.filter(e => e.caseIds.some(id => conditions.some(c => c.caseId === id)));
  const luna = Deno.readTextFileSync(new URL("difficulty/luna.md", import.meta.url));
  const terra = Deno.readTextFileSync(new URL("difficulty/terra.md", import.meta.url));
  const payload = { pipelineVersion: "0.1.0", rubric: RUBRIC, model: MODELS[model], reasoning: "medium", run,
    mode: pair ? "pairwise" : "absolute", pair, conditions: safeConditions, evidence: selectedEvidence,
    sources: sources.filter(s => selectedEvidence.some(e => e.sourceId === s.id)),
    approvedAnchors: [], reviewContext, schema: pair ? PAIR_SCHEMA : ASSESSMENT_SCHEMA,
    instructions: model === "terra" || pair ? luna + "\n" + terra : luna };
  return { ...payload, cacheKey: await digest(payload) };
}

export async function validatePlan(plan) {
  const { cacheKey, ...payload } = plan;
  if (cacheKey !== await digest(payload)) fail("stale or tampered plan");
  if (plan.pipelineVersion !== "0.1.0" || JSON.stringify(plan.rubric) !== JSON.stringify(RUBRIC)) fail("rubric mismatch; create a new plan");
  return plan;
}

export function validateResponse(plan, response) {
  if (plan.mode === "pairwise") {
    if (!keysExactly(response, ["a", "b", "moreFamiliar", "rationale", "evidenceIds", "confidence"]) ||
        response.a !== plan.pair[0] || response.b !== plan.pair[1] ||
        !["A", "B", "tie", "insufficient_evidence"].includes(response.moreFamiliar) ||
        !nonempty(response.rationale) || !["low", "medium", "high"].includes(response.confidence) ||
        !Array.isArray(response.evidenceIds) || !response.evidenceIds.every(id => plan.evidence.some(e => e.id === id && e.verified && e.caseIds.some(x => plan.pair.includes(x))))) fail("invalid pairwise result");
    return response;
  }
  if (!keysExactly(response, ["assessments"]) || !Array.isArray(response.assessments) || response.assessments.length !== plan.conditions.length) fail("incomplete batch coverage");
  const seen = new Set();
  for (const a of response.assessments) {
    const c = plan.conditions.find(c => c.caseId === a.caseId);
    if (!c || seen.has(a.caseId)) fail("unknown or duplicate condition");
    seen.add(a.caseId);
    validateAssessment(a, c, plan.evidence);
  }
  return response;
}

export function pairWinner(p) {
  return p.moreFamiliar === "A" ? p.a : p.moreFamiliar === "B" ? p.b : p.moreFamiliar;
}
export function comparePairs(forward, reverse, scores = []) {
  if (forward.a !== reverse.b || forward.b !== reverse.a) fail("pair order was not reversed");
  const a = pairWinner(forward), b = pairWinner(reverse);
  const abstained = [a, b].includes("insufficient_evidence");
  const scoreMap = new Map(scores.map(x => [x.caseId, x.rawScore]));
  const sa = scoreMap.get(forward.a), sb = scoreMap.get(forward.b);
  const expected = sa === undefined || sb === undefined ? null : sa === sb ? "tie" : sa < sb ? forward.a : forward.b;
  return { positionConsistent: abstained ? null : a === b, abstained,
    absoluteConflict: expected === null || abstained ? null : a !== expected || b !== expected };
}

const ranks = (values) => values.map(v => 1 + values.filter(x => x < v).length + (values.filter(x => x === v).length - 1) / 2);
const correlation = (a, b) => {
  const ma = a.reduce((s, x) => s + x, 0) / a.length, mb = b.reduce((s, x) => s + x, 0) / b.length;
  const den = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0));
  return den ? a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / den : null;
};
export function metrics(predictions, targets) {
  if (new Set(predictions.map(x => x.caseId)).size !== predictions.length || new Set(targets.map(x => x.caseId)).size !== targets.length) fail("duplicate metric IDs");
  for (const x of [...predictions, ...targets]) {
    if (x.tier !== tier(x.rawScore)) fail("metric tier disagrees with score");
  }
  const pmap = new Map(predictions.map(x => [x.caseId, x]));
  const rows = targets.filter(x => pmap.has(x.caseId)).map(x => [pmap.get(x.caseId), x]);
  if (!rows.length) fail("no overlapping reference IDs");
  const index = { easy: 0, medium: 1, hard: 2 }, n = rows.length;
  const matrix = Array.from({ length: 3 }, () => [0, 0, 0]);
  for (const [p, t] of rows) matrix[index[t.tier]][index[p.tier]]++;
  let observed = 0, expected = 0, pairs = 0, concordant = 0, tied = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const weight = (i - j) ** 2 / 4;
    observed += weight * matrix[i][j] / n;
    expected += weight * matrix[i].reduce((s, x) => s + x, 0) / n * matrix.reduce((s, r) => s + r[j], 0) / n;
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const targetSign = Math.sign(rows[i][1].rawScore - rows[j][1].rawScore);
    if (!targetSign) continue;
    pairs++;
    const predictedSign = Math.sign(rows[i][0].rawScore - rows[j][0].rawScore);
    if (!predictedSign) tied++;
    if (targetSign === predictedSign) concordant++;
  }
  return { n, targetCount: targets.length, coverage: n / targets.length, confusionMatrix: matrix,
    exactTierAgreement: rows.filter(([p, t]) => p.tier === t.tier).length / n,
    severeTierErrors: rows.filter(([p, t]) => Math.abs(index[p.tier] - index[t.tier]) === 2).length,
    quadraticWeightedKappa: expected ? 1 - observed / expected : null,
    spearman: correlation(ranks(rows.map(x => x[0].rawScore)), ranks(rows.map(x => x[1].rawScore))),
    pairwiseConcordance: pairs ? concordant / pairs : null, comparablePairs: pairs, predictedTies: tied };
}

async function saveOnce(path, data) {
  const content = JSON.stringify(data, null, 2) + "\n";
  try {
    if (await Deno.readTextFile(path) !== content) fail(`existing artifact differs: ${path}; use a new run label`);
    return;
  } catch (e) { if (!(e instanceof Deno.errors.NotFound)) throw e; }
  await Deno.writeTextFile(path, content, { createNew: true });
}
const readJson = async (path) => JSON.parse(await Deno.readTextFile(path));

export function parseCliArgs(argv) {
  const command = !argv.length || argv[0].startsWith("--") ? "plan" : argv[0];
  const args = command === argv[0] ? argv.slice(1) : argv;
  const options = Object.fromEntries(args.map(a => {
    if (!a.startsWith("--")) fail(`invalid argument ${a}`);
    const at = a.indexOf("="); return at < 0 ? [a.slice(2), true] : [a.slice(2, at), a.slice(at + 1)];
  }));
  const allowed = { plan: ["model", "run", "ids", "pair"], ingest: ["plan", "input"], evaluate: ["input", "provisional"], pairs: ["forward", "reverse", "absolute"] };
  if (!allowed[command] || Object.keys(options).some(k => !allowed[command].includes(k))) fail("unknown command or option");
  if (command === "evaluate" && options.provisional !== undefined && options.provisional !== true) fail("--provisional is a boolean flag");
  if (Object.entries(options).some(([k,v])=>k!=="provisional" && (typeof v !== "string" || !v))) fail("option requires a nonempty value");
  if (new Set(args.map(a=>a.split("=")[0])).size !== args.length) fail("duplicate option");
  return { command, options };
}

if (import.meta.main) {
  const { command, options } = parseCliArgs(Deno.args);
  const base = new URL(".internal/condition-difficulty/", ROOT);
  if (command === "plan") {
    const ref = await readJson(new URL("reference.json", base));
    if (ref.rubricVersion !== RUBRIC.version) fail("reference rubric mismatch");
    if (ref.conditions.length > 50) fail("pilot capped at 50; validate methodology before expanding");
    const { rows, revision } = loadApp();
    for (const c of ref.conditions) {
      const r = rows.find(r => Number(r.id) === c.caseId);
      if (!r || r.diagnosis !== c.diagnosisVi || JSON.stringify([r.diagnosis, ...r.aliases.split("|")]) !== JSON.stringify(c.aliases) ||
          JSON.stringify(revision.cases.find(x => x.caseId === c.caseId).categoryIds) !== JSON.stringify(c.specialtyIds)) fail(`stale identity or specialty ${c.caseId}`);
    }
    const pair = options.pair ? String(options.pair).split(",").map(Number) : null;
    const ids = pair ?? (options.ids ? String(options.ids).split(",").map(Number) : ref.pilotIds);
    if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !ref.conditions.some(c => c.caseId === id))) fail("IDs must be a unique subset of the pilot reference set");
    const plan = await buildPlan({ conditions: ids.map(id => ref.conditions.find(c => c.caseId === id)), evidence: ref.evidence,
      sources: ref.sources, model: options.model ?? "luna", run: options.run ?? "pilot-1", pair });
    await Deno.mkdir(new URL("plans/", base), { recursive: true });
    const path = new URL(`plans/${plan.cacheKey}.json`, base);
    await saveOnce(path, plan);
    console.log(path.pathname);
  } else if (command === "ingest") {
    if (!options.plan || !options.input) fail("ingest requires --plan and --input");
    const plan = await validatePlan(await readJson(options.plan));
    const response = validateResponse(plan, await readJson(options.input));
    const report = { cacheKey: plan.cacheKey, rubricVersion: RUBRIC.version, model: plan.model, reasoning: plan.reasoning,
      run: plan.run, mode: plan.mode, response, scores: plan.mode === "absolute" ? response.assessments.map(a => scoreAssessment(a)) : [],
      usage: null, usageNote: "Native subagent transport does not expose token billing; no cost measurement claimed." };
    await Deno.mkdir(new URL("cache/", base), { recursive: true });
    const path = new URL(`cache/${plan.cacheKey}.json`, base);
    await saveOnce(path, report);
    console.log(path.pathname);
  } else if (command === "pairs") {
    if (!options.forward || !options.reverse) fail("pairs requires --forward and --reverse cached reports");
    const f = await readJson(options.forward), r = await readJson(options.reverse);
    if (f.mode !== "pairwise" || r.mode !== "pairwise") fail("pairwise cache reports required");
    const scores = options.absolute ? (await readJson(options.absolute)).scores : [];
    console.log(JSON.stringify(comparePairs(f.response, r.response, scores), null, 2));
  } else {
    if (!options.input) fail("evaluate requires --input cached absolute report");
    const ref = await readJson(new URL("reference.json", base));
    if (ref.rubricVersion !== RUBRIC.version) fail("reference rubric mismatch");
    if (!options.provisional && (ref.status !== "human_reviewed" || !ref.reviewers?.length || ref.conditions.some(c => !c.humanReview))) fail("reference is not human reviewed; use --provisional only for a seed-target diagnostic");
    const report = await readJson(options.input);
    if (report.rubricVersion !== RUBRIC.version || report.mode !== "absolute") fail("incompatible report");
    const targets = ref.conditions.map(c => ({ caseId: c.caseId, ...c.target }));
    console.log(JSON.stringify({ interpretation: options.provisional ? "Agreement with unvalidated editorial seeds; NOT model accuracy" : "Agreement with human reference",
      overall: metrics(report.scores, targets), bySpecialty: Object.fromEntries([...new Set(ref.conditions.flatMap(c => c.specialtyIds))].map(id => {
        const subset = targets.filter(t => ref.conditions.find(c => c.caseId === t.caseId).specialtyIds.includes(id));
        return [id, subset.some(t => report.scores.some(s => s.caseId === t.caseId)) ? metrics(report.scores, subset) : null];
      })) }, null, 2));
  }
}
