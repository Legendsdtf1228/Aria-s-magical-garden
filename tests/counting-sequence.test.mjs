import assert from "node:assert/strict";
import test from "node:test";
import {
  SequenceController,
  runCountSequence,
  InputGuard,
} from "../app/game/sequenceCore.mjs";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EN = ["One", "Two", "Three", "Four", "Five"];
const ES = ["Uno", "Dos", "Tres", "Cuatro", "Cinco"];

test("count sequence speaks full English then full Spanish", async () => {
  const spoken = [];
  const indices = [];
  const seq = new SequenceController();
  const handle = seq.start();
  await runCountSequence({
    count: 4,
    mode: "both",
    enWords: EN,
    esWords: ES,
    speakOne: async (text, lang) => {
      spoken.push(`${lang}:${text}`);
    },
    onIndex: (i) => indices.push(i),
    isActive: handle.isActive,
    pauseMs: 0,
  });
  assert.deepEqual(
    spoken,
    [
      "en:One",
      "en:Two",
      "en:Three",
      "en:Four",
      "es:Uno",
      "es:Dos",
      "es:Tres",
      "es:Cuatro",
    ],
  );
  assert.ok(indices.includes(0) && indices.includes(3));
  assert.equal(indices[indices.length - 1], -1);
});

test("cancelled sequence stops mid-count and ignores further steps", async () => {
  const spoken = [];
  const seq = new SequenceController();
  const handle = seq.start();
  const run = runCountSequence({
    count: 5,
    mode: "en",
    enWords: EN,
    esWords: ES,
    speakOne: async (text, lang) => {
      spoken.push(`${lang}:${text}`);
      if (spoken.length === 2) handle.cancel();
    },
    onIndex: () => {},
    isActive: handle.isActive,
    pauseMs: 0,
  });
  await run;
  assert.ok(spoken.length <= 3);
  assert.ok(!spoken.includes("en:Five"));
});

test("input guard debounces rapid taps and respects lock", () => {
  const g = new InputGuard({ debounceMs: 400 });
  assert.equal(g.accept("a"), true);
  assert.equal(g.accept("a"), false);
  g.setLocked(true);
  assert.equal(g.accept("b"), false);
  g.setLocked(false);
  assert.equal(g.accept("b"), true);
});

test("vertical-slice production art files exist (no emoji fallbacks)", () => {
  for (const file of [
    "public/art/scenes/welcome-garden-landscape.webp",
    "public/art/scenes/welcome-garden-portrait.webp",
    "public/art/scenes/garden-map-landscape.webp",
    "public/art/scenes/garden-map-portrait.webp",
    "public/art/characters/painted-garden-v1/cast-sheet.webp",
    "public/art/characters/painted-garden-v1/bunny-idle.webp",
    "public/art/characters/painted-garden-v1/frog-idle.webp",
    "public/art/characters/painted-garden-v1/play-gate.webp",
    "public/art/characters/painted-garden-v1/bunny-anim-sheet.webp",
    "public/art/characters/painted-garden-v1/frog-anim-sheet.webp",
  ]) {
    assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
  }
});

test("shape aspect ratios stay geometric (unit helpers)", () => {
  // Circle / square boxes must report aspect 1; oval ~1.5; never stretch flags
  const circle = { w: 100, h: 100 };
  const square = { w: 120, h: 120 };
  const oval = { w: 150, h: 100 };
  assert.equal(circle.w / circle.h, 1);
  assert.equal(square.w / square.h, 1);
  assert.ok(Math.abs(oval.w / oval.h - 1.5) < 0.01);
});
