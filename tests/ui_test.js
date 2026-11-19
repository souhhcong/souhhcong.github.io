import {loadApp} from "../scripts/app-harness.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

Deno.test("visible clue and guess progress stays in sync through reveals, guesses and mode resets", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  assert(nodes.get("#clue-progress").value===1 && nodes.get("#clue-count").textContent==="1 / 6","Initial progress incorrect");
  nodes.get("#reveal-button").listeners.get("click")();
  assert(nodes.get("#clue-progress").value===2 && nodes.get("#attempts-left").textContent===5,"Reveal did not spend one guess or missed progress");
  nodes.get("#guess-input").value=run("suggestionNames.find((e)=>!isCorrect(e.name)&&!guessedKeys().has(e.key)).name");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(nodes.get("#clue-progress").value===3 && nodes.get("#history-count").textContent==="2 / 6","Guess progress did not update");
  assert(nodes.get("#attempt-track").getAttribute("aria-label")==="Đã dùng 2 trên 6 lượt đoán","Accessible progress stale");
  while(run("revealed<6")) nodes.get("#reveal-button").listeners.get("click")();
  nodes.get("#guess-input").value=run("suggestionNames.find((e)=>!isCorrect(e.name)&&!guessedKeys().has(e.key)).name");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("finished && attempts.length===6") && nodes.get("#feedback").textContent==="Đã hết lượt đoán","Final guess did not end the round");
  run("switchGame('treatment')");
  assert(nodes.get("#app").getAttribute("data-game-type")==="treatment","Mode appearance stale");
  assert(nodes.get("#clue-progress").value===1 && nodes.get("#history-count").textContent==="0 / 6","New mode retained old progress");
  run("switchDifficulty('hard')");
  assert(nodes.get("#guess-input").getAttribute("role")==="combobox" && nodes.get("#play-tip").textContent.includes("Chọn từ gợi ý"),"Difficulty changed easy-mode assistance");
});

Deno.test("completion updates the review focus, round state and meaningful accuracy statistics", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  assert(nodes.get("#accuracy").textContent==="—","No games should not show a fabricated percentage");
  run("switchMode('practice')");
  nodes.get("#guess-input").value=run("currentCase.diagnosis");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(nodes.get("#app").getAttribute("data-round")==="solved","Completion state missing");
  assert(nodes.get("#clue-progress").value===6 && nodes.get("#reveal-button").disabled,"Solved round did not reveal the complete case for revision");
  assert(nodes.get("#answer").focused && nodes.get("#round-status").textContent.includes("hoàn thành"),"Review is not reachable or status is stale");
  assert(nodes.get("#accuracy").textContent==="100%","Successful round percentage incorrect");
  nodes.get("#review-next").listeners.get("click")();
  assert(nodes.get("#case-title").focused,"Next round did not return focus to the new case");
  for(let i=0;i<6;i++) {
    nodes.get("#guess-input").value=run("suggestionNames.find((e)=>!isCorrect(e.name)&&!guessedKeys().has(e.key)).name");
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  }
  assert(nodes.get("#accuracy").textContent==="50%" && nodes.get("#app").getAttribute("data-round")==="complete","Loss statistics or completion incorrect");
  nodes.get("#new-case-button").listeners.get("click")();
  assert(nodes.get("#app").getAttribute("data-round")==="active" && nodes.get("#clue-progress").value===1,"New round did not reset visual state");
});

Deno.test("an already guessed diagnosis is greyed out in suggestions and cannot be guessed again", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  const name=run("suggestionNames.find((e)=>!isCorrect(e.name)).name");
  nodes.get("#guess-input").value=name;
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("attempts.length")===1,"First guess not recorded");
  nodes.get("#guess-input").value=name;
  run("updateSuggestions()");
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("attempts.length")===1 && nodes.get("#feedback").textContent.includes("đã đoán"),"Repeated guess consumed a turn");
  assert(run(`normalize(${JSON.stringify(name)})`)&&run(`guessedKeys().has(normalize(${JSON.stringify(name)}))`),"Guessed key not tracked");
});

Deno.test("guessing a disease by ICD code also blocks its name, and vice versa", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  const code=run("(()=>{const c=CASES.find((x)=>x.id!==currentCase.id&&CASES.filter((y)=>y.icdCode===x.icdCode).length===1);return c.icdCode})()");
  const name=run(`CASES.find((x)=>x.icdCode===${JSON.stringify(code)}).diagnosis`);
  nodes.get("#guess-input").value=`${code} — x`;
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("attempts.length")===1,"Code guess not recorded");
  nodes.get("#guess-input").value=name;
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(run("attempts.length")===1,"Same disease by name cost another turn");
});
