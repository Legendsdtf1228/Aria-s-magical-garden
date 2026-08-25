/**
 * Cloudflare live audit for Phaser POC:
 * - HEAD every POC_ASSETS path
 * - Fresh browser route test for ?review= hub/findFriend/feed/freePlay
 * - Console error capture
 * - Write docs/review/v5/phaser-poc/AUDIT-REPORT.json
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "review", "v5", "phaser-poc");
const BASE = process.env.REVIEW_URL || "https://arias-color-garden.old-rice-0a9f.workers.dev";

const { POC_ASSETS } = await import(pathToFileURL(join(ROOT, "app/phaser-poc/game/assetManifest.ts")).href);

await mkdir(OUT, { recursive: true });

const assetResults = [];
for (const a of POC_ASSETS) {
  const url = `${BASE}${a.path}`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    assetResults.push({ key: a.key, path: a.path, status: res.status, ok: res.ok });
  } catch (e) {
    assetResults.push({ key: a.key, path: a.path, status: 0, ok: false, error: String(e) });
  }
}

const routes = ["hub", "findFriend", "feed", "freePlay"];
const routeResults = [];

const browser = await chromium.launch({ headless: true });
for (const id of routes) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Fresh context = cleared cache
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  const url = `${BASE}/phaser-poc?review=${id}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(4500);

  const probe = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const scene = document.querySelector("[data-poc-scene]")?.getAttribute("data-poc-scene");
    const badge = document.body.innerText.includes("Phaser POC");
    const retry = document.body.innerText.includes("Try again") || document.body.innerText.includes("Intentar");
    return {
      hasCanvas: Boolean(canvas),
      canvasW: canvas?.width || 0,
      canvasH: canvas?.height || 0,
      scene,
      badge,
      retryVisible: retry,
      bodySnippet: document.body.innerText.slice(0, 200),
    };
  });

  routeResults.push({
    review: id,
    url,
    ...probe,
    consoleErrors,
    pageErrors,
    loadedOk:
      probe.hasCanvas &&
      probe.canvasW > 100 &&
      !probe.retryVisible &&
      probe.scene !== "Preload" &&
      probe.scene !== "Boot",
  });
  await context.close();
}
await browser.close();

const report = {
  base: BASE,
  checkedAt: new Date().toISOString(),
  assets: assetResults,
  assetsAllOk: assetResults.every((a) => a.ok),
  routes: routeResults,
  routesAllOk: routeResults.every((r) => r.loadedOk),
};

await writeFile(join(OUT, "AUDIT-REPORT.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.assetsAllOk || !report.routesAllOk) process.exitCode = 1;
