import vm from "node:vm";

// Run the real browser functions without starting the UI or using network access.
export function loadApp(saved = {}) {
  const source = Deno.readTextFileSync(new URL("../app.js", import.meta.url));
  if (!/\ninit\(\);\s*$/.test(source)) throw new Error("Cannot locate app startup");
  const nodes = new Map();
  const storage = new Map(Object.entries(saved));
  const node = () => ({
    textContent: "", innerHTML: "", disabled: false, value: "",
    listeners: new Map(),
    attributes: new Map(),
    addEventListener(event, listener) { this.listeners.set(event, listener); },
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute(name, value) { this.attributes.set(name, String(value)); },
    getAttribute(name) { return this.attributes.get(name) ?? null; },
    removeAttribute(name) { this.attributes.delete(name); },
    focus() { this.focused = true; },
    querySelector() { return node(); },
  });
  const context = vm.createContext({
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    document: {
      querySelectorAll() { return []; },
      querySelector(selector) {
        if (!nodes.has(selector)) nodes.set(selector, node());
        return nodes.get(selector);
      },
    },
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.replace(/\ninit\(\);\s*$/, ""));
  context.csvText = Deno.readTextFileSync(new URL("../cases.csv", import.meta.url));
  context.revisionData = JSON.parse(Deno.readTextFileSync(new URL("../revision-data.json", import.meta.url)));
  context.difficultyData = JSON.parse(Deno.readTextFileSync(new URL("../case-difficulty.json", import.meta.url)));
  context.fetch = (url) => Promise.resolve(url === "case-difficulty.json" ?
    {ok:true, json:() => Promise.resolve(context.difficultyData)} : url === "revision-data.json" ?
    {ok:true, json:() => Promise.resolve(context.revisionData)} : {ok: true, text: () => Promise.resolve(context.csvText)});
  const rows = run("parseCsv(csvText)");
  context.caseRows = rows;
  run("validateCaseRows(caseRows); applyRevisionData(revisionData, caseRows); applyDifficultyData(difficultyData, caseRows);");
  return { run, rows, revision:context.revisionData, hardness:context.difficultyData, context, nodes, storage };
}
