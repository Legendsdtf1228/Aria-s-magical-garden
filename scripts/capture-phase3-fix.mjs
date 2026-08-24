/**
 * Phase 3 FIX production capture — screens + live anim strips + counting through 4.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const OUT = "docs/review/v5/phase3-production";
const BASE = process.env.REVIEW_URL || "http://127.0.0.1:5173";
const FRIENDS_KEY = "aria-color-garden-friends";
const ALL_FRIENDS = ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"];

const VIEWPORTS = [
  { name: "landscape-1440x900", width: 1440, height: 900 },
  { name: "portrait-390x844", width: 390, height: 844 },
];

const SCREENS = [
  { query: "welcome", file: "01-welcome" },
  { query: "hub", file: "02-garden-map" },
  { query: "findFriend", file: "03-find-friend" },
  { query: "colors", file: "04-color-garden" },
  { query: "counting", file: "05-counting-pond" },
];

await mkdir(OUT, { recursive: true });

async function waitForServer(url, ms = 120000) {
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

async function seed(page) {
  await page.addInitScript(
    ({ key, friends }) => {
      localStorage.setItem(key, JSON.stringify(friends));
    },
    { key: FRIENDS_KEY, friends: ALL_FRIENDS },
  );
}

async function stubTts(page) {
  await page.addInitScript(() => {
    window.__countLog = [];
    const proto = window.speechSynthesis;
    const orig = proto.speak.bind(proto);
    proto.speak = (u) => {
      window.__countLog.push({ t: Date.now(), text: u?.text || "", lang: u?.lang || "" });
      // Resolve quickly so sequences complete in capture
      setTimeout(() => {
        try {
          u.onend?.();
        } catch {
          /* ignore */
        }
      }, 40);
      return orig(u);
    };
  });
}

const browser = await chromium.launch({ headless: true });
const notes = {
  source: "Playwright live app capture after Phase 3 visual reject fix",
  defects: [],
  placeholders: [],
};

try {
  await waitForServer(BASE);
  console.log("server ready");

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await seed(page);

    for (const screen of SCREENS) {
      await page.goto(`${BASE}/?review=${screen.query}${screen.query === "counting" ? "&frogs=4" : ""}`, {
        waitUntil: "networkidle",
        timeout: 90000,
      });
      await page.waitForTimeout(1400);
      await page.evaluate(() => {
        try {
          window.speechSynthesis?.cancel();
        } catch {
          /* ignore */
        }
      });
      await page.waitForTimeout(400);

      const audit = await page.evaluate(() => {
        const out = [];
        if (document.querySelector(".hill-back, .hill-mid, .hill-front")) out.push("flat-hills");
        if (document.querySelector(".big-choice, .animal-btn, .color-buddy, .painted-color-object"))
          out.push("legacy-color-tiles");
        if (document.querySelector(".spoken-prompt-bar")) out.push("white-prompt-bubble");
        if (document.querySelector(".number-lily")) out.push("css-number-lily");
        if (document.querySelector(".garden-map-root.debug-hotspots")) out.push("hotspots");
        const replay = document.querySelector(".psc-replay-btn, .replay-fab");
        if (replay && /Repla$/.test((replay.textContent || "").trim())) out.push("cropped-replay");
        const meadow = document.querySelectorAll(".meadow-animal");
        if (meadow.length && meadow.length !== 3) out.push(`find-count-${meadow.length}`);
        const scene = document.querySelector(".painted-scene-img, .map-env-img, .scene-bg-img");
        const src = scene?.getAttribute("src") || "";
        return { out, src };
      });
      for (const d of audit.out) notes.defects.push(`${screen.file}/${vp.name}: ${d}`);
      if (screen.query === "findFriend" && audit.src.includes("garden-map")) {
        notes.defects.push(`${screen.file}/${vp.name}: shared-map-mural`);
      }
      if (screen.query === "colors" && audit.src.includes("garden-map")) {
        notes.defects.push(`${screen.file}/${vp.name}: shared-map-mural`);
      }

      const file = join(OUT, `${screen.file}--${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log("captured", file);
    }
    await context.close();
  }

  // Live bunny hop frames on welcome
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await seed(page);
    await page.goto(`${BASE}/?review=welcome`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);
    const bunny = page.locator(".living-bunny, [data-route='bunnyGardenPath'], button[aria-label='bunny']").first();
    if (await bunny.count()) {
      const box = await bunny.boundingBox();
      if (box) {
        await page.screenshot({ path: join(OUT, "live-bunny-01-idle.png") });
        await bunny.click({ force: true });
        await page.waitForTimeout(180);
        await page.screenshot({ path: join(OUT, "live-bunny-02-crouch.png") });
        await page.waitForTimeout(220);
        await page.screenshot({ path: join(OUT, "live-bunny-03-air.png") });
        await page.waitForTimeout(280);
        await page.screenshot({ path: join(OUT, "live-bunny-04-land.png") });
      }
    }
    await context.close();
  }

  // Live frog + counting accumulate through four
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await seed(page);
    await stubTts(page);
    await page.goto(`${BASE}/?review=counting&frogs=4`, { waitUntil: "networkidle", timeout: 90000 });

    // Wait for four-frog EN then ES sequence (stubbed TTS; hops ~800ms each)
    await page.waitForTimeout(500);
    const frames = [];
    for (let i = 1; i <= 14; i++) {
      await page.waitForTimeout(700);
      const path = join(OUT, `counting-seq-${String(i).padStart(2, "0")}.png`);
      await page.screenshot({ path, fullPage: false });
      const count = await page.locator(".pond-frog.is-landed, .pond-frog.is-hopping").count();
      frames.push({ i, path, visibleFrogs: count });
      console.log("counting frame", i, "frogs", count);
    }

    const liveLog = await page.evaluate(() => window.__countLog || []);
    await page.screenshot({
      path: join(OUT, "05-counting-pond--during-sequence-landscape-1440x900.png"),
      fullPage: false,
    });

    // Also refresh main counting screenshot after frogs landed
    await page.waitForTimeout(800);
    await page.screenshot({
      path: join(OUT, "05-counting-pond--landscape-1440x900.png"),
      fullPage: false,
    });

    // Frog live on map
    await page.goto(`${BASE}/?review=hub`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(600);
    const frog = page.locator(".living-frog, [data-route='frogLilyPads'], button[aria-label='frog']").first();
    if (await frog.count()) {
      await page.screenshot({ path: join(OUT, "live-frog-01-rest.png") });
      await frog.click({ force: true });
      await page.waitForTimeout(200);
      await page.screenshot({ path: join(OUT, "live-frog-02-hop.png") });
      await page.waitForTimeout(350);
      await page.screenshot({ path: join(OUT, "live-frog-03-land-ripple.png") });
    }

    // Find celebrate
    await page.goto(`${BASE}/?review=findFriend`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(700);
    const promptText = await page.locator(".meadow-prompt .painted-prompt-line").first().textContent();
    await page.screenshot({ path: join(OUT, "live-find-01-choices.png") });
    const animals = page.locator(".meadow-animal");
    const nAnimals = await animals.count();
    if (nAnimals !== 3) notes.defects.push(`find-live: expected 3 got ${nAnimals}`);
    for (let i = 0; i < nAnimals; i++) {
      await animals.nth(i).click({ force: true });
      await page.waitForTimeout(500);
      if (await page.locator(".meadow-animal.is-celebrate").count()) {
        await page.screenshot({ path: join(OUT, "live-find-02-celebrate.png") });
        break;
      }
    }

    // Color bloom
    await page.goto(`${BASE}/?review=colors`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT, "live-color-01-choices.png") });
    const colors = page.locator(".env-color-choice");
    for (let i = 0; i < (await colors.count()); i++) {
      await colors.nth(i).click({ force: true });
      await page.waitForTimeout(400);
      if (await page.locator(".env-color-choice.is-bloom").count()) {
        await page.screenshot({ path: join(OUT, "live-color-02-bloom.png") });
        break;
      }
    }

    await writeFile(
      join(OUT, "COUNTING-SEQUENCE-LOG.json"),
      JSON.stringify(
        {
          liveSpeechFromRunningApp: liveLog,
          frames,
          liveTexts: liveLog.map((e) => e.text),
          reachesFour: liveLog.some((e) => e.text === "Four") && liveLog.some((e) => e.text === "Cuatro"),
          findPrompt: promptText,
          reviewForceFrogs: 4,
        },
        null,
        2,
      ),
    );

    await context.close();
  }

  notes.placeholders = [
    "Sounds/Feed/Shapes/Care/FreePlay/Music deferred",
    "Color env choices are CSS-painted pots/cans/beds/boots tinted by target color (not unique WebP props yet)",
    "Counting answer pads are CSS lily disks with painted digits (integrated in pond layer, not white buttons)",
  ];

  await writeFile(
    join(OUT, "REVIEW-NOTES.json"),
    JSON.stringify(
      {
        ...notes,
        knownVisualDefects: notes.defects,
        hotspotDebug: false,
        stoppedFor: "visual approval",
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}

console.log("Phase 3 FIX pack →", OUT);
