import { loadApp } from "../scripts/app-harness.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const click = (app, id) => app.nodes.get(id).listeners.get("click")();
const guess = (app, text) => {
  app.nodes.get("#guess-input").value = text;
  app.nodes.get("#guess-form").listeners.get("submit")({preventDefault(){}});
};

Deno.test("manual reveals use the shared budget at every difficulty and preserve a final guess", async () => {
  const app = loadApp();
  await app.run("init()");
  for (const game of ["clinical", "treatment"]) for (const level of ["easy", "medium", "hard"]) {
    app.run(`mode='practice'; gameType='${game}'; difficulty='${level}'; setCase(CASES[0])`);
    for (let i = 1; i <= 5; i++) {
      click(app, "#reveal-button");
      assert(app.run("attempts.length") === i && app.run("revealed") === i + 1, "Reveal budget drifted");
      assert(app.nodes.get("#attempts-left").textContent === 6 - i, "Remaining count drifted");
    }
    assert(app.run("!finished && attempts.every(a=>a.kind==='reveal' && !a.correct)"), "Reveals look like correct answers");
    assert(app.nodes.get("#history").innerHTML.includes("Mở dữ kiện"), "Reveal history not distinguished");
    click(app, "#reveal-button");
    assert(app.run("attempts.length===5 && revealed===6"), "Disabled reveal spent another guess");
    guess(app, app.run("currentCase.diagnosis"));
    assert(app.run("finished && attempts.length===6 && attempts[5].correct"), "Final answer unavailable");
    assert(app.run("shareText()").includes("6/6\n🟨🟨🟨🟨🟨🟩"), "Shared score ignores reveals");
  }
});

Deno.test("mixed guesses and reveals end at six, including a final reveal in an older saved round", async () => {
  const app = loadApp(); await app.run("init()"); app.run("switchMode('practice')");
  guess(app, "incorrect"); click(app, "#reveal-button");
  assert(app.run("attempts.length===2 && revealed===3 && !finished"), "Mixed actions use separate budgets");
  for (let i = 0; i < 4; i++) guess(app, "incorrect");
  assert(app.run("finished && attempts.length===6 && revealed===6"), "Six actions did not end round");
  app.run("setCase(CASES[0]); attempts=Array.from({length:5},()=>({text:'wrong',correct:false})); revealed=2; render()");
  click(app, "#reveal-button");
  assert(app.run("finished && attempts.length===6 && revealed===6"), "Last paid reveal did not finish");
  assert(app.nodes.get("#answer").textContent === app.run("currentCase.diagnosis"), "No answer after exhaustion");
});

Deno.test("give up ends either game as an unsolved round, reveals explanations and records once", async () => {
  for (const game of ["clinical", "treatment"]) for (const mode of ["daily", "practice"]) {
    const app = loadApp(); await app.run("init()");
    app.run(`switchGame('${game}'); switchMode('${mode}'); setStats({played:4,solved:3,streak:3})`);
    click(app, "#give-up-button");
    assert(app.run("finished && gaveUp && revealed===6 && attempts.length===0"), "Give up fabricated guesses or did not finish");
    assert(app.run("getStats().played===5 && getStats().solved===3 && getStats().streak===0"), "Give up not recorded as unsolved");
    assert(app.nodes.get("#guess-input").disabled && app.nodes.get("#give-up-button").disabled && app.nodes.get("#reveal-button").disabled, "Finished controls remain active");
    assert(app.nodes.get("#answer").textContent === app.run("currentCase.diagnosis") && app.nodes.get("#answer").focused, "Answer not revealed/focused");
    assert(app.nodes.get("#summary").textContent === app.run("currentCase.summary"), "Explanation missing");
    if (game === "treatment") assert(app.nodes.get("#treatment-explanation").textContent === app.run("currentCase.treatmentExplanation"), "Treatment explanation missing");
    click(app, "#give-up-button"); click(app, "#reveal-button"); guess(app, app.run("currentCase.diagnosis")); app.run("finish(false)");
    assert(app.run("getStats().played===5 && getStats().solved===3"), "Repeated actions recounted round");
    click(app, "#review-next");
    assert(app.run("!finished && !gaveUp && revealed===1 && attempts.length===0"), "Next round retained give-up state");
    assert(!app.nodes.get("#give-up-button").disabled, "Give up disabled in new round");
  }
});

Deno.test("daily reveals and give-ups survive reloads and stay isolated across game/difficulty slots", async () => {
  for (const game of ["clinical", "treatment"]) {
    const first = loadApp(); await first.run("init()"); first.run(`switchGame('${game}')`);
    click(first, "#reveal-button");
    const second = loadApp(Object.fromEntries(first.storage)); await second.run("init()");
    assert(second.run("revealed===2 && attempts.length===1 && attempts[0].kind==='reveal' && !finished"), "Paid reveal lost on reload");
    click(second, "#give-up-button");
    const third = loadApp(Object.fromEntries(second.storage)); await third.run("init()");
    assert(third.run("finished && gaveUp && revealed===6 && attempts.length===1"), "Give-up save discarded");
    assert(third.run("getStats().played===1 && getStats().solved===0"), "Reload recounted give up");
    third.run("switchDifficulty('hard')");
    assert(third.run("!finished && !gaveUp && attempts.length===0"), "Give up leaked into another difficulty");
    third.run("switchDifficulty('easy')");
    assert(third.run("finished && gaveUp"), "Returning to daily slot lost give up");
    third.run(`switchGame('${game === "clinical" ? "treatment" : "clinical"}')`);
    assert(third.run("!finished && !gaveUp"), "Give up leaked into another game");
  }
});

Deno.test("round validation preserves legacy saves and rejects invalid give-up or reveal records", () => {
  const app=loadApp();
  app.context.round={caseId:1,revealed:3,attempts:[{text:"wrong",correct:false}],finished:false};
  assert(app.run("validRound(round,CASES[0])"), "Legacy in-progress round rejected");
  app.context.round={...app.context.round,gaveUp:true,finished:true};
  assert(app.run("validRound(round,CASES[0])"), "Valid give up rejected");
  for (const change of [r=>{r.gaveUp="yes";},r=>{r.finished=false;},r=>{r.attempts[0].correct=true;},r=>{r.attempts[0].kind="invented";}]) {
    const valid=app.context.round; const changed=structuredClone(valid); change(changed); app.context.round=changed;
    assert(!app.run("validRound(round,CASES[0])"), "Malformed round accepted"); app.context.round=valid;
  }
});
