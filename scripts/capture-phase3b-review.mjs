/**
 * Phase 3b live production screenshot capture.
 * Captures hub + activities from workers.dev with ?review= query params.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "review", "v5", "phase3b-live");
const BASE = process.env.REVIEW_URL || "https://arias-color-garden.old-rice-0a9f.workers.dev";

const LANDSCAPE = { name: "landscape-1440x900", width: 1440, height: 900 };
const PORTRAIT = { name: "portrait-390x844", width: 390, height: 844 };

const LANDSCAPE_SCREENS = [
  "hub",
  "findFriend",
  "colors",
  "feed",
  "animalSounds",
  "shapes",
  "gardenCare",
  "freePlay",
  "music",
  "animals",
  "counting",
];

const PORTRAIT_SCREENS = ["hub", "findFriend", "colors", "feed"];

const FRIENDS_KEY = "aria-color-garden-friends";
const ALL_FRIENDS = ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"];

await mkdir(OUT, { recursive: true });

async function waitForServer(url, ms = 60000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status >= 200) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  });
}

async function gotoReview(page, activity) {
  const url = `${BASE}/?review=${activity}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await settle(page);

  // Hard reload once if the main app shell looks empty / not ready
  const ready = await page.evaluate(() => {
    const root = document.querySelector("#root, main, [data-activity], .garden-map-root, .activity-shell");
    return Boolean(root) && document.body.innerText.trim().length > 0;
  });
  if (!ready) {
    console.log("hard reload once for", activity);
    await page.reload({ waitUntil: "networkidle", timeout: 90000 });
    await settle(page);
  }
}

async function captureViewport(browser, vp, screens) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addInitScript(
    ({ key, friends }) => {
      localStorage.setItem(key, JSON.stringify(friends));
    },
    { key: FRIENDS_KEY, friends: ALL_FRIENDS },
  );

  const files = [];
  for (const activity of screens) {
    await gotoReview(page, activity);
    const file = join(OUT, `${activity}--${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    files.push(file);
    console.log("captured", file);
  }

  await context.close();
  return files;
}

console.log("Waiting for", BASE);
await waitForServer(BASE);
console.log("Server ready");

const browser = await chromium.launch({ headless: true });
const created = [];
try {
  created.push(...(await captureViewport(browser, LANDSCAPE, LANDSCAPE_SCREENS)));
  created.push(...(await captureViewport(browser, PORTRAIT, PORTRAIT_SCREENS)));
} finally {
  await browser.close();
}

console.log("\nDone. Wrote", created.length, "screenshots to", OUT);
for (const f of created) console.log(" -", f);
