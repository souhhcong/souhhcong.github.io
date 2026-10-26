import {loadApp} from "../scripts/app-harness.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

Deno.test("visible clue and guess progress stays in sync through reveals, guesses and mode resets", async () => {
  const {run,nodes}=loadApp();
  await run("init()");
  assert(nodes.get("#bank-count").textContent===run("CASES.length") && nodes.get("#specialty-count").textContent===run("CATEGORIES.length"),"Bank overview missing");
  assert(nodes.get("#clue-progress").value===1 && nodes.get("#clue-count").textContent==="1 / 6","Initial progress incorrect");
  nodes.get("#reveal-button").listeners.get("click")();
  assert(nodes.get("#clue-progress").value===2 && nodes.get("#attempts-left").textContent===6,"Reveal spent a guess or missed progress");
  nodes.get("#guess-input").value="wrong";
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(nodes.get("#clue-progress").value===3 && nodes.get("#history-count").textContent==="1 / 6","Guess progress did not update");
  assert(nodes.get("#attempt-track").getAttribute("aria-label")==="Đã dùng 1 trên 6 lượt đoán","Accessible progress stale");
  while(run("revealed<6")) nodes.get("#reveal-button").listeners.get("click")();
  nodes.get("#guess-input").value="wrong again";
  nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  assert(nodes.get("#feedback").textContent.includes("đã mở đủ"),"Feedback claims another clue opened after all six");
  run("switchGame('treatment')");
  assert(nodes.get("#app").getAttribute("data-game-type")==="treatment","Mode appearance stale");
  assert(nodes.get("#clue-progress").value===1 && nodes.get("#history-count").textContent==="0 / 6","New mode retained old progress");
  run("switchDifficulty('hard')");
  assert(nodes.get("#guess-input").getAttribute("list")==="diagnosis-list" && nodes.get("#play-tip").textContent.includes("Chọn từ gợi ý"),"Difficulty changed easy-mode assistance");
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
    nodes.get("#guess-input").value="incorrect";
    nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
  }
  assert(nodes.get("#accuracy").textContent==="50%" && nodes.get("#app").getAttribute("data-round")==="complete","Loss statistics or completion incorrect");
  nodes.get("#new-case-button").listeners.get("click")();
  assert(nodes.get("#app").getAttribute("data-round")==="active" && nodes.get("#clue-progress").value===1,"New round did not reset visual state");
});
