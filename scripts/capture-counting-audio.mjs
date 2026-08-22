/**
 * Focused Counting Pond speech + sequence frame capture.
 * Stubs speechSynthesis so speak resolves immediately while logging every utterance.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const OUT = "docs/review/v5/phase3-production";
const BASE = process.env.REVIEW_URL || "http://127.0.0.1:5173";
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
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Server not ready: " + url);
}

const SPEECH_STUB = `
(() => {
  window.__countLog = [];
  window.__frameEvents = [];
  window.__speakResolveMode = "stub";
  const proto = window.speechSynthesis;
  proto.speak = function patchedSpeak(u) {
    const text = (u && u.text) || "";
    window.__countLog.push({ t: Date.now(), type: "speak", text, lang: (u && u.lang) || "" });
    window.__frameEvents.push({ t: Date.now(), kind: "speak", text });
    queueMicrotask(() => {
      try { if (typeof u.onstart === "function") u.onstart(new Event("start")); } catch (e) {}
      try { if (typeof u.onend === "function") u.onend(new Event("end")); } catch (e) {}
    });
  };
  const origCancel = proto.cancel.bind(proto);
  proto.cancel = function patchedCancel() {
    try { return origCancel(); } catch (e) { return undefined; }
  };
})();
`;

async function frogCount(page) {
  return page.evaluate(() => document.querySelectorAll(".lily-slot").length);
}

async function detectUiLayout(page) {
  return page.evaluate(() => {
    const root = document.querySelector(".counting-v4");
    const pond = document.querySelector(".pond-stage");
    const creamHints = !!document.querySelector(".big-choice, .activity-card, .cream-card");
    const paintedScene = !!document.querySelector(
      ".pond-stage .scene-bg, .pond-stage canvas, .pond-stage img"
    );
    return {
      hasCountingV4: !!root,
      hasPondStage: !!pond,
      hasNumberLilies: !!document.querySelector(".number-lilies"),
      creamHints,
      paintedScene,
      likelyFullBleedPainted: !!root && !!pond && paintedScene,
      likelyOldCardCream: creamHints && !paintedScene,
      rootClass: root ? root.className : null,
      notes: [
        root ? "counting-v4 present" : "missing counting-v4",
        pond ? "pond-stage present" : "missing pond-stage",
      ],
    };
  });
}

async function clickCorrectDigit(page) {
  const n = await frogCount(page);
  if (!n) return false;
  return page.evaluate((digit) => {
    const buttons = [...document.querySelectorAll(".number-lily")];
    const match = buttons.find((b) => {
      const d = b.querySelector(".digit");
      return d && d.textContent.trim() === String(digit);
    });
    if (!match || match.disabled) return false;
    match.click();
    return true;
  }, n);
}

async function waitForSpeakIdle(page, quietMs = 600, maxMs = 15000) {
  const start = Date.now();
  let lastLen = -1;
  let quietSince = Date.now();
  while (Date.now() - start < maxMs) {
    const len = await page.evaluate(() => (window.__countLog || []).length);
    if (len !== lastLen) {
      lastLen = len;
      quietSince = Date.now();
    } else if (Date.now() - quietSince >= quietMs) {
      return;
    }
    await page.waitForTimeout(100);
  }
}

const browser = await chromium.launch({ headless: true });
const frameFiles = [];
const frames = [];

try {
  console.log("Waiting for", BASE);
  await waitForServer(BASE);
  console.log("Server ready");

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.addInitScript(
    ({ key, friends, stub }) => {
      localStorage.setItem(key, JSON.stringify(friends));
      eval(stub);
    },
    { key: FRIENDS_KEY, friends: ALL_FRIENDS, stub: SPEECH_STUB },
  );

  await page.goto(BASE + "/?review=counting", { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);

  const uiLayout = await detectUiLayout(page);
  console.log("UI layout:", JSON.stringify(uiLayout));

  await waitForSpeakIdle(page, 800, 20000);
  const firstRoundTexts = await page.evaluate(() => (window.__countLog || []).map((e) => e.text));
  const firstFrogCount = await frogCount(page);
  console.log("First-round frogs:", firstFrogCount, "texts:", firstRoundTexts);

  let frameIdx = 0;
  const takeFrame = async (label) => {
    frameIdx += 1;
    const name = "counting-seq-" + String(frameIdx).padStart(2, "0") + ".png";
    const path = join(OUT, name);
    await page.screenshot({ path, fullPage: false });
    const fc = await frogCount(page);
    const lastSpeak = await page.evaluate(() => {
      const log = window.__countLog || [];
      return log.length ? log[log.length - 1].text : null;
    });
    const ev = { frame: frameIdx, file: name, label, frogCount: fc, lastSpeak, t: Date.now() };
    frames.push(ev);
    frameFiles.push(name);
    await page.evaluate((e) => {
      window.__frameEvents = window.__frameEvents || [];
      window.__frameEvents.push(Object.assign({ kind: "screenshot" }, e));
    }, ev);
    console.log("frame", name, label, "frogs=", fc);
  };

  await takeFrame("after-first-sequence");

  for (let attempt = 0; attempt < 8 && (await frogCount(page)) < 4; attempt++) {
    await waitForSpeakIdle(page, 500, 12000);
    await page
      .waitForFunction(() => {
        const btns = [...document.querySelectorAll(".number-lily")];
        return btns.length > 0 && btns.every((b) => !b.disabled);
      }, { timeout: 20000 })
      .catch(() => null);

    await takeFrame("pre-pick-round-" + attempt);
    const ok = await clickCorrectDigit(page);
    console.log("clicked correct?", ok);
    await page.waitForTimeout(1200);
    await waitForSpeakIdle(page, 600, 15000);
    await takeFrame("post-pick-round-" + attempt);
  }

  const frogsNow = await frogCount(page);
  let fourRoundTexts = [];
  if (frogsNow >= 4) {
    await page.evaluate(() => {
      window.__countLog = [];
    });
    const replayed = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("button, [role=button]")];
      const r = nodes.find((b) =>
        /replay|again|hear|listen/i.test(
          (b.getAttribute("aria-label") || "") + " " + (b.title || "") + " " + (b.textContent || ""),
        ),
      );
      if (r) {
        r.click();
        return true;
      }
      return false;
    });
    console.log("replay clicked?", replayed, "frogs", frogsNow);

    const burstStart = Date.now();
    while (Date.now() - burstStart < 12000 && frameIdx < 12) {
      await takeFrame("during-four-count");
      await page.waitForTimeout(1500);
      const texts = await page.evaluate(() => (window.__countLog || []).map((e) => e.text));
      if (texts.includes("How many frogs?") || texts.includes("¿Cuántas ranas?")) break;
    }
    await waitForSpeakIdle(page, 800, 20000);
    fourRoundTexts = await page.evaluate(() => (window.__countLog || []).map((e) => e.text));
  }

  while (frameIdx < 8) {
    await takeFrame("ensure-min-08");
    await page.waitForTimeout(400);
  }

  const liveLog = await page.evaluate(() => window.__countLog || []);
  const frameEvents = await page.evaluate(() => window.__frameEvents || []);
  const liveTexts = fourRoundTexts.length ? fourRoundTexts : firstRoundTexts;

  const rootCause = {
    summary:
      "First CountingPond round always uses pool = NUMBERS.filter(n => n.value <= 3) and target = pool[round % pool.length] with round=0, so value is 1. runCountSequence speaks only One then Uno, then askHowMany. Four/Cuatro appear only when stars>=2 (full NUMBERS) and round % 5 === 3.",
    codePath: [
      "CountingPond.tsx: pool = stars < 2 ? NUMBERS.filter(value<=3) : NUMBERS",
      "CountingPond.tsx: target = pool[round % pool.length]",
      "SequenceController.runCountSequence: speak 0..count-1 EN then ES",
      "AudioDirector.createSpeakOne -> speechSynthesis.speak",
    ],
    firstRoundFrogCount: firstFrogCount,
    fourRoundFrogCount: frogsNow,
  };

  const log = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE,
    uiLayout,
    rootCause,
    liveSpeechFromRunningApp: liveLog,
    firstRoundLiveTexts: firstRoundTexts,
    fourRoundLiveTexts: fourRoundTexts,
    liveTexts,
    frameEventLog: frames,
    rawFrameEvents: frameEvents,
    countingSeqFrames: frameFiles,
    verdict: {
      fourAppears: liveTexts.includes("Four"),
      cuatroAppears: liveTexts.includes("Cuatro"),
      firstRoundOnlyOneUnoAsk:
        firstRoundTexts.length >= 2 &&
        firstRoundTexts[0] === "One" &&
        firstRoundTexts.includes("Uno") &&
        firstRoundTexts.some((t) => /how many frogs/i.test(t)),
      liveTexts,
    },
  };

  await writeFile(join(OUT, "COUNTING-SEQUENCE-LOG.json"), JSON.stringify(log, null, 2));
  console.log("Wrote", join(OUT, "COUNTING-SEQUENCE-LOG.json"));
  console.log("liveTexts:", JSON.stringify(liveTexts));
  console.log("Four?", liveTexts.includes("Four"), "Cuatro?", liveTexts.includes("Cuatro"));
  console.log("frames:", frameFiles.join(", "));

  const portraitScreens = [
    { query: "welcome", file: "01-welcome--portrait-390x844.png" },
    { query: "hub", file: "02-garden-map--portrait-390x844.png" },
    { query: "findFriend", file: "03-find-friend--portrait-390x844.png" },
    { query: "colors", file: "04-color-garden--portrait-390x844.png" },
    { query: "counting", file: "05-counting-pond--portrait-390x844.png" },
  ];
  const missing = portraitScreens.filter((s) => !existsSync(join(OUT, s.file)));
  if (missing.length) {
    console.log("Capturing missing portraits:", missing.map((m) => m.file).join(", "));
    const pctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const pp = await pctx.newPage();
    await pp.addInitScript(
      ({ key, friends }) => {
        localStorage.setItem(key, JSON.stringify(friends));
      },
      { key: FRIENDS_KEY, friends: ALL_FRIENDS },
    );
    for (const s of missing) {
      await pp.goto(BASE + "/?review=" + s.query, { waitUntil: "networkidle", timeout: 90000 });
      await pp.waitForTimeout(1000);
      await pp.screenshot({ path: join(OUT, s.file), fullPage: false });
      console.log("portrait", s.file);
    }
    await pctx.close();
  } else {
    console.log("All portrait screens already present");
  }

  await context.close();
} finally {
  await browser.close();
}

console.log("Done.");
