import { loadApp } from "./app-harness.js";

const root = new URL("../", import.meta.url);
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/cases.csv", ["cases.csv", "text/csv; charset=utf-8"]],
  ["/revision-data.json", ["revision-data.json", "application/json; charset=utf-8"]],
  ["/case-difficulty.json", ["case-difficulty.json", "application/json; charset=utf-8"]],
  ["/assets/logo.svg", ["assets/logo.svg", "image/svg+xml"]],
  ["/404.html", ["404.html", "text/html; charset=utf-8"]],
  ["/__preview/", ["scripts/preview.html", "text/html; charset=utf-8"]],
]);

export function createPreviewHandler() {
  return async (request) => {
    const url = new URL(request.url);
    const headers = {"cache-control": "no-store", "x-content-type-options": "nosniff"};
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
      return new Response("Local preview only", {status: 403, headers});
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", {status: 405, headers: {...headers, allow: "GET, HEAD"}});
    }
    try {
      if (url.pathname === "/__preview/cases.json") {
        const { rows } = loadApp();
        const body = JSON.stringify(rows.map(({id, title}) => ({id: Number(id), title})));
        return new Response(request.method === "HEAD" ? null : body, {
          headers: {...headers, "content-type": "application/json; charset=utf-8"},
        });
      }
      const file = publicFiles.get(url.pathname);
      if (!file) return new Response("Not found", {status: 404, headers});
      const [path, type] = file;
      const body = request.method === "HEAD" ? null : await Deno.readFile(new URL(path, root));
      return new Response(body, {headers: {...headers, "content-type": type}});
    } catch (error) {
      console.error(error.message);
      return new Response("Could not load preview. Run deno task check for details.", {status: 500, headers});
    }
  };
}

if (import.meta.main) {
  const option = Deno.args.find((arg) => arg.startsWith("--port="));
  const port = option ? Number(option.slice(7)) : 8000;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Use --port=<number> between 1 and 65535");
  }
  Deno.serve({hostname: "127.0.0.1", port}, createPreviewHandler());
  console.log(`Game: http://127.0.0.1:${port}/`);
  console.log(`Case and screen-size controls: http://127.0.0.1:${port}/__preview/`);
}
