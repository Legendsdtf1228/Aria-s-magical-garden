/** Natural-voice scoring for Web Speech API (shared by app + tests). */

const WARM_EN = [
  "ava",
  "jenny",
  "aria",
  "ana",
  "emma",
  "michelle",
  "sonia",
  "sara",
  "zira",
  "samantha",
  "karen",
  "moira",
  "tessa",
  "fiona",
  "susan",
  "hazel",
];
const WARM_ES = [
  "dalia",
  "sabina",
  "elena",
  "ximena",
  "paulina",
  "lucia",
  "sofia",
  "renata",
  "larissa",
];

/** Prefer natural Mexican Spanish male voices when female natural is unavailable. */
const OK_ES_MALE_NATURAL = ["jorge"];

const ROBOTIC =
  /compact|mobile|eloquence|whisper|novelty|bahh|boing|bubbles|cellos|bad news|good news|derby|pipes|trinoids|zarvox/i;

function normalizeLang(lang) {
  return String(lang || "")
    .toLowerCase()
    .replace("_", "-");
}

/**
 * Higher score = better natural preschool-friendly voice.
 * Returns -1 if language does not match.
 */
export function scoreVoice(v, want) {
  const name = String(v.name || "");
  const nameL = name.toLowerCase();
  const lang = normalizeLang(v.lang);
  const exact = want === "en" ? "en-us" : "es-mx";
  const base = want === "en" ? "en" : "es";

  if (!lang.startsWith(base)) return -1;
  if (ROBOTIC.test(nameL)) return 0;

  let score = 5;

  // 2) Natural / Online / Neural (highest browser-voice priority)
  if (/\bnatural\b/.test(nameL)) score += 120;
  if (/\bonline\b/.test(nameL)) score += 100;
  if (/\bneural\b/.test(nameL)) score += 100;
  if (/premium|enhanced|multilingual/.test(nameL)) score += 40;

  // 3) Microsoft voices
  if (/microsoft/.test(nameL)) score += 55;

  // 4) Exact locale
  if (lang === exact) score += 45;
  else if (want === "es" && (lang === "es-us" || lang === "es-419")) score += 30;
  else if (lang.startsWith(base)) score += 15;

  // Warm / preschool-friendly identifiable names
  const warm = want === "en" ? WARM_EN : WARM_ES;
  warm.forEach((n, i) => {
    if (nameL.includes(n)) score += 28 - Math.min(i, 12);
  });

  if (/female|mujer|woman|girl/.test(nameL)) score += 22;

  // Spanish: allow known natural male voices (e.g. Jorge Online Natural)
  if (want === "es" && OK_ES_MALE_NATURAL.some((n) => nameL.includes(n))) {
    if (/\b(natural|online|neural)\b/.test(nameL)) score += 70;
  } else if (want === "en" && /\b(male|david|mark|guy|ryan|christopher|eric|andrew)\b/.test(nameL)) {
    score -= 35;
  }

  // Prefer non-local cloud/natural when tagged online; slight bump for local only if nothing else
  if (v.localService && !/\b(online|natural|neural)\b/.test(nameL)) score -= 8;

  // Default voice is last-resort-ish
  if (v.default && score < 40) score += 2;

  return score;
}

export function isNaturalVoice(v) {
  if (!v) return false;
  const nameL = String(v.name || "").toLowerCase();
  return /\b(natural|online|neural)\b/.test(nameL);
}

export function pickBestVoice(voices, want, preferredURI) {
  if (preferredURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredURI);
    if (preferred) {
      const lang = normalizeLang(preferred.lang);
      const base = want === "en" ? "en" : "es";
      if (lang.startsWith(base)) return preferred;
    }
  }
  let best = null;
  let bestScore = -1;
  for (const v of voices) {
    const s = scoreVoice(v, want);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return bestScore >= 0 ? best : null;
}

export const VOICE_RATES = {
  en: 0.82,
  es: 0.78,
  pitch: 1.0,
};

/** Pause between English and Spanish (ms). */
export const LANG_PAUSE_MS = 420;
