import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHOICE_SLOTS,
  detectAspect,
  HUB_LANDMARKS,
  HUB_ZONES,
  LAYOUT,
  MIN_TOUCH_CSS_PX,
  toPx,
} from "../app/phaser-poc/game/layouts.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("phaser POC layouts use intentional landscape and portrait sizes", () => {
  assert.deepEqual(LAYOUT.landscape, { w: 1440, h: 900 });
  assert.deepEqual(LAYOUT.portrait, { w: 390, h: 844 });
  assert.equal(detectAspect(1440, 900), "landscape");
  assert.equal(detectAspect(390, 844), "portrait");
});

test("choice slots are exactly three normalized feet anchors", () => {
  assert.equal(CHOICE_SLOTS.landscape.length, 3);
  assert.equal(CHOICE_SLOTS.portrait.length, 3);
  const p = toPx(CHOICE_SLOTS.landscape[1], 1440, 900);
  assert.equal(p.x, 720);
  assert.ok(MIN_TOUCH_CSS_PX >= 96);
});

test("hub uses four natural zones — not nine sticker landmarks", () => {
  assert.equal(HUB_ZONES.landscape.length, 4);
  assert.equal(HUB_ZONES.portrait.length, 4);
  for (const z of HUB_ZONES.landscape) {
    assert.ok(z.hit.w > 0.1 && z.hit.h > 0.1);
    assert.ok(z.activities.length >= 2 && z.activities.length <= 3);
  }
  assert.ok(HUB_LANDMARKS.landscape.length >= 3);
});

test("phaser POC isolated entry and scene types exist", () => {
  assert.equal(existsSync(join(root, "app/phaser-poc/page.tsx")), true);
  assert.equal(existsSync(join(root, "app/phaser-poc/PhaserGame.tsx")), true);
  assert.equal(existsSync(join(root, "app/phaser-poc/game/main.ts")), true);
  for (const f of [
    "ChoiceScene.ts",
    "DragScene.ts",
    "ExploreScene.ts",
    "GardenHubScene.ts",
    "FindFriendScene.ts",
    "ColorGardenScene.ts",
    "FeedFriendsScene.ts",
    "FreePlayScene.ts",
  ]) {
    assert.equal(existsSync(join(root, "app/phaser-poc/game/scenes", f)), true, f);
  }
});

test("phaser POC does not import emoji or big-choice website cards", () => {
  const files = [
    "app/phaser-poc/page.tsx",
    "app/phaser-poc/game/scenes/FindFriendScene.ts",
    "app/phaser-poc/game/scenes/ColorGardenScene.ts",
    "app/phaser-poc/game/scenes/FeedFriendsScene.ts",
    "app/phaser-poc/game/scenes/FreePlayScene.ts",
    "app/phaser-poc/game/scenes/GardenHubScene.ts",
  ];
  for (const f of files) {
    const src = readFileSync(join(root, f), "utf8");
    assert.doesNotMatch(src, /big-choice|FOOD_EMOJI|🧒|🥕|emoji/i);
  }
});

test("phaser POC asset manifest lists every preload path", async () => {
  const { HUB_SHARED_ASSETS, ACTIVITY_ASSETS, resolveStartScene } = await import(
    "../app/phaser-poc/game/assetManifest.ts"
  );
  assert.ok(HUB_SHARED_ASSETS.length >= 20);
  assert.ok(HUB_SHARED_ASSETS.every((a) => a.key && a.path.startsWith("/art/")));
  assert.ok(ACTIVITY_ASSETS.FindFriend?.length >= 1);
  assert.ok(ACTIVITY_ASSETS.ColorGarden?.length >= 3);
  assert.ok(ACTIVITY_ASSETS.FeedFriends?.length >= 1);
  assert.equal(resolveStartScene("findFriend"), "FindFriend");
  assert.equal(resolveStartScene("colors"), "ColorGarden");
  assert.equal(resolveStartScene("colorGarden"), "ColorGarden");
  assert.equal(resolveStartScene("feed"), "FeedFriends");
  assert.equal(resolveStartScene("freePlay"), "FreePlay");
  assert.equal(resolveStartScene("hub"), "GardenHub");
  assert.equal(resolveStartScene(null), "GardenHub");
});

test("Color Garden hub activity routes into ColorGarden scene", () => {
  for (const aspect of ["landscape", "portrait"]) {
    const cottage = HUB_ZONES[aspect].find((z) => z.id === "cottage");
    assert.ok(cottage);
    const colors = cottage.activities.find((a) => a.id === "colors");
    assert.equal(colors?.scene, "ColorGarden");
  }
});

test("progress storage key remains unchanged for POC shell", () => {
  const core = readFileSync(join(root, "app/data/progressCore.mjs"), "utf8");
  assert.match(core, /aria-color-garden-progress/);
});

test("preload starts review scene from registry — no React race", () => {
  const preload = readFileSync(join(root, "app/phaser-poc/game/scenes/BootPreload.ts"), "utf8");
  const page = readFileSync(join(root, "app/phaser-poc/page.tsx"), "utf8");
  assert.match(preload, /pocStartScene/);
  assert.match(preload, /showRetry/);
  assert.doesNotMatch(page, /scene\.start\(map/);
});
