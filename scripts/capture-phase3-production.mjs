/**
 * Phase 3 production screenshot capture from the running app.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { runCountSequence, SequenceController } from "../app/game/sequenceCore.mjs";

const OUT = "docs/review/v5/phase3-production";
const BASE = process.env.REVIEW_URL || "http://127.0.0.1:5173";

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

const FRIENDS_KEY = "aria-color-garden-friends";
const ALL_FRIENDS = ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"];

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

async function countingSequenceCoreLog() {
  const ordered = [];
  const controller = new SequenceController();
  const handle = controller.start();
  await runCountSequence({
    count: 4,
    mode: "both",
    enWords: ["One", "Two", "Three", "Four", "Five"],
    esWords: ["Uno", "Dos", "Tres", "Cuatro", "Cinco"],
    speakOne: async (word, lang) => {
      ordered.push({ event: "spoken", lang, text: word });
    },
    onIndex: (i) => {
      if (i >= 0) ordered.push({ event: "visual", frogIndex: i + 1 });
      else ordered.push({ event: "ask-ready" });
    },
    isActive: handle.isActive,
    pauseMs: 0,
  });
  const spokenEn = ordered.filter((e) => e.event === "spoken" && e.lang === "en").map((e) => e.text);
  const spokenEs = ordered.filter((e) => e.event === "spoken" && e.lang === "es").map((e) => e.text);
  return {
    ordered,
    spokenEn,
    spokenEs,
    reachesFour: spokenEn.includes("Four") && spokenEs.includes("Cuatro"),
    stopsAfterTwo: !spokenEn.includes("Three") || !spokenEn.includes("Four"),
  };
}

const browser = await chromium.launch({ headless: true });
const defects = [];
const placeholders = [];

async function auditPage(page, label) {
  const issues = await page.evaluate(() => {
    const out = [];
    if (document.querySelector(".hill-back, .hill-mid, .hill-front")) out.push("flat-hills");
    if (document.querySelector(".drift-bug")) out.push("emoji-bugs-in-sky");
    if (document.querySelector(".big-choice, .animal-btn, .color-buddy")) out.push("white-cards-or-color-buddy");
    if (document.querySelector(".garden-map-root.debug-hotspots")) out.push("debug-hotspots-enabled");
    if (document.querySelector("svg.garden-animal, .animal-svg")) out.push("svg-animal");
    return out;
  });
  for (const i of issues) defects.push(`${label}: ${i}`);
}

try {
  console.log("Waiting for", BASE);
  await waitForServer(BASE);
  console.log("Server ready");

  for (const vp of VIEWPORTS) {
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

    for (const screen of SCREENS) {
      const url = `${BASE}/?review=${screen.query}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => {
        try {
          window.speechSynthesis?.cancel();
        } catch {
          /* ignore */
        }
      });
      await page.waitForTimeout(500);
      const file = join(OUT, `${screen.file}--${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      await auditPage(page, `${screen.file}/${vp.name}`);
      console.log("captured", file);
    }
    await context.close();
  }

  await sharp("public/art/characters/painted-garden-v1/bunny-anim-sheet.webp")
    .png()
    .toFile(join(OUT, "strip-bunny-crouch-hop-land.png"));
  await sharp("public/art/characters/painted-garden-v1/frog-anim-sheet.webp")
    .png()
    .toFile(join(OUT, "strip-frog-rest-hop-ripple.png"));

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(
      ({ key, friends }) => {
        localStorage.setItem(key, JSON.stringify(friends));
        window.__countLog = [];
        const proto = window.speechSynthesis;
        const orig = proto.speak.bind(proto);
        proto.speak = (u) => {
          window.__countLog.push({ t: Date.now(), type: "speak", text: u?.text || "" });
          return orig(u);
        };
      },
      { key: FRIENDS_KEY, friends: ALL_FRIENDS },
    );
    await page.goto(`${BASE}/?review=counting`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(8000);
    const liveLog = await page.evaluate(() => window.__countLog || []);
    await page.screenshot({
      path: join(OUT, "05-counting-pond--during-sequence-landscape-1440x900.png"),
    });
    await context.close();

    const core = await countingSequenceCoreLog();
    await writeFile(
      join(OUT, "COUNTING-SEQUENCE-LOG.json"),
      JSON.stringify(
        {
          liveSpeechFromRunningApp: liveLog,
          sequenceCoreOrder: core,
          verdict: {
            coreReachesFour: core.reachesFour,
            coreWouldStopAfterTwo: core.stopsAfterTwo,
            liveTexts: liveLog.map((e) => e.text),
          },
        },
        null,
        2,
      ),
    );
  }

  for (const id of ALL_FRIENDS) {
    const p = `public/art/characters/painted-garden-v1/${id}-idle.webp`;
    if (!existsSync(p)) placeholders.push(`missing idle: ${id}`);
  }
  placeholders.push("Feed/Sounds/Shapes/Care/FreePlay/Music deferred (not in Phase 3 pack)");
  placeholders.push("Find/Color reuse garden-map-landscape env (no dedicated activity murals yet)");

  await writeFile(
    join(OUT, "REVIEW-NOTES.json"),
    JSON.stringify(
      {
        source: "Playwright screenshots of running Vite app (?review=) with real React components",
        viewports: VIEWPORTS,
        screens: SCREENS.map((s) => s.file),
        defectsFoundByAutomation: defects,
        placeholdersStillVisible: placeholders,
        knownVisualDefects: [
          "Welcome is layered empty-env + sprites (may differ from unified painted V4 baseline)",
          "Color choices are CSS painted objects, not unique illustrated WebP props",
          "Counting number answers are CSS lily buttons — confirm pad look in screenshots",
          "Human judgment required for cast style match vs approved bunny/frog",
        ],
        hotspotDebug: false,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}

console.log("Phase 3 production review pack →", OUT);
