/**
 * Capture Phaser POC screenshots at 1440×900 and 390×844.
 * Expects REVIEW_URL like https://host/phaser-poc
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "review", "v5", "phaser-poc");
const BASE = process.env.REVIEW_URL || "http://127.0.0.1:4173/phaser-poc";

const SCREENS = ["hub", "findFriend", "feed", "freePlay"];

await mkdir(OUT, { recursive: true });

async function capture(width, height, label) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  for (const id of SCREENS) {
    const url = `${BASE}?review=${id}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2500);
    const file = join(OUT, `${id}--${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log("wrote", file);
  }
  await browser.close();
}

await capture(1440, 900, "landscape-1440x900");
await capture(390, 844, "portrait-390x844");
console.log("done");
