// GitHub Pages caches static assets. Tie each URL to its content so a new HTML
// document cannot accidentally load a previous release's CSS or JavaScript.
export const ASSETS = ["styles.css", "app.js", "assets/logo.svg"];
const root = new URL("../", import.meta.url);

export async function versionAssetUrls(html, readAsset = path => Deno.readFile(new URL(path, root))) {
  for (const path of ASSETS) {
    const bytes = await readAsset(path);
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const references = new RegExp(`((?:src|href)=")${escaped}(?:\\?[^"#]*)?(")`, "g");
    if (!references.test(html)) throw new Error(`Missing HTML asset reference: ${path}`);
    html = html.replace(references, `$1${path}?v=${hash}$2`);
  }
  return html;
}

if (import.meta.main) {
  if (Deno.args.length) throw new Error("Usage: deno task version:assets");
  const index = new URL("index.html", root);
  const before = await Deno.readTextFile(index);
  const after = await versionAssetUrls(before);
  if (after !== before) await Deno.writeTextFile(index, after);
  console.log(after === before ? "Asset versions are current." : "Updated content-based asset URLs in index.html.");
}
