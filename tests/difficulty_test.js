import {loadApp} from "../scripts/app-harness.js";
import {validateDifficultyAudit} from "../scripts/validate-cases.js";

function assert(value, message) { if (!value) throw new Error(message); }
function rejects(fn) {
  try { fn(); } catch (error) { assert(/Case difficulty/.test(error.message), error.message); return; }
  throw new Error("Invalid difficulty bank accepted");
}

Deno.test("every case has a valid authored familiarity rating and private notes cannot enter the public file", () => {
  const {run,context,hardness,rows}=loadApp();
  assert(hardness.cases.length===rows.length && run("CASES.every(item=>Number.isInteger(item.hardness)&&item.hardness>=1&&item.hardness<=5)"),"Incomplete ratings");
  assert(new Set(hardness.cases.map(item=>item.hardness)).size===5,"Familiarity scale collapsed");
  // Local relevance and undergraduate recognition, not insertion order or severity.
  assert(run("CASES.find(c=>c.id===1).hardness===1 && CASES.find(c=>c.id===35).hardness===1 && CASES.find(c=>c.id===335).hardness===1"),"Common locally familiar topics rated as obscure");
  assert(run("CASES.find(c=>c.id===175).hardness < CASES.find(c=>c.id===231).hardness && CASES.find(c=>c.id===7).hardness > CASES.find(c=>c.id===101).hardness"),"Rarity replaced by case order or emergency severity");
  const mutations=[
    d=>d.cases.pop(), d=>{d.version=2;}, d=>{d.cases[0].caseId=999;},
    d=>{d.cases[1].caseId=d.cases[0].caseId;}, d=>{d.cases[0].review_note="private";},
    d=>{d.sources=[];}, d=>{delete d.cases[0].hardness;},
    ...[0,6,2.5,"3",null,NaN,Infinity].map(value=>d=>{d.cases[0].hardness=value;}),
  ];
  for(const mutate of mutations) {
    context.bad=structuredClone(hardness); mutate(context.bad);
    rejects(()=>run("validateDifficultyData(bad,caseRows)"));
  }
});

Deno.test("internal familiarity reviews reject stale ratings, diagnosis context and missing rationales", () => {
  const {rows,hardness}=loadApp();
  const data={version:1,cases:hardness.cases.slice(0,2)};
  const review={status:"editorial_estimate",assessed_by:"Test editor",assessed_at:"2026-10-26",
    sources:[{title:"Curriculum context",url:"https://example.org/curriculum",use:"General undergraduate coverage"}],
    ratings:data.cases.map(item=>({...item,diagnosis:rows.find(row=>Number(row.id)===item.caseId).diagnosis,reason:"Specific fictional calibration note"}))};
  validateDifficultyAudit(data,rows.slice(0,2),review);
  for(const mutate of [r=>r.ratings.pop(),r=>{r.ratings[1]=r.ratings[0];},r=>{r.ratings[0].hardness=5;},
    r=>{r.ratings[0].diagnosis="another diagnosis";},r=>{r.ratings[0].reason=" ";},r=>{r.sources=[];}]) {
    const changed=structuredClone(review);mutate(changed);
    rejects(()=>validateDifficultyAudit(data,rows.slice(0,2),changed));
  }
});

Deno.test("all difficulties keep easy-mode titles, suggestions, clues and answer acceptance in both games", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  for(const type of ["clinical","treatment"]) for(const level of ["easy","medium","hard"]) {
    run(`gameType='${type}'; difficulty='${level}'; setCase(CASES.find(item=>item.id===7))`);
    assert(nodes.get("#guess-input").getAttribute("list")==="diagnosis-list","Suggestions hidden by difficulty");
    assert(nodes.get("#case-title").textContent === (type==="clinical"?run("currentCase.title"):"Kế hoạch điều trị #007"),"Title visibility differs from easy mode");
    assert(run("revealed===1 && activeClues().length===6 && attempts.length===0"),"Rules changed with difficulty");
    assert(nodes.get("#play-tip").textContent.includes("Chọn từ gợi ý"),"Guidance still describes old mechanics");
    nodes.get("#guess-input").value=run("currentCase.aliases[0]");
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
    assert(run("finished && attempts[0].correct"),"Accepted alias differs by difficulty");
  }
});

Deno.test("weighted draws respect probability boundaries and every hardness remains reachable", () => {
  const {run,context}=loadApp();
  context.pool=[{id:1,hardness:1},{id:2,hardness:5}];
  assert(run("weightedCase(pool,'easy',()=>0.98).id===1 && weightedCase(pool,'easy',()=>0.99).id===2"),"Easy weights ignored");
  assert(run("weightedCase(pool,'hard',()=>0.01).id===1 && weightedCase(pool,'hard',()=>0.02).id===2"),"Hard weights ignored");
  assert(run("Object.keys(DIFFICULTY_LABELS).every(level=>[1,2,3,4,5].every(h=>caseWeight({hardness:h},level)>0))"),"Some cases unreachable");
  assert(run("weightedCase(pool,'medium',()=>0).id===1 && weightedCase(pool,'medium',()=>0.999999).id===2"),"Sampling boundaries incorrect");
});

Deno.test("sustained practice samples familiar, intermediate and uncommon knowledge differently in both games", () => {
  const {run}=loadApp();
  const results=run(`(() => {
    const results={};
    for (const type of ['clinical','treatment']) {
      gameType=type; practiceCategory='all';
      results[type]={};
      for(const level of ['easy','medium','hard']) {
        difficulty=level; practiceHistory.clear(); currentCase=undefined;
        let seed=123456789, sum=0, uncommon=0;
        const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        for(let n=0;n<6000;n++) {
          currentCase=randomPracticeCase(random);
          sum+=currentCase.hardness;
          uncommon+=currentCase.hardness>=4?1:0;
        }
        results[type][level]={mean:sum/6000,uncommon:uncommon/6000};
      }
    }
    return results;
  })()`);
  for(const [type,levels] of Object.entries(results)) {
    assert(levels.easy.mean<2.1,`${type}: easy no longer favours familiar knowledge`);
    assert(levels.medium.mean>levels.easy.mean+0.6,`${type}: medium indistinguishable from easy`);
    assert(levels.hard.mean>levels.medium.mean+0.35,`${type}: hard indistinguishable from medium`);
    assert(levels.hard.uncommon>0.4 && levels.easy.uncommon<0.06,`${type}: rare conditions not weighted as intended`);
  }
});

Deno.test("practice respects specialties and recent-case cooldown with separate histories for each game", () => {
  const {run}=loadApp();
  assert(run(`(() => {
    let seed=2468;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(const type of Object.keys(GAME_LABELS)) for(const level of Object.keys(DIFFICULTY_LABELS)) for(const category of ['all',...CATEGORIES.map(c=>c.id)]) {
      gameType=type; difficulty=level; practiceCategory=category; practiceHistory.clear(); currentCase=undefined;
      const history=[], size=practiceRepeatWindow();
      for(let i=0;i<50;i++) {
        const item=randomPracticeCase(random);
        if(category!=='all'&&!item.categoryIds.includes(category))return false;
        if(size&&history.slice(-size).includes(item.id))return false;
        history.push(item.id); currentCase=item;
      }
    }
    return true;
  })()`),"Practice repeated too soon or escaped specialty");
  run("practiceHistory.clear(); practiceCategory='cardiology'; gameType='clinical'; randomPracticeCase(); gameType='treatment'; randomPracticeCase()");
  assert(run("practiceHistory.get('clinical:cardiology').length===1 && practiceHistory.get('treatment:cardiology').length===1"),"Mode histories mixed");
  run("CASES=[{id:9001,hardness:5,categoryIds:['only']}];practiceCategory='all';currentCase=undefined;practiceHistory.clear()");
  assert(run("Object.keys(DIFFICULTY_LABELS).every(level=>{difficulty=level;return randomPracticeCase().id===9001})"),"Single-case rare-only group cannot be sampled");
});

Deno.test("changing practice difficulty draws a fresh weighted question while retaining category and assistance", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  run("switchCategory('ophthalmology')");
  const first=run("currentCase.id");
  run("switchDifficulty('hard')");
  assert(run("currentCase.id")!==first && run("currentCase.categoryIds.includes('ophthalmology') && revealed===1 && attempts.length===0"),"Difficulty did not draw a new in-category case");
  assert(nodes.get("#guess-input").getAttribute("list")==="diagnosis-list","Difficulty disabled assistance");
  const second=run("currentCase.id");
  run("switchDifficulty('hard')");
  assert(run("currentCase.id")===second,"Reapplying same difficulty discarded the question");
});

Deno.test("daily weighted schedules are deterministic, distinct, order-independent and stable when pinned", () => {
  const {run,context}=loadApp();
  context.date="2026-10-26";
  const baseline=run("dailySchedule(date)");
  const ids=schedule=>Object.values(schedule).flatMap(levels=>Object.values(levels)).map(item=>item.id);
  assert(new Set(ids(baseline)).size===6,"Daily types or difficulties share the same question");
  assert(JSON.stringify(ids(baseline))===JSON.stringify(ids(run("dailySchedule(date)"))),"Daily draw changed without input changes");
  run("CASES.reverse()");
  assert(JSON.stringify(ids(baseline))===JSON.stringify(ids(run("dailySchedule(date)"))),"CSV row order changed daily draw");
  context.expected=baseline;
  assert(run(`(() => {
    const slots=Object.keys(GAME_LABELS).flatMap(type=>Object.keys(DIFFICULTY_LABELS).map(level=>[type,level]));
    for(let mask=0;mask<64;mask++) {
      const pinned={};
      slots.forEach(([type,level],i)=>{if(mask&(1<<i)){pinned[type]??={};pinned[type][level]=expected[type][level];}});
      const actual=dailySchedule(date,pinned);
      if(slots.some(([type,level])=>actual[type][level].id!==expected[type][level].id))return false;
    }
    return true;
  })()`),"Playing difficulties in a different order changes the remaining daily questions");
});

Deno.test("daily schedules follow the same familiarity bias across many dates", () => {
  const {run}=loadApp();
  const means=run(`(() => {
    const totals={easy:0,medium:0,hard:0};
    for(let day=0;day<400;day++) {
      const date=new Date(Date.UTC(2026,0,1)+day*86400000).toISOString().slice(0,10);
      const schedule=dailySchedule(date);
      for(const type of Object.keys(GAME_LABELS)) for(const level of Object.keys(DIFFICULTY_LABELS))totals[level]+=schedule[type][level].hardness;
    }
    return Object.fromEntries(Object.entries(totals).map(([key,sum])=>[key,sum/800]));
  })()`);
  assert(means.medium>means.easy+0.6 && means.hard>means.medium+0.35,"Daily selection ignores difficulty weights");
});

Deno.test("v3 progress and totals migrate without counting an already completed disease again", async () => {
  const base=loadApp();
  const date=base.run("todayKey()");
  const round={caseId:1,revealed:4,attempts:[{text:"wrong",correct:false}],finished:false};
  const complete={...round,finished:true,attempts:[{text:"A91",correct:true}]};
  const app=loadApp({"chanle-difficulty-v1":"hard","chanle-daily-state-v3":JSON.stringify({date,rounds:{clinical:{easy:complete,hard:round}},recorded:{clinical:true}}),"chanle-stats-v1":JSON.stringify({played:12,solved:9,streak:2})});
  await app.run("init()");
  assert(app.run("currentCase.id===1 && revealed===4 && attempts.length===1 && getStats().played===12"),"Migration replaced progress or totals");
  app.nodes.get("#guess-input").value="A91";
  app.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(app.run("getStats().played===12"),"Same legacy disease counted a second time");
  app.run("switchDifficulty('medium')");
  assert(app.run("currentCase.id!==1"),"New daily difficulty duplicated a migrated case");
  app.nodes.get("#guess-input").value=app.run("currentCase.diagnosis");
  app.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(app.run("getStats().played===13"),"New daily difficulty did not count");
  const restored=loadApp(Object.fromEntries(app.storage)); await restored.run("init()");
  assert(restored.run("finished && getStats().played===13"),"Reload changed completion totals");
});

Deno.test("old saves cannot be revived on a new v4 day and missing ratings fail startup", async () => {
  const base=loadApp();const date=base.run("todayKey()");
  const old={date,rounds:{clinical:{easy:{caseId:1,revealed:4,attempts:[],finished:false}}},recorded:{}};
  const app=loadApp({"chanle-daily-state-v4":JSON.stringify({...old,date:"2000-01-01"}),"chanle-daily-state-v3":JSON.stringify(old)});
  await app.run("init()");
  assert(app.run("revealed===1"),"Stale legacy save reimported");
  const broken=loadApp(); const fetch=broken.context.fetch;
  broken.context.fetch=url=>url==="case-difficulty.json"?Promise.resolve({ok:false}):fetch(url);
  broken.context.console={error(){}};
  await broken.run("init()");
  assert(broken.nodes.get("#case-title").textContent.includes("Không tải")&&!broken.nodes.get("#guess-form").listeners.has("submit"),"Incomplete difficulty data silently fell back to uniform sampling");
});
