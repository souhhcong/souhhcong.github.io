import {loadApp} from "../scripts/app-harness.js";

function assert(value, message) { if (!value) throw new Error(message); }
function rejects(fn, pattern) {
  try { fn(); } catch (error) {
    assert(pattern.test(error.message), `Unexpected validation failure: ${error.message}`);
    return;
  }
  throw new Error("Unsafe bank passed validation");
}

const variants = (text) => [text, text.toUpperCase(), text.normalize("NFD"),
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/[\s.]+/g, " — ")];

Deno.test("bank contains unique diagnoses and unambiguous accepted answers", () => {
  const {run} = loadApp();
  assert(run(`new Set(CASES.map(item=>normalize(item.diagnosis))).size === CASES.length`), "Repeated diagnosis");
  assert(run(`(() => {
    const owners = new Map();
    for (const item of CASES) for (const answer of [item.diagnosis,item.icdCode,...item.aliases]) {
      const key=normalize(answer);
      if (owners.has(key) && owners.get(key)!==item.id) return false;
      owners.set(key,item.id);
    }
    return true;
  })()`), "One accepted answer resolves to different conditions");
});

Deno.test("repeated diagnoses are rejected despite new IDs, titles, accents or punctuation", () => {
  const {rows,run,context} = loadApp();
  for (const diagnosis of variants(rows[0].diagnosis)) {
    context.badRows=[rows[0],{...rows[1],title:"Another vignette",diagnosis,aliases:""}];
    rejects(()=>run("validateCaseRows(badRows)"), /Duplicate diagnosis/);
  }
});

Deno.test("cross-case diagnosis, alias and ICD collisions fail in either row order", () => {
  const {rows,run,context} = loadApp();
  for (const answer of [rows[0].diagnosis, rows[0].icd_code, rows[0].aliases.split("|")[0]]) {
    for (const variant of variants(answer)) {
      const other={...rows[1],aliases:variant};
      for (const pair of [[rows[0],other],[other,rows[0]]]) {
        context.badRows=pair;
        rejects(()=>run("validateCaseRows(badRows)"), /Answer shared by cases/);
      }
    }
  }
  const pairs=[
    [rows[0],{...rows[1],icd_code:rows[0].icd_code}],
    [{...rows[0],aliases:rows[1].icd_code},rows[1]],
    [{...rows[0],aliases:"Shared classroom synonym"},{...rows[1],aliases:"SHARED — CLASSROOM SYNONYM"}],
    [{...rows[0],aliases:rows[1].diagnosis},rows[1]],
  ];
  for (const pair of pairs) for (const ordered of [pair,[...pair].reverse()]) {
    context.badRows=ordered;
    rejects(()=>run("validateCaseRows(badRows)"), /Answer shared by cases/);
  }
  // Redundant spellings within one condition do not create ambiguity.
  context.goodRows=[{...rows[0],aliases:variants(rows[0].diagnosis).join("|")}];
  run("validateCaseRows(goodRows)");
});

Deno.test("all six treatment positions reject diagnosis, English, eponym, short alias and code giveaways", () => {
  const {rows,revision,run,context} = loadApp();
  const probes=[
    [1,rows.find(row=>row.id==1).diagnosis],
    [245,"hepatocellular carcinoma"],
    [245,"HCC"],
    [53,"Bệnh Graves"],
    [121,"GERD"],
    [151,"ICH"],
    [33,"COPD"],
    [12,"K80.0"],
  ];
  for (const [caseId,answer] of probes) for (const variant of variants(answer)) {
    for (let index=0;index<6;index++) {
      context.badRevision=structuredClone(revision);
      context.badRevision.cases.find(item=>item.caseId===caseId).treatmentClues[index]=`Kế hoạch áp dụng (${variant}).`;
      rejects(()=>run("validateRevisionData(badRevision,caseRows)"), /treatment clue names an accepted answer/);
    }
  }
});

Deno.test("giveaway detection respects word boundaries and allows explanations after reveal", () => {
  const {revision,run,context} = loadApp();
  context.safeRevision=structuredClone(revision);
  const item=context.safeRevision.cases.find(item=>item.caseId===151);
  // ICH inside an unrelated word is not the standalone accepted abbreviation.
  item.treatmentClues[0]="Kiểm tra vị trí tiêm chích và đáp ứng điều trị phù hợp.";
  item.treatmentExplanation="Xuất huyết não (ICH) được giải thích sau khi kết thúc.";
  run("validateRevisionData(safeRevision,caseRows)");
});

Deno.test("late cases are playable and gradeable through the local preview", async () => {
  for (const [id,category,answer,answerText] of [[245,"hematology_oncology","HCC","tế bào gan"],[411,"respiratory","Tràn dịch màng phổi","Tràn dịch"]]) {
    const {run,context,nodes}=loadApp();
    context.URLSearchParams=URLSearchParams;
    context.location={hostname:"127.0.0.1",search:`?case=${id}&category=${category}&difficulty=hard`};
    await run("init()");
    assert(run(`currentCase.id===${id} && mode==='practice' && practiceCategory==='${category}'`),"Late case not available");
    assert(run("activeClues().length===6 && revealed===1"),"Incomplete late case");
    for(let count=1;count<6;count++) nodes.get("#reveal-button").listeners.get("click")();
    nodes.get("#guess-input").value=answer;
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
    assert(run("finished && revealed===6 && attempts[5].correct"),"Late case could not complete");
    assert(nodes.get("#answer").textContent.includes(answerText),"Wrong late answer");
  }
});

Deno.test("expanding the bank preserves today's saved cases, progress and completion totals", async () => {
  for (const oldSize of [10,30]) {
  const old=loadApp();
  old.run(`CASES=CASES.slice(0,${oldSize})`);
  await old.run("init()");
  old.run("revealed=4; attempts=[{text:'wrong',correct:false}]; saveDailyState(); switchDifficulty('hard')");
  const easyId=old.run("dailyStore().rounds.clinical.easy.caseId");
  const hardId=old.run("currentCase.id");
  old.nodes.get("#guess-input").value=old.run("currentCase.diagnosis");
  old.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  const expanded=loadApp(Object.fromEntries(old.storage));
  await expanded.run("init()");
  expanded.run("switchDifficulty('hard')");
  assert(expanded.run("currentCase.id")===hardId && expanded.run("finished"),"Expansion replaced completed hard case");
  expanded.run("switchDifficulty('medium')");
  assert(![hardId,easyId].includes(expanded.run("currentCase.id")),"New daily difficulty reused a pinned case");
  expanded.run("switchDifficulty('easy')");
  assert(expanded.run("currentCase.id")===easyId && expanded.run("revealed===4 && attempts.length===1"),"Expansion lost easy progress");
  assert(expanded.run("getStats().played===1 && getStats().solved===1"),"Expansion changed aggregate totals");
  }
});

Deno.test("small specialties offer focused practice and matching suggestions", async () => {
  const {run,nodes,context}=loadApp();
  await run("init()");
  for (const category of ["endocrine","obgyn","musculoskeletal_rheumatology"]) {
    run(`switchCategory('${category}')`);
    assert(run(`mode==='practice' && practiceCategory==='${category}' && currentCase.categoryIds.includes('${category}')`),"Specialty did not start focused practice");
    context.suggestions=run("suggestionNames.map((entry)=>entry.name).join('|')");
    assert(run("practicePool().every(item=>suggestions.includes(item.diagnosis))"),"In-category diagnosis missing from suggestions");
    assert(run(`!suggestionNames.some((entry)=>entry.name===CASES.find(item=>!item.categoryIds.includes('${category}')).diagnosis)`),"Unrelated diagnosis offered by new group");
    const first=run("currentCase.id");
    nodes.get("#new-case-button").listeners.get("click")();
    assert(run("currentCase.id")!==first,"New specialty repeated immediately");
  }
});
