/** Pure collection helpers shared by the app and Node tests (ESM). */

export const FRIEND_IDS = [
  "butterfly",
  "bunny",
  "bird",
  "ladybug",
  "bee",
  "frog",
  "cat",
  "puppy",
];

export const FRIENDS_STORAGE_KEY = "aria-color-garden-friends";

export const FRIEND_META = {
  butterfly: { en: "Butterfly", es: "Mariposa", emoji: "🦋" },
  bunny: { en: "Bunny", es: "Conejito", emoji: "🐰" },
  bird: { en: "Bird", es: "Pajarito", emoji: "🐦" },
  ladybug: { en: "Ladybug", es: "Mariquita", emoji: "🐞" },
  bee: { en: "Bee", es: "Abejita", emoji: "🐝" },
  frog: { en: "Frog", es: "Rana", emoji: "🐸" },
  cat: { en: "Cat", es: "Gatito", emoji: "🐱" },
  puppy: { en: "Puppy", es: "Perrito", emoji: "🐶" },
};

export function normalizeCollected(raw) {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(FRIEND_IDS);
  const out = [];
  for (const id of raw) {
    if (typeof id === "string" && valid.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function loadCollectedFromStorage(getItem = (k) => {
  if (typeof localStorage !== "undefined") return localStorage.getItem(k);
  return null;
}) {
  try {
    const raw = getItem(FRIENDS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCollected(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCollectedToStorage(ids, setItem = (k, v) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
}) {
  const clean = normalizeCollected(ids);
  try {
    setItem(FRIENDS_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
}

export function nextUnownedFriend(owned) {
  const set = new Set(owned);
  for (const id of FRIEND_IDS) {
    if (!set.has(id)) return id;
  }
  return null;
}

export function rewardForCorrect(owned) {
  const next = nextUnownedFriend(owned);
  if (next) {
    const f = FRIEND_META[next];
    return { kind: "friend", id: next, en: f.en, es: f.es, emoji: f.emoji };
  }
  const extras = [
    { en: "Friendship heart!", es: "¡Corazón de amistad!", emoji: "💖" },
    { en: "Garden sparkles!", es: "¡Brillos del jardín!", emoji: "✨" },
    { en: "Pretty flower!", es: "¡Flor bonita!", emoji: "🌸" },
  ];
  return { kind: "sparkle", ...extras[Math.floor(Math.random() * extras.length)] };
}

export function addFriend(owned, id) {
  if (owned.includes(id)) return owned;
  return normalizeCollected([...owned, id]);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickChoices(deck, target, count = 3) {
  const others = shuffle(deck.filter((x) => x.id !== target.id)).slice(0, count - 1);
  return shuffle([target, ...others]);
}
