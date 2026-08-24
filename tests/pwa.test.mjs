import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("web app manifest is valid JSON with required PWA fields", () => {
  const raw = readFileSync(join(root, "public/manifest.webmanifest"), "utf8");
  const manifest = JSON.parse(raw);
  assert.equal(manifest.name, "Aria's Color Garden");
  assert.equal(manifest.short_name, "Aria's Garden");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "portrait-primary");
  assert.equal(manifest.theme_color, "#7ec86a");
  assert.equal(manifest.background_color, "#bfe9f8");
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.some((i) => i.sizes === "192x192"));
  assert.ok(manifest.icons.some((i) => i.sizes === "512x512"));
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
});

test("required PWA icon files exist", () => {
  for (const file of [
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/icon-maskable-512.png",
    "public/icons/apple-touch-180.png",
    "public/sw.js",
    "public/offline.html",
  ]) {
    assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
  }
});

test("service worker avoids caching secrets and node_modules", () => {
  const sw = readFileSync(join(root, "public/sw.js"), "utf8");
  assert.match(sw, /node_modules/);
  assert.match(sw, /aria-garden-pwa-/);
  assert.match(sw, /offline\.html/);
  assert.match(sw, /SKIP_WAITING/);
  assert.doesNotMatch(sw, /localStorage\.clear/);
});

test("service worker caches shell assets and bumps cache version", () => {
  const sw = readFileSync(join(root, "public/sw.js"), "utf8");
  assert.match(sw, /aria-garden-pwa-v6/);
  assert.match(sw, /LEGACY_CACHE_PREFIXES/);
  assert.match(sw, /aria-garden-pwa-v5/);
  assert.match(sw, /\/art\//);
  assert.match(sw, /\/manifest\.webmanifest/);
  assert.match(sw, /\/icons\/icon-192\.png/);
  assert.match(sw, /isVoiceOrAudio/);
  assert.match(sw, /audio/);
});
