import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PROGRESS,
  PROGRESS_STORAGE_KEY,
  loadProgress,
  markActivityComplete,
  normalizeProgress,
  saveProgress,
  unlockSurprise,
} from "../app/data/progressCore.mjs";
import {
  FOOD_BY_ANIMAL,
  GARDEN_CAST,
  bilingualParts,
  buildChoices,
  findFriendPrompt,
  isCorrectChoice,
  isCorrectFeed,
  playRecordingOrFallback,
} from "../app/data/activityLogic.mjs";

test("normalizeProgress migrates incomplete / legacy shapes safely", () => {
  assert.deepEqual(normalizeProgress(null), {
    version: 1,
    completedActivities: [],
    surprises: [],
  });
  const migrated = normalizeProgress({
    version: "old",
    completedActivities: ["feed", "feed", 7, "findFriend"],
    surprises: ["rainbow", "rainbow", null],
  });
  assert.equal(migrated.version, 1);
  assert.deepEqual(migrated.completedActivities, ["feed", "findFriend"]);
  assert.deepEqual(migrated.surprises, ["rainbow"]);
});

test("progress save/load keeps completed activities and surprises", () => {
  const memory = new Map();
  const setItem = (k, v) => memory.set(k, v);
  const getItem = (k) => memory.get(k) ?? null;

  let progress = { ...DEFAULT_PROGRESS, completedActivities: [], surprises: [] };
  progress = markActivityComplete(progress, "gardenCare");
  progress = unlockSurprise(progress, "rainbow");
  saveProgress(progress, setItem);

  assert.equal(memory.has(PROGRESS_STORAGE_KEY), true);
  const loaded = loadProgress(getItem);
  assert.deepEqual(loaded.completedActivities, ["gardenCare"]);
  assert.deepEqual(loaded.surprises, ["rainbow"]);
});

test("friends collection key is never used by progress storage", () => {
  assert.notEqual(PROGRESS_STORAGE_KEY, "aria-color-garden-friends");
});

test("find-friend bilingual prompt names both languages", () => {
  const p = findFriendPrompt("Bunny", "Conejito");
  assert.match(p.en, /bunny/i);
  assert.match(p.es, /conejito/i);
});

test("feed logic accepts only matching food for each garden animal", () => {
  assert.equal(isCorrectFeed("bunny", "carrot"), true);
  assert.equal(isCorrectFeed("bunny", "bone"), false);
  assert.equal(isCorrectFeed("puppy", FOOD_BY_ANIMAL.puppy), true);
  assert.equal(GARDEN_CAST.length, 8);
});

test("choice rounds stay at most three and always include the target", () => {
  for (let i = 0; i < 20; i++) {
    const target = GARDEN_CAST[i % GARDEN_CAST.length];
    const choices = buildChoices(GARDEN_CAST, target, 3);
    assert.ok(choices.length <= 3);
    assert.ok(choices.includes(target));
    assert.equal(isCorrectChoice(target, target), true);
    const wrong = GARDEN_CAST.find((id) => id !== target);
    assert.equal(isCorrectChoice(wrong, target), false);
  }
});

test("language mode filters bilingual parts without overlapping speech", () => {
  assert.deepEqual(bilingualParts("Hello", "Hola", "both").map((p) => p.lang), ["en", "es"]);
  assert.deepEqual(bilingualParts("Hello", "Hola", "en").map((p) => p.lang), ["en"]);
  assert.deepEqual(bilingualParts("Hello", "Hola", "es").map((p) => p.lang), ["es"]);
  assert.equal(bilingualParts("", "Hola", "en")[0].lang, "es");
});

test("missing audio recording falls back without throwing", async () => {
  const ok = await playRecordingOrFallback(async () => {
    throw new Error("404 missing voice file");
  });
  assert.equal(ok, false);

  const played = await playRecordingOrFallback(async () => true);
  assert.equal(played, true);
});
