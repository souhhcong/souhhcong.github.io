import { ASSETS, versionAssetUrls } from "../scripts/version-assets.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

Deno.test("deployed HTML versions every script, stylesheet and logo against its actual content", async () => {
  const html = await Deno.readTextFile(new URL("../index.html", import.meta.url));
  assert(await versionAssetUrls(html) === html, "Stale asset URLs: run deno task version:assets before deploying.");
  for (const path of ASSETS) assert(html.includes(`${path}?v=`), `Unversioned asset: ${path}`);
});

Deno.test("changing an asset invalidates only its own URL and updates all logo references", async () => {
  const html = '<link href="styles.css"><script src="app.js" defer></script><link href="assets/logo.svg"><img src="assets/logo.svg" />';
  const read = path => Promise.resolve(new TextEncoder().encode(path));
  const before = await versionAssetUrls(html, read);
  const after = await versionAssetUrls(before, path => path === "app.js" ? Promise.resolve(new TextEncoder().encode("changed")) : read(path));
  const attr = (source, path) => source.match(new RegExp(`${path.replaceAll(".", "\\.")}\\?v=[a-f0-9]{12}`))[0];
  assert(attr(before, "app.js") !== attr(after, "app.js"), "Updated script kept its cached URL");
  assert(attr(before, "styles.css") === attr(after, "styles.css"), "Unchanged stylesheet lost its stable URL");
  const logos = [...after.matchAll(/assets\/logo\.svg\?v=[a-f0-9]{12}/g)].map(m => m[0]);
  assert(logos.length === 2 && logos[0] === logos[1], "Logo references disagree");
  assert(await versionAssetUrls(after, path => path === "app.js" ? Promise.resolve(new TextEncoder().encode("changed")) : read(path)) === after, "Versioning is not idempotent");
});
