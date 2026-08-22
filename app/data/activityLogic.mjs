/** Pure helpers for toddler activity logic + bilingual prompt filtering. */

export const GARDEN_CAST = [
  "butterfly",
  "bunny",
  "bird",
  "ladybug",
  "bee",
  "frog",
  "cat",
  "puppy",
];

export const FOOD_BY_ANIMAL = {
  butterfly: "flower",
  bunny: "carrot",
  bird: "seeds",
  ladybug: "leaf",
  bee: "flower",
  frog: "fly",
  cat: "fish",
  puppy: "bone",
};

/** Build spoken parts for parent language mode without overlapping languages. */
export function bilingualParts(en, es, mode = "both") {
  const parts = [];
  if (mode !== "es" && en?.trim()) parts.push({ text: en.trim(), lang: "en" });
  if (mode !== "en" && es?.trim()) parts.push({ text: es.trim(), lang: "es" });
  if (!parts.length && en?.trim()) parts.push({ text: en.trim(), lang: "en" });
  if (!parts.length && es?.trim()) parts.push({ text: es.trim(), lang: "es" });
  return parts;
}

export function findFriendPrompt(enName, esName) {
  return {
    en: `Find the ${enName.toLowerCase()}.`,
    es: `Encuentra el ${esName.toLowerCase()}.`,
  };
}

export function isCorrectFeed(animalId, foodKind) {
  return FOOD_BY_ANIMAL[animalId] === foodKind;
}

export function isCorrectChoice(pickedId, targetId) {
  return pickedId === targetId;
}

/** Max three toddler choices; always include the target. */
export function buildChoices(roster, targetId, count = 3) {
  const pool = roster.filter((id) => id !== targetId);
  const others = [];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const id of pool) {
    if (others.length >= count - 1) break;
    others.push(id);
  }
  const choices = [targetId, ...others].slice(0, count);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/**
 * Missing recorded voice: never throw — return false so TTS can run.
 * Mirrors the app's tryPlayRecording catch behavior.
 */
export async function playRecordingOrFallback(playFn) {
  try {
    const ok = await playFn();
    return Boolean(ok);
  } catch {
    return false;
  }
}
