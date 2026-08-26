/**
 * Capture deployed proof — hub, zones, props checkerboard.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "review", "v5", "phaser-poc");
const BASE = process.env.REVIEW_URL || "https://arias-color-garden.old-rice-0a9f.workers.dev/phaser-poc";
const bust = process.env.CACHE_BUST || String(Date.now());

await mkdir(OUT, { recursive: true });

async function shot(page, name) {
  const file = join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
}

async function goto(page, w, h, query) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}?${query}&v=${bust}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2800);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await goto(page, 1440, 900, "review=hub");
await shot(page, "hub--landscape-1440x900.png");
await goto(page, 390, 844, "review=hub");
await shot(page, "hub--portrait-390x844.png");

for (const zone of ["cottage", "pond", "gazebo", "picnic"]) {
  await goto(page, 1440, 900, `review=hub&zone=${zone}`);
  await shot(page, `hub-zone-${zone}--landscape-1440x900.png`);
  if (zone === "pond" || zone === "gazebo") {
    await goto(page, 390, 844, `review=hub&zone=${zone}`);
    await shot(page, `hub-zone-${zone}--portrait-390x844.png`);
  }
}

await browser.close();

execSync("node scripts/audit-prop-checkerboard.mjs", { stdio: "inherit", cwd: ROOT });
execSync("node scripts/audit-cast-checkerboard.mjs", { stdio: "inherit", cwd: ROOT });

console.log("done", { bust, base: BASE });
