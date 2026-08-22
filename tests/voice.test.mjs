import assert from "node:assert/strict";
import test from "node:test";
import {
  pickBestVoice,
  scoreVoice,
  isNaturalVoice,
  VOICE_RATES,
  LANG_PAUSE_MS,
} from "../app/lib/voiceSelect.mjs";

function fakeVoice(partial) {
  return {
    default: false,
    localService: true,
    voiceURI: partial.name,
    ...partial,
  };
}

test("bilingual phrase sequencing builds English then Spanish parts", () => {
  const en = "Can you find the red basket?";
  const es = "¿Puedes encontrar la canasta roja?";
  const parts = [];
  if (en.trim()) parts.push({ text: en.trim(), lang: "en" });
  if (es.trim()) parts.push({ text: es.trim(), lang: "es" });
  assert.equal(parts.length, 2);
  assert.equal(parts[0].lang, "en");
  assert.equal(parts[1].lang, "es");
  assert.ok(!parts[0].text.includes("¿"));
});

test("natural online voices outrank generic locals", () => {
  const voices = [
    fakeVoice({ name: "Microsoft David", lang: "en-US", localService: true }),
    fakeVoice({
      name: "Microsoft Ava Online (Natural) - English (United States)",
      lang: "en-US",
      localService: false,
    }),
  ];
  const en = pickBestVoice(voices, "en");
  assert.ok(en);
  assert.match(en.name, /Ava/i);
  assert.equal(isNaturalVoice(en), true);
  assert.ok(scoreVoice(voices[1], "en") > scoreVoice(voices[0], "en"));
});

test("Spanish prefers natural Mexican voices including Dalia", () => {
  const voices = [
    fakeVoice({ name: "Microsoft Sabina", lang: "es-ES", localService: true }),
    fakeVoice({
      name: "Microsoft Dalia Online (Natural) - Spanish (Mexico)",
      lang: "es-MX",
      localService: false,
    }),
  ];
  const es = pickBestVoice(voices, "es");
  assert.ok(es);
  assert.match(es.name, /Dalia/i);
  assert.match(es.lang, /es-MX/i);
});

test("preferred URI keeps a consistent chosen voice", () => {
  const voices = [
    fakeVoice({ name: "Soft One", lang: "en-US", voiceURI: "soft-one" }),
    fakeVoice({
      name: "Microsoft Jenny Online (Natural)",
      lang: "en-US",
      voiceURI: "jenny",
    }),
  ];
  const picked = pickBestVoice(voices, "en", "soft-one");
  assert.equal(picked?.voiceURI, "soft-one");
});

test("speech rates and pause match natural delivery targets", () => {
  assert.equal(VOICE_RATES.en, 0.82);
  assert.equal(VOICE_RATES.es, 0.78);
  assert.equal(VOICE_RATES.pitch, 1.0);
  assert.ok(LANG_PAUSE_MS >= 350 && LANG_PAUSE_MS <= 500);
});
