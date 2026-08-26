/**
 * Color Garden toddler-usability proof captures from deployed Cloudflare.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "review", "v5", "phaser-poc");
const BASE =
  process.env.REVIEW_URL || "https://arias-color-garden.old-rice-0a9f.workers.dev/phaser-poc";
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
  await page.waitForTimeout(3200);
}

/** Tap approximate choice slot by normalized coords. */
async function tapNorm(page, x, y, w, h) {
  await page.mouse.click(x * w, y * h);
  await page.waitForTimeout(900);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Initial L + P
await goto(page, 1440, 900, "review=colors");
await shot(page, "colorGarden--landscape-1440x900.png");
await goto(page, 390, 844, "review=colors");
await shot(page, "colorGarden--portrait-390x844.png");

// Touch debug
await goto(page, 1440, 900, "review=colors&debugTouch=1");
await shot(page, "colorGarden--touch-debug-1440x900.png");

// Wrong then correct on landscape (front beds)
await goto(page, 1440, 900, "review=colors");
await tapNorm(page, 0.2, 0.82, 1440, 900);
await shot(page, "colorGarden--wrong-tap-1440x900.png");
await tapNorm(page, 0.5, 0.84, 1440, 900);
await page.waitForTimeout(600);
await shot(page, "colorGarden--correct-bloom-1440x900.png");
await tapNorm(page, 0.8, 0.82, 1440, 900);
await page.waitForTimeout(600);
await shot(page, "colorGarden--correct-bloom-alt-1440x900.png");

// Three consecutive rounds
for (let i = 1; i <= 3; i++) {
  await goto(page, 1440, 900, `review=colors&roundShot=${i}`);
  await shot(page, `colorGarden--round${i}-1440x900.png`);
  for (const x of [0.2, 0.5, 0.8]) {
    await tapNorm(page, x, 0.83, 1440, 900);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(2000);
  await shot(page, `colorGarden--round${i}-after-1440x900.png`);
}

await browser.close();
console.log("done", { bust, base: BASE });
