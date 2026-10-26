import { createPreviewHandler } from "../scripts/serve.js";
import { loadApp } from "../scripts/app-harness.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

Deno.test("preview serves real assets and safe case labels without caching", async () => {
  const handler = createPreviewHandler();
  for (const [path, type] of [["/", "text/html"], ["/app.js", "text/javascript"],
    ["/styles.css", "text/css"], ["/cases.csv", "text/csv"], ["/revision-data.json", "application/json"], ["/case-difficulty.json", "application/json"], ["/assets/logo.svg", "image/svg+xml"],
    ["/__preview/", "text/html"]]) {
    const response = await handler(new Request(`http://127.0.0.1:8000${path}`));
    assert(response.status === 200, `Failed public route: ${path}`);
    assert(response.headers.get("content-type").startsWith(type), `Wrong content type: ${path}`);
    assert(response.headers.get("cache-control") === "no-store", "Preview may cache stale files");
    assert((await response.text()).length > 0, `Empty asset: ${path}`);
  }
  const response = await handler(new Request("http://127.0.0.1:8000/__preview/cases.json"));
  const cases = await response.json();
  assert(cases.length === loadApp().rows.length, "Incomplete case selector");
  assert(cases.every((item) => Object.keys(item).sort().join(",") === "id,title"), "Unexpected data exposed in selector");
});

Deno.test("preview blocks private files, traversal, arbitrary methods and nonlocal hosts", async () => {
  const handler = createPreviewHandler();
  for (const path of ["/.internal/medical-review.json", "/.git/config", "/README.md", "/scripts/serve.js", "/tests/app_test.js",
    "/../.internal/medical-review.json", "/%2einternal/medical-review.json", "/assets/%2e%2e/.internal/medical-review.json",
    "/%2e%2e%2f.internal%2fmedical-review.json", "/assets/"]) {
    const response = await handler(new Request(`http://127.0.0.1:8000${path}`));
    assert(response.status === 404, `Private route exposed: ${path}`);
    assert(await response.text() === "Not found", "Response leaked file details");
  }
  const post = await handler(new Request("http://127.0.0.1:8000/", {method: "POST"}));
  assert(post.status === 405, "Unexpected mutation method allowed");
  await post.body.cancel();
  const external = await handler(new Request("http://example.com/"));
  assert(external.status === 403, "Nonlocal host accepted");
  await external.body.cancel();
  const head = await handler(new Request("http://localhost:8000/cases.csv", {method: "HEAD"}));
  assert(head.status === 200 && await head.text() === "", "HEAD must have no body");
});

Deno.test("local case links select fresh practice rounds and the requested difficulty", async () => {
  for (const hostname of ["127.0.0.1", "localhost"]) {
    const { context, run, nodes } = loadApp();
    context.location = {hostname, search: "?case=43&difficulty=hard"};
    context.URLSearchParams = URLSearchParams;
    await run("init()");
    assert(run('currentCase.id === 43 && mode === "practice" && difficulty === "hard" && !finished && attempts.length === 0'), "Local case link ignored");
    assert(nodes.get("#case-title").textContent === run("currentCase.title"), "Hard preview hid a title");
    assert(nodes.get("#guess-input").getAttribute("list") === "diagnosis-list", "Hard preview lost easy-mode suggestions");
  }
});

Deno.test("public hosts ignore preview parameters; invalid local options are safe", async () => {
  const { context, run } = loadApp();
  context.URLSearchParams = URLSearchParams;
  context.location = {hostname: "souhhcong.github.io", search: "?case=43&difficulty=hard"};
  await run("init()");
  assert(run('mode === "daily" && difficulty === "easy"'), "Public game honored test controls");
  context.location = {hostname: "localhost", search: "?case=9999&difficulty=hard"};
  assert(run("localPreviewOptions() === null"), "Unknown case accepted");
  context.location.search = "?case=43&difficulty=constructor";
  assert(run('localPreviewOptions().difficulty === "easy"'), "Invalid difficulty accepted");
});
