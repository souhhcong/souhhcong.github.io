import {loadApp} from "../scripts/app-harness.js";
import {validateTreatmentAudit} from "../scripts/validate-cases.js";
import {createHash} from "node:crypto";

function assert(value, message) { if (!value) throw new Error(message); }
function throws(fn, pattern) {
  try { fn(); } catch (error) { assert(pattern.test(error.message),error.message); return; }
  throw new Error("Expected invalid data to fail");
}

Deno.test("every condition has six distinct management clues, category membership and a rationale", () => {
  const {revision,rows,run} = loadApp();
  assert(revision.cases.length === rows.length && revision.categories.length >= 16,"Incomplete bank");
  assert(["ophthalmology","ent","psychiatry"].every(id=>revision.categories.some(item=>item.id===id)),"New specialties missing");
  assert(revision.cases.every((item) => new Set(item.treatmentClues).size === 6),"Duplicate treatment step");
  assert(run(`CASES.every((item) => item.categoryIds.length && item.treatmentClues.length === 6 && item.treatmentExplanation)`),"Unusable merged case");
  assert(revision.cases.some((item) => item.categoryIds.length > 1),"Overlapping groups missing");
});

Deno.test("revision data rejects partial banks, unknown IDs and invalid categories", () => {
  const {run,context,revision} = loadApp();
  const mutations = [
    (data) => data.cases.pop(),
    (data) => {data.cases[0].caseId = 999;},
    (data) => {data.cases[1].caseId = data.cases[0].caseId;},
    (data) => {data.cases[0].categoryIds = [];},
    (data) => {data.cases[0].categoryIds = ["unknown"];},
    (data) => {data.cases[0].categoryIds.push(data.cases[0].categoryIds[0]);},
    (data) => {data.cases[0].treatmentClues.pop();},
    (data) => {data.cases[0].treatmentExplanation = " ";},
    (data) => {data.cases[0].treatmentClues[0] = "Điều trị sốt xuất huyết Dengue.";},
    (data) => {data.cases[0].treatmentClues[0] = "Phác đồ A91.";},
    (data) => {data.cases[0].source_ids = ["private reference"];},
    (data) => {data.categories[0].review_note = "private note";},
    (data) => {data.sources = {};},
    (data) => data.categories.push({id:"unused",label:"Unused"}),
    (data) => data.categories.push({...data.categories[0]}),
  ];
  for (const mutate of mutations) {
    context.badRevision = structuredClone(revision);
    mutate(context.badRevision);
    throws(() => run("validateRevisionData(badRevision, caseRows)"), /Revision data/);
  }
});

Deno.test("both game types accept all configured answers at every difficulty", () => {
  const {run} = loadApp();
  assert(run(`Object.keys(GAME_LABELS).every((type) => {
    gameType = type;
    return CASES.every((item) => {
      currentCase = item;
      return Object.keys(DIFFICULTY_LABELS).every((level) => {
        difficulty = level;
        return [item.diagnosis,item.icdCode,...item.aliases].every((answer) => isCorrect(answer.normalize("NFD")));
      });
    });
  })`),"Answer grading differs between modes");
});

Deno.test("treatment reveal retains six guesses, hides symptom title and shows mode-specific rationale", async () => {
  const {run,nodes} = loadApp();
  await run("init()");
  run("switchGame('treatment')");
  for (let count = 1; count <= 6; count++) {
    assert(nodes.get("#case-title").textContent.startsWith("Kế hoạch điều trị #"),"Treatment title leaks case");
    assert(run("revealed") === count && run("attempts.length") === 0,"Reveal consumed a guess");
    const markup = nodes.get("#clue-list").innerHTML;
    const visible = run("activeClues().slice(0,revealed).map(escapeHtml)");
    assert(visible.every((text) => markup.includes(text)),"Wrong clue bank rendered");
    if (count < 6) nodes.get("#reveal-button").listeners.get("click")();
  }
  assert(nodes.get("#reveal-button").disabled,"Reveal did not stop");
  nodes.get("#guess-input").value = run("currentCase.icdCode");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("finished && attempts[0].correct"),"Could not win treatment round");
  assert(nodes.get("#treatment-explanation").textContent === run("currentCase.treatmentExplanation"),"Wrong explanation");
  assert(nodes.get("#summary").textContent === run("currentCase.summary"),"Clinical link missing");
});

Deno.test("six wrong treatment guesses reveal the complete plan and finish once", async () => {
  const {run,nodes} = loadApp();
  await run("init()");
  run("switchGame('treatment')");
  for (let i = 0; i < 6; i++) {
    nodes.get("#guess-input").value = "not a diagnosis";
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  }
  assert(run("finished && revealed === 6 && attempts.length === 6"),"Losing round not finished");
  assert(run("getStats().played === 1 && getStats().solved === 0"),"Loss counted incorrectly");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("getStats().played === 1"),"Completed loss counted again");
});

Deno.test("category selection starts focused practice and overlap is retained in both modes", async () => {
  const {run,nodes} = loadApp();
  await run("init()");
  run("switchCategory('cardiology')");
  assert(run("mode === 'practice' && practicePool().length > 1 && practicePool().every(item => item.categoryIds.includes('cardiology')) && currentCase.categoryIds.includes('cardiology')"),"Wrong category pool");
  assert(!nodes.get("#diagnosis-list").innerHTML.includes("Thủy đậu"),"Autocomplete escaped selected group");
  run("switchGame('treatment')");
  assert(run("currentCase.categoryIds.includes('cardiology') && practiceCategory === 'cardiology'"),"Mode switch lost category");
  assert(run("CASES.find((item)=>item.id===2).categoryIds.includes('respiratory')"),"Expected overlap absent");
  run("switchDifficulty('hard')");
  assert(run("attempts.length === 0 && revealed === 1"),"Difficulty did not restart practice case");
  run("switchMode('daily')");
  assert(nodes.get("#category-select").value === "all","Daily retained category filter");
});

Deno.test("daily difficulties have separate cases and progress and each completion counts once", async () => {
  const {run,nodes} = loadApp();
  await run("init()");
  const win = () => {
    nodes.get("#guess-input").value=run("currentCase.diagnosis");
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  };
  const clinicalId = run("currentCase.id");
  run("revealed=3; attempts=[{text:'wrong',correct:false}]; render(); switchGame('treatment')");
  assert(run("currentCase.id") !== clinicalId && run("revealed === 1 && attempts.length === 0"),"Treatment restored clinical round");
  win();
  run("switchDifficulty('hard')");
  assert(run("!finished"),"Difficulty restored other difficulty save");
  win();
  assert(run("getStats().played === 2"),"Distinct daily difficulty was not counted");
  run("switchGame('clinical')");
  assert(run("revealed === 1"),"Clinical hard should start fresh");
  run("switchDifficulty('easy')");
  assert(run("revealed === 3 && attempts.length === 1 && !finished"),"Clinical progress not restored");
  win();
  assert(run("getStats().played === 3 && getStats().solved === 3"),"Independent daily completion not recorded");
  run("switchGame('treatment')");
  assert(run("finished && attempts[0].correct"),"Completed treatment easy save not restored");
});

Deno.test("existing clinical daily progress and aggregate stats migrate without double-counting", async () => {
  const initial = loadApp();
  const legacy = {date:initial.run("todayKey()"),caseId:1,difficulty:"easy",revealed:4,
    attempts:[{text:"wrong",correct:false}],finished:false};
  const {run,storage} = loadApp({"chanle-daily-state-v2":JSON.stringify(legacy),"chanle-stats-v1":JSON.stringify({played:12,solved:9,streak:2})});
  await run("init()");
  assert(run("revealed === 4 && attempts.length === 1 && getStats().played === 12"),"Legacy state or totals lost");
  assert(storage.has("chanle-daily-state-v4"),"New save not created");
  const finished = {...legacy,finished:true,attempts:[{text:"answer",correct:true}]};
  const restored = loadApp({"chanle-daily-state-v2":JSON.stringify(finished),"chanle-stats-v1":JSON.stringify({played:12,solved:9,streak:2})});
  await restored.run("init()");
  restored.run("switchDifficulty('hard')");
  restored.nodes.get("#guess-input").value=restored.run("currentCase.diagnosis");
  restored.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(restored.run("getStats().played === 13"),"New daily difficulty did not count independently");
  restored.run("switchDifficulty('easy')");
  restored.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(restored.run("finished && getStats().played === 13"),"Completed legacy daily counted twice");
});

Deno.test("malformed daily slots do not prevent startup or overwrite clinical answers", async () => {
  const app = loadApp();
  const date = app.run("todayKey()");
  const bad = loadApp({"chanle-daily-state-v3":JSON.stringify({date,rounds:{clinical:true},recorded:{}})});
  await bad.run("init()");
  assert(bad.run("!finished && attempts.length===0 && revealed===1"),"Invalid daily slot restored");
  const {revision,context,run,rows}=loadApp();
  context.untrusted=structuredClone(revision);
  context.untrusted.cases[0].diagnosis="Unexpected override";
  context.untrusted.cases[0].aliases=["unexpected answer"];
  throws(()=>run("applyRevisionData(untrusted,caseRows)"),/unknown public case fields/);
  assert(run("CASES[0].diagnosis")===rows[0].diagnosis,"Revision extension overwrote clinical diagnosis");
});

Deno.test("invalid preferences fall back and valid game/category preferences survive reload", async () => {
  const bad = loadApp({"chanle-game-type-v1":"constructor","chanle-category-v1":"missing","chanle-difficulty-v1":"constructor"});
  await bad.run("init()");
  assert(bad.run("gameType==='clinical' && practiceCategory==='all' && difficulty==='easy'"),"Unsafe preference accepted");
  bad.run("switchCategory('renal_urology'); switchGame('treatment')");
  const restored = loadApp(Object.fromEntries(bad.storage));
  await restored.run("init()");
  restored.run("switchMode('practice')");
  assert(restored.run("gameType==='treatment' && practiceCategory==='renal_urology' && currentCase.categoryIds.includes('renal_urology')"),"Preferences not restored");
});

Deno.test("Anki and shares use the chosen mode/category and omit private material", () => {
  const {run} = loadApp();
  assert(run(`Object.keys(GAME_LABELS).every((type) => {
    gameType=type; mode='practice'; practiceCategory='cardiology'; currentCase=CASES.find((item)=>item.id===5);
    const card=ankiText(); const share=shareText();
    return activeClues().every((text)=>card.includes(text)) && card.includes(currentCase.diagnosis) &&
      card.includes(categoryLabel()) && share.includes(GAME_LABELS[type]) && share.includes(categoryLabel()) &&
      !share.includes(currentCase.diagnosis) && !/https?:|source_checked|review_note/.test(card) &&
      (type!=='treatment' || card.includes(currentCase.treatmentExplanation));
  })`),"Export content or privacy mismatch");
});

Deno.test("local preview selects treatment/category; public hosts ignore those controls", async () => {
  const {context,run,nodes} = loadApp();
  context.URLSearchParams = URLSearchParams;
  context.location={hostname:"localhost",search:"?case=5&game=treatment&category=cardiology&difficulty=hard"};
  await run("init()");
  assert(run("gameType==='treatment' && practiceCategory==='cardiology' && currentCase.id===5 && attempts.length===0"),"Local type/category ignored");
  assert(nodes.get("#case-title").textContent === "Kế hoạch điều trị #005","Treatment heading wrong");
  context.location.search="?case=5&game=constructor&category=unknown";
  assert(run("localPreviewOptions().gameType==='clinical' && localPreviewOptions().category==='all'"),"Invalid preview values accepted");
  const publicApp = loadApp();
  publicApp.context.location={hostname:"souhhcong.github.io",search:"?case=5&game=treatment&category=cardiology"};
  publicApp.context.URLSearchParams=URLSearchParams;
  await publicApp.run("init()");
  assert(publicApp.run("gameType==='clinical' && mode==='daily'"),"Public host honored test override");
});

Deno.test("missing treatment bank fails visibly instead of mixing incomplete data", async () => {
  const {context,run,nodes} = loadApp();
  context.fetch=()=>Promise.resolve({ok:false});
  context.console={error(){}};
  await run("init()");
  assert(nodes.get("#case-title").textContent.includes("Không tải"),"Failure invisible");
  assert(!nodes.get("#guess-form").listeners.has("submit"),"Game bound with missing data");
});

Deno.test("guess history renders user input as text", async () => {
  const {run,nodes} = loadApp();
  await run("init()");
  nodes.get("#guess-input").value='<img src=x onerror=alert(1)>';
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  const markup=nodes.get("#history").innerHTML;
  assert(!markup.includes("<img") && markup.includes("&lt;img"),"User guess rendered as markup");
});

function auditFixture() {
  const {rows,revision}=loadApp();
  const row=rows[0]; const item=revision.cases[0];
  const hash=(text)=>createHash("sha256").update(text).digest("hex");
  return {rows:[row],revision:{categories:revision.categories,cases:[item]},ledger:{sources:{example:{title:"Test",section:"Treatment",accessed_at:"2026-10-26",url:"https://example.org"}},cases:[{
    case_id:Number(row.id),treatment_audit:{status:"editorial_complete",checked_by:"Test editorial check",started_at:"2026-10-26",completed_at:"2026-10-26",
      clinical_content_sha256:hash(JSON.stringify(Object.values(row))),revision_content_sha256:hash(JSON.stringify(item)),explanation_note:"Test explanation check",
      clues:item.treatmentClues.map((text,i)=>({field:`treatment${i+1}`,reviewed_text:text,text_sha256:hash(text),review_note:`Test individual note ${i+1}`,source_ids:["example"]}))}
  }]}};
}

Deno.test("treatment reviews reject stale plans, explanations, categories and clinical context", () => {
  const valid=auditFixture();
  validateTreatmentAudit(valid.rows,valid.revision,valid.ledger);
  const mutations=[
    (data)=>{data.revision.cases[0].treatmentClues[0]+=" edited";},
    (data)=>{data.revision.cases[0].treatmentExplanation+=" edited";},
    (data)=>{data.revision.cases[0].categoryIds=[];},
    (data)=>{data.rows[0].summary+=" edited";},
  ];
  for(const mutate of mutations) {
    const data=auditFixture(); mutate(data);
    throws(()=>validateTreatmentAudit(data.rows,data.revision,data.ledger),/stale/);
  }
});

Deno.test("treatment reviews require six unique checks with sources and attribution", () => {
  const mutations=[
    (audit)=>{audit.clues.pop();},
    (audit)=>{audit.clues[5]=audit.clues[0];},
    (audit)=>{audit.clues[0].review_note=" ";},
    (audit)=>{audit.clues[0].source_ids=["missing"];},
    (audit)=>{audit.clues[0].text_sha256="stale";},
    (audit)=>{audit.checked_by="";},
    (audit)=>{audit.completed_at="2026-02-30";},
    (audit)=>{audit.explanation_note="";},
  ];
  for (const mutate of mutations) {
    const data=auditFixture(); mutate(data.ledger.cases[0].treatment_audit);
    throws(()=>validateTreatmentAudit(data.rows,data.revision,data.ledger),/treatment audit/);
  }
});
