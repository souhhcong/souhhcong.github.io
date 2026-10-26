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

Deno.test("expanded bank contains at least 400 unique diagnoses and unambiguous accepted answers", () => {
  const {rows,run} = loadApp();
  assert(rows.length >= 400, "Expansion lost conditions");
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
    [2,"pulmonary embolism"],
    [2,"PE"],
    [98,"Kawasaki"],
    [200,"NEC"],
    [200,"P77"],
    [379,"BPPV"],
    [400,"ADHD"],
    [400,"F90.0"],
    [16,"K26.4"],
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
  const item=context.safeRevision.cases.find(item=>item.caseId===2);
  // PE inside an unrelated word is not the standalone accepted abbreviation.
  item.treatmentClues[0]="Kiểm tra đơn vị chuyên khoa và đáp ứng therapy phù hợp.";
  item.treatmentExplanation="Thuyên tắc phổi (PE) được giải thích sau khi kết thúc.";
  run("validateRevisionData(safeRevision,caseRows)");
});

Deno.test("cases 200 and 400 are playable and gradeable in both modes through the local preview", async () => {
  for (const [id,category,answer,answerText] of [[200,"pediatrics","NEC","hoại tử"],[400,"psychiatry","ADHD","giảm chú ý"]]) for (const game of ["clinical","treatment"]) {
    const {run,context,nodes}=loadApp();
    context.URLSearchParams=URLSearchParams;
    context.location={hostname:"127.0.0.1",search:`?case=${id}&game=${game}&category=${category}&difficulty=hard`};
    await run("init()");
    assert(run(`currentCase.id===${id} && mode==='practice' && practiceCategory==='${category}'`),"Late case not available");
    assert(run("activeClues().length===6 && revealed===1"),"Incomplete late case");
    for(let count=1;count<6;count++) nodes.get("#reveal-button").listeners.get("click")();
    nodes.get("#guess-input").value=answer;
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
    assert(run("finished && revealed===6 && attempts[0].correct"),"Late case could not complete");
    assert(nodes.get("#answer").textContent.includes(answerText),"Wrong late answer");
  }
});

Deno.test("expanding the bank preserves today's saved cases, progress and completion totals", async () => {
  for (const oldSize of [100,200]) {
  const old=loadApp();
  old.run(`CASES=CASES.slice(0,${oldSize})`);
  await old.run("init()");
  old.run("revealed=4; attempts=[{text:'wrong',correct:false}]; saveDailyState(); switchGame('treatment')");
  const clinicalId=old.run("dailyStore().rounds.clinical.easy.caseId");
  const treatmentId=old.run("currentCase.id");
  old.nodes.get("#guess-input").value=old.run("currentCase.diagnosis");
  old.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  const expanded=loadApp(Object.fromEntries(old.storage));
  await expanded.run("init()");
  assert(expanded.run("currentCase.id")===treatmentId && expanded.run("finished"),"Expansion replaced completed treatment case");
  expanded.run("switchDifficulty('hard')");
  assert(expanded.run("currentCase.id")!==treatmentId,"New daily difficulty reused the easy case");
  expanded.run("switchDifficulty('easy')");
  assert(expanded.run("currentCase.id")===treatmentId && expanded.run("finished"),"Returning to easy lost the pinned challenge");
  expanded.run("switchGame('clinical'); switchDifficulty('easy')");
  assert(expanded.run("currentCase.id")===clinicalId && expanded.run("revealed===4 && attempts.length===1"),"Expansion lost clinical progress");
  assert(expanded.run("getStats().played===1 && getStats().solved===1"),"Expansion changed aggregate totals");
  }
});

Deno.test("new specialties offer focused practice and matching suggestions in both modes", async () => {
  const {run,nodes,context}=loadApp();
  await run("init()");
  for (const category of ["ophthalmology","ent","psychiatry"]) for (const game of ["clinical","treatment"]) {
    run(`switchCategory('${category}'); switchGame('${game}')`);
    assert(run(`mode==='practice' && practiceCategory==='${category}' && currentCase.categoryIds.includes('${category}')`),"New specialty did not start focused practice");
    context.suggestions=nodes.get("#diagnosis-list").innerHTML;
    assert(run("practicePool().every(item=>suggestions.includes(escapeHtml(item.diagnosis)))"),"In-category diagnosis missing from suggestions");
    assert(!nodes.get("#diagnosis-list").innerHTML.includes("Loét tá tràng xuất huyết"),"Unrelated diagnosis offered by new group");
    const first=run("currentCase.id");
    nodes.get("#new-case-button").listeners.get("click")();
    assert(run("currentCase.id")!==first,"New specialty repeated immediately");
  }
});
