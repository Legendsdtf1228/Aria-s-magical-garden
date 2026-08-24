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
  assert.match(shell, /PortraitSafeChrome/);
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

test("ColorGarden uses dedicated flower patch and env choices, not CSS tiles or map mural", () => {
  const color = read("app/activities/ColorGarden.tsx");
  const shell = read("app/components/ActivityShell.tsx");
  assert.doesNotMatch(color, /color-buddy|bloom-burst|🌸|✨/);
  assert.doesNotMatch(color, /painted-color-object/);
  assert.match(color, /env-color-choice/);
  assert.match(color, /color-flower-patch/);
  assert.match(color, /env-prop-img|flower-pot\.webp/);
  assert.match(shell, /color-flower-patch-landscape/);
  assert.match(shell, /colors:\s*\{[\s\S]*?color-flower-patch-landscape/);
});

test("FindMyFriend uses animal meadow with exactly three choices wiring", () => {
  const find = read("app/activities/FindMyFriend.tsx");
  const shell = read("app/components/ActivityShell.tsx");
  assert.doesNotMatch(find, /className=\{`animal-btn|className="animal-btn/);
  assert.doesNotMatch(find, /from ["'].*GardenAnimal["']/);
  assert.match(find, /meadow-animal/);
  assert.match(find, /slice\(0, 3\)/);
  assert.match(find, /CharacterSprite/);
  assert.match(shell, /animal-meadow-landscape/);
});

test("CountingPond is full-bleed with accumulating frogs and numbered lily pads", () => {
  const counting = read("app/activities/CountingPond.tsx");
  assert.match(counting, /counting-pond-bleed/);
  assert.match(counting, /pond-answer-pad/);
  assert.match(counting, /hopFrogOntoPad/);
  assert.match(counting, /runCountSequence/);
  assert.doesNotMatch(counting, /SpokenPrompt/);
  assert.doesNotMatch(counting, /number-lily/);
});

test("dedicated Phase 3 scenes exist on disk", () => {
  for (const name of [
    "animal-meadow-landscape.webp",
    "animal-meadow-portrait.webp",
    "color-flower-patch-landscape.webp",
    "color-flower-patch-portrait.webp",
    "counting-pond-landscape.webp",
    "counting-pond-portrait.webp",
  ]) {
    assert.equal(existsSync(join(root, "public/art/scenes", name)), true, `missing ${name}`);
  }
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

test("puppy route stays on dry cottage grass, not pond", () => {
  const routes = read("app/game/friendRoutes.ts");
  assert.match(routes, /cottage-porch-grass/);
  assert.doesNotMatch(routes, /puppyMeadowArea:[\s\S]{0,120}grassy-clearing/);
});

test("PWA cache is v5", () => {
  assert.match(read("public/sw.js"), /aria-garden-pwa-v6/);
  assert.match(read("public/sw.js"), /LEGACY_CACHE_PREFIXES/);
  assert.match(read("public/sw.js"), /aria-garden-pwa-v5/);
});
