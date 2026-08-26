/**
 * Capture GardenHub only (Phase-3 visual proof).
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "review", "v5", "phaser-poc");
const BASE = process.env.REVIEW_URL || "http://127.0.0.1:4173/phaser-poc";
const bust = process.env.CACHE_BUST || String(Date.now());

await mkdir(OUT, { recursive: true });

async function shot(width, height, label) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  const url = `${BASE}?review=hub&v=${bust}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2800);
  const file = join(OUT, `hub--${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
  await browser.close();
}

await shot(1440, 900, "landscape-1440x900");
await shot(390, 844, "portrait-390x844");
console.log("done");
