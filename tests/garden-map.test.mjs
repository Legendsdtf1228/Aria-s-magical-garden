import assert from "node:assert/strict";
import test from "node:test";
import {
  GARDEN_LOCATION_IDS,
  FRIEND_HOME_IDS,
  clampMapScroll,
  nextMapScroll,
  isValidGardenLocation,
  transitionMs,
} from "../app/data/gardenMapCore.mjs";

test("garden map exposes all ten activity locations", () => {
  assert.equal(GARDEN_LOCATION_IDS.length, 10);
  for (const id of [
    "colors",
    "feed",
    "findFriend",
    "animalSounds",
    "gardenCare",
    "freePlay",
    "shapes",
    "counting",
    "music",
    "animals",
  ]) {
    assert.equal(isValidGardenLocation(id), true);
  }
  assert.equal(isValidGardenLocation("not-real"), false);
});

test("friend homes cover the full collectible cast", () => {
  assert.deepEqual(FRIEND_HOME_IDS.sort(), [
    "bee",
    "bird",
    "bunny",
    "butterfly",
    "cat",
    "frog",
    "ladybug",
    "puppy",
  ]);
});

test("map arrow pan clamps to garden edges", () => {
  assert.equal(clampMapScroll(-40, 800), 0);
  assert.equal(clampMapScroll(900, 800), 800);
  assert.equal(nextMapScroll(0, 800, "right", 280), 280);
  assert.equal(nextMapScroll(100, 800, "left", 280), 0);
  assert.equal(nextMapScroll(700, 800, "right", 280), 800);
});

test("scene transition is snappy and respects reduced motion", () => {
  assert.equal(transitionMs(true), 0);
  assert.ok(transitionMs(false) >= 350 && transitionMs(false) <= 500);
});
