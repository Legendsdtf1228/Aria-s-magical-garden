/**
 * Capture GardenHub idle + four open zones + animation frame sequence.
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
await mkdir(join(OUT, "anim-frames"), { recursive: true });

async function shot(page, name) {
  const file = join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
}

async function openHub(page, width, height, extra = "") {
  await page.setViewportSize({ width, height });
  const url = `${BASE}?review=hub${extra}&v=${bust}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2600);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// 1–2 idle hub
await openHub(page, 1440, 900);
await shot(page, "hub--landscape-1440x900.png");
await openHub(page, 390, 844);
await shot(page, "hub--portrait-390x844.png");

// 3–6 zones opened (landscape proof)
for (const zone of ["cottage", "pond", "gazebo", "picnic"]) {
  await openHub(page, 1440, 900, `&zone=${zone}`);
  await shot(page, `hub-zone-${zone}--landscape-1440x900.png`);
}

// Animation frame sequence — bunny hop + frog + ambient invites
await openHub(page, 1440, 900);
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(280);
  await shot(page, join("anim-frames", `hub-anim-${String(i).padStart(2, "0")}.png`));
}

await browser.close();
console.log("done");
