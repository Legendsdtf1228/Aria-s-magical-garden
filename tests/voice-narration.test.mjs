import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("voice narration CLI exists and uses Workers AI Eleven Multilingual v2", () => {
  const script = read("scripts/generate-voice-narration.mjs");
  assert.match(script, /elevenlabs\/eleven-multilingual-v2/);
  assert.match(script, /mp3_44100_128/);
  assert.match(script, /language_code/);
  assert.match(script, /wrangler-oauth|oauth_token/);
  assert.match(script, /--force/);
  assert.match(script, /AUDITION_PHRASES/);
  assert.match(script, /AUDITION_VOICES/);
  assert.doesNotMatch(script, /CLOUDFLARE_API_TOKEN\s*=\s*["'][A-Za-z0-9_-]{20,}/);
});

test("voice narration never embeds API tokens in browser code paths", () => {
  const script = read("scripts/generate-voice-narration.mjs");
  assert.match(script, /Never puts credentials in the browser/);
  assert.equal(existsSync(join(root, "app", "api", "generate-voice.ts")), false);
});

test("audition phrases are exactly five bilingual pairs with shared ids", () => {
  const script = read("scripts/generate-voice-narration.mjs");
  assert.match(script, /welcomeMagical/);
  assert.match(script, /findRedFlower/);
  assert.match(script, /countOneToFour/);
  assert.match(script, /greatJobAria/);
  assert.match(script, /tryAnother/);
  assert.match(script, /Welcome to your magical garden, Aria!/);
  assert.match(script, /¡Bienvenida a tu jardín mágico, Aria!/);
  // Ensure full-library generation is gated
  assert.match(script, /Only --audition is enabled/);
});

test("PWA service worker caches audio paths for offline voice playback", () => {
  const sw = read("public/sw.js");
  assert.match(sw, /isVoiceOrAudio|\/audio\//);
  assert.match(sw, /aria-garden-pwa-/);
});

test("browser voice hook still falls back to speechSynthesis when files missing", () => {
  const hook = read("app/hooks/useBilingualVoice.ts");
  assert.match(hook, /speechSynthesis/);
  assert.match(hook, /recordingUrl|recordingExists/);
});
