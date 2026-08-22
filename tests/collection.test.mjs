import assert from "node:assert/strict";
import test from "node:test";
import {
  addFriend,
  normalizeCollected,
  nextUnownedFriend,
  rewardForCorrect,
  saveCollectedToStorage,
  loadCollectedFromStorage,
  FRIENDS_STORAGE_KEY,
} from "../app/data/collectionCore.mjs";

test("normalizeCollected ignores invalid ids and duplicates", () => {
  const cleaned = normalizeCollected([
    "butterfly",
    "butterfly",
    "not-real",
    42,
    "puppy",
    null,
  ]);
  assert.deepEqual(cleaned, ["butterfly", "puppy"]);
});

test("nextUnownedFriend returns first missing friend in roster order", () => {
  assert.equal(nextUnownedFriend([]), "butterfly");
  assert.equal(nextUnownedFriend(["butterfly", "bunny"]), "bird");
  assert.equal(
    nextUnownedFriend([
      "butterfly",
      "bunny",
      "bird",
      "ladybug",
      "bee",
      "frog",
      "cat",
      "puppy",
    ]),
    null,
  );
});

test("addFriend never creates duplicates", () => {
  const once = addFriend([], "cat");
  const twice = addFriend(once, "cat");
  assert.deepEqual(once, ["cat"]);
  assert.deepEqual(twice, ["cat"]);
});

test("rewardForCorrect awards next friend then sparkles when full", () => {
  const first = rewardForCorrect([]);
  assert.equal(first.kind, "friend");
  if (first.kind === "friend") assert.equal(first.id, "butterfly");

  const full = [
    "butterfly",
    "bunny",
    "bird",
    "ladybug",
    "bee",
    "frog",
    "cat",
    "puppy",
  ];
  const sparkle = rewardForCorrect(full);
  assert.equal(sparkle.kind, "sparkle");
  assert.ok(sparkle.emoji);
});

test("play again style persistence: save then load keeps collection", () => {
  const memory = new Map();
  const setItem = (k, v) => memory.set(k, v);
  const getItem = (k) => memory.get(k) ?? null;

  saveCollectedToStorage(["bee", "frog", "bee"], setItem);
  assert.equal(memory.get(FRIENDS_STORAGE_KEY), JSON.stringify(["bee", "frog"]));

  const loaded = loadCollectedFromStorage(getItem);
  assert.deepEqual(loaded, ["bee", "frog"]);

  const afterPlayAgain = loadCollectedFromStorage(getItem);
  assert.deepEqual(afterPlayAgain, ["bee", "frog"]);
});

test("parent reset clears collection storage", () => {
  const memory = new Map();
  saveCollectedToStorage(["puppy", "cat"], (k, v) => memory.set(k, v));
  saveCollectedToStorage([], (k, v) => memory.set(k, v));
  const loaded = loadCollectedFromStorage((k) => memory.get(k) ?? null);
  assert.deepEqual(loaded, []);
});
