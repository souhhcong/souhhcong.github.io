import { ASSESSMENT_SCHEMA, DIMENSIONS, RUBRIC, buildPlan, comparePairs, digest, metrics,
  normalizeName, parseCliArgs, scoreAssessment, tier, validateAssessment, validatePlan, validateResponse } from "../scripts/condition-difficulty.js";

const assert = (v, message = "assertion failed") => { if (!v) throw new Error(message); };
const rejects = (fn) => { try { fn(); } catch { return; } throw new Error("invalid result accepted"); };
const assessment = (caseId = 1, value = 1, basis = "llm_estimate") => ({ caseId, nameStatus: "resolved", confidence: "high", uncertainties: [],
  dimensions: Object.fromEntries(DIMENSIONS.map(k => [k, { value, basis, evidenceIds: [], rationale: "Test estimate, not observed." }])) });
const condition = { caseId: 1, diagnosisVi: "Sốt xuất huyết Dengue", aliases: ["dengue", "SXH"], specialtyIds: ["infectious"],
  target: { rawScore: 5 }, seedAssessment: "must never reach model", humanReview: null };
const evidence = [{ id: "curriculum-1", verified: true, sourceId: "source", caseIds: [1], dimensions: ["curriculum"], allowedLevels: { curriculum: [1] } }];

Deno.test("familiarity scale preserves direction and fixed, unequal-sized tier boundaries", () => {
  assert(Object.values(RUBRIC.weights).reduce((a,b)=>a+b,0) === 100);
  assert(scoreAssessment(assessment(1,0)).rawScore === 0);
  assert(scoreAssessment(assessment(1,4)).rawScore === 100);
  assert(tier(30)==="easy" && tier(30.01)==="medium" && tier(60)==="medium" && tier(60.01)==="hard");
  const a=assessment(); a.dimensions.curriculum.value=2;
  assert(scoreAssessment(a).rawScore===33.75 && scoreAssessment(a).displayScore===35);
});
Deno.test("missing evidence widens uncertainty and is not recoded as difficult", () => {
  const result=scoreAssessment(assessment(1,null,"unknown"));
  assert(result.rawScore===50 && result.sensitivityRange[0]===0 && result.sensitivityRange[1]===100);
  assert(result.possibleTiers.join(",")==="easy,medium,hard" && result.evidenceCoverage===0);
  assert(!result.releaseEligible && result.requiresHumanReview);
});
Deno.test("reported high confidence never bypasses deterministic review gates", () => {
  const a=assessment(1,1);
  const r=scoreAssessment(a,{repeatScore:50,pairConflict:true});
  assert(r.reviewReasons.includes("low_evidence_coverage") && r.reviewReasons.includes("repeat_disagreement") && r.reviewReasons.includes("pairwise_conflict"));
  assert(!r.releaseEligible && r.requiresHumanReview);
});
Deno.test("evidence claims require verified disease/dimension/level support", () => {
  const a=assessment();
  a.dimensions.curriculum={value:1,basis:"evidence_backed",evidenceIds:["curriculum-1"],rationale:"Explicit topic."};
  validateAssessment(a,condition,evidence);
  for(const change of [
    x=>{x.dimensions.curriculum.evidenceIds=["made-up"];},
    x=>{x.dimensions.curriculum.value=0;},
    x=>{x.dimensions.exposure={...x.dimensions.curriculum};},
    x=>{x.dimensions.curriculum.value=null;},
    x=>{x.dimensions.curriculum.evidenceIds=["curriculum-1","curriculum-1"];},
    x=>{x.dimensions.curriculum.extra="ignored?";},
  ]) {const b=structuredClone(a); change(b); rejects(()=>validateAssessment(b,condition,evidence));}
  rejects(()=>validateAssessment(a,condition,[{...evidence[0],verified:false}]));
  rejects(()=>validateAssessment(a,condition,[{...evidence[0],caseIds:[2]}]));
});
Deno.test("batch ingestion rejects duplicate, missing and unrelated conditions", async () => {
  const plan=await buildPlan({conditions:[condition,{...condition,caseId:2}],evidence});
  validateResponse(plan,{assessments:[assessment(),assessment(2)]});
  rejects(()=>validateResponse(plan,{assessments:[assessment(),assessment()]}));
  rejects(()=>validateResponse(plan,{assessments:[assessment()]}));
  rejects(()=>validateResponse(plan,{assessments:[assessment(),assessment(3)]}));
  rejects(()=>validateResponse(plan,{assessments:[assessment(),assessment(2)],score:20}));
});
Deno.test("plans hide targets and scores and hash all model inputs", async () => {
  const a=await buildPlan({conditions:[condition],evidence,model:"luna"});
  assert(!JSON.stringify(a).includes("must never reach model"));
  assert(!Object.hasOwn(a.conditions[0],"target") && !Object.hasOwn(a.conditions[0],"humanReview"));
  await validatePlan(a);
  const b=await buildPlan({conditions:[condition],evidence,model:"terra"});
  const c=await buildPlan({conditions:[condition],evidence,run:"repeat-2"});
  const d=await buildPlan({conditions:[{...condition,aliases:["changed"]}],evidence});
  const e=await buildPlan({conditions:[condition],evidence:[{...evidence[0],excerpt:"changed"}]});
  assert(new Set([a,b,c,d,e].map(x=>x.cacheKey)).size===5);
  const changed=structuredClone(a); changed.reasoning="low";
  let caught=false;try{await validatePlan(changed);}catch{caught=true;}assert(caught);
  assert(await digest({b:2,a:1})===await digest({a:1,b:2}));
});
Deno.test("pair reversal compares disease identity and does not count abstention as agreement", () => {
  const f={a:1,b:2,moreFamiliar:"A"}, r={a:2,b:1,moreFamiliar:"B"};
  assert(comparePairs(f,r,[{caseId:1,rawScore:10},{caseId:2,rawScore:60}]).positionConsistent);
  assert(comparePairs(f,{...r,moreFamiliar:"A"}).positionConsistent===false);
  assert(comparePairs(f,{...r,moreFamiliar:"insufficient_evidence"}).positionConsistent===null);
  assert(comparePairs(f,r,[{caseId:1,rawScore:70},{caseId:2,rawScore:20}]).absoluteConflict);
  rejects(()=>comparePairs(f,f));
});
Deno.test("pairwise schema/validator enforces orientation and valid evidence IDs", async () => {
  const plan=await buildPlan({conditions:[condition,{...condition,caseId:2}],evidence,pair:[1,2]});
  const p={a:1,b:2,moreFamiliar:"tie",rationale:"Similar familiarity.",evidenceIds:[],confidence:"low"};
  validateResponse(plan,p);
  rejects(()=>validateResponse(plan,{...p,a:2,b:1}));
  rejects(()=>validateResponse(plan,{...p,evidenceIds:["fabricated"]}));
});
Deno.test("metrics account for missing coverage, tied ranks and ordered-tier errors", () => {
  const targets=[{caseId:1,rawScore:10,tier:"easy"},{caseId:2,rawScore:45,tier:"medium"},{caseId:3,rawScore:80,tier:"hard"}];
  const perfect=metrics(targets,targets);
  assert(perfect.exactTierAgreement===1 && perfect.quadraticWeightedKappa===1 && perfect.spearman===1 && perfect.pairwiseConcordance===1);
  const reverse=metrics(targets.map(x=>({...x,rawScore:90-x.rawScore,tier:tier(90-x.rawScore)})),targets);
  assert(reverse.severeTierErrors===2 && reverse.spearman===-1);
  const partial=metrics(targets.slice(0,2),targets);
  assert(partial.coverage===2/3);
  assert(metrics([{caseId:1,rawScore:10,tier:"easy"}],targets).spearman===null);
  rejects(()=>metrics([targets[0],targets[0]],targets));
  rejects(()=>metrics([{caseId:1,rawScore:10,tier:"hard"}],targets));
});
Deno.test("names normalize accents and punctuation without using normalization as identity", () => {
  assert(normalizeName("SỐT XUẤT HUYẾT Dengue")===normalizeName("sot xuat huyet dengue"));
  assert(normalizeName("Đái tháo đường")==="dai thao duong");
  assert(normalizeName("đái tháo đường type 1")!==normalizeName("đái tháo đường type 2"));
});
Deno.test("schema uses strict object fields and required nullable dimension values", () => {
  assert(ASSESSMENT_SCHEMA.additionalProperties===false);
  const d=ASSESSMENT_SCHEMA.properties.assessments.items.properties.dimensions;
  assert(d.required.length===5 && d.additionalProperties===false);
  assert(d.properties.curriculum.properties.value.type.includes("null"));
});
Deno.test("CLI supports default planning with flags and rejects ambiguous options", () => {
  assert(parseCliArgs([]).command==="plan");
  assert(parseCliArgs(["--model=luna","--run=smoke"]).options.model==="luna");
  assert(parseCliArgs(["ingest","--plan=a.json","--input=b.json"]).command==="ingest");
  assert(parseCliArgs(["evaluate","--input=a.json","--provisional"]).options.provisional===true);
  for(const args of [["--model"],["--run="],["--model=luna","--model=terra"],["evaluate","--provisional=false"],["publish"],["--unknown=x"]]) rejects(()=>parseCliArgs(args));
});
