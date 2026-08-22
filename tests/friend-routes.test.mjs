import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "app/game/friendRoutes.ts"), "utf8");

test("friend routes declare all eight named paths", () => {
  for (const id of [
    "bunnyGardenPath",
    "frogLilyPads",
    "butterflyFlowerLoop",
    "birdBranchRoute",
    "ladybugLeafPath",
    "beeFlowerRoute",
    "catCottageArea",
    "puppyMeadowArea",
  ]) {
    assert.match(src, new RegExp(id));
  }
  assert.match(src, /landscape:/);
  assert.match(src, /portrait:/);
});

test("living bunny and frog components exist", () => {
  assert.equal(readFileSync(join(root, "app/components/LivingBunny.tsx"), "utf8").includes("bunnyGardenPath"), true);
  assert.equal(readFileSync(join(root, "app/components/LivingFrog.tsx"), "utf8").includes("frogLilyPads"), true);
});
