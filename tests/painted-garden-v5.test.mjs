import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("painted-garden-v1 is the only production character set", () => {
  const assets = read("app/game/assets.ts");
  assert.match(assets, /CHARACTER_SET_VERSION = "painted-garden-v1"/);
  assert.doesNotMatch(assets, /CHARACTER_SET_VERSION = "cast-v/);
  assert.doesNotMatch(assets, /CHARACTER_SET_VERSION = "storybook/);
});

test("ActivityShell never mounts SVG LivingFriends or FloatingFriends", () => {
  const shell = read("app/components/ActivityShell.tsx");
  assert.doesNotMatch(shell, /import \{[^}]*LivingFriends/);
  assert.doesNotMatch(shell, /import \{[^}]*FloatingFriends/);
  assert.doesNotMatch(shell, /<LivingFriends|<FloatingFriends|<GardenAnimal/);
  assert.match(shell, /GardenScene/);
});

test("GardenScene never renders flat hills or emoji bugs", () => {
  const scene = read("app/components/GardenScene.tsx");
  assert.doesNotMatch(scene, /hill-back|hill-mid|hill-front|drift-bug|🦋|🐝|🌼/);
  assert.match(scene, /painted-scene/);
});

test("GardenAnimal stub cannot render SVG paths", () => {
  const ga = read("app/components/GardenAnimal.tsx");
  assert.doesNotMatch(ga, /<svg|path d=/i);
  assert.match(ga, /CharacterSprite|characterArtId/);
});

test("ColorGarden no longer renders color-buddy or emoji bloom", () => {
  const color = read("app/activities/ColorGarden.tsx");
  assert.doesNotMatch(color, /color-buddy|bloom-burst|🌸|✨/);
  assert.match(color, /painted-color-object|painted-prompt-sign/);
});

test("FindMyFriend uses painted choices without white animal-btn cards", () => {
  const find = read("app/activities/FindMyFriend.tsx");
  assert.doesNotMatch(find, /className=\{`animal-btn|className="animal-btn/);
  assert.doesNotMatch(find, /from ["'].*GardenAnimal["']/);
  assert.match(find, /painted-choice-animal/);
  assert.match(find, /CharacterSprite/);
});

test("production painted-garden-v1 idle sprites exist for full cast", () => {
  for (const id of ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"]) {
    const p = join(root, "public/art/characters/painted-garden-v1", `${id}-idle.webp`);
    assert.equal(existsSync(p), true, `missing ${id}`);
  }
});

test("forbidden legacy CSS markers are not used by ActivityShell path", () => {
  const shell = read("app/components/ActivityShell.tsx");
  for (const marker of ["lg-hills", "welcome-play-flower", "big-choice", "color-buddy"]) {
    assert.doesNotMatch(shell, new RegExp(marker));
  }
});

test("PWA cache is v5", () => {
  assert.match(read("public/sw.js"), /aria-garden-pwa-v5/);
});
