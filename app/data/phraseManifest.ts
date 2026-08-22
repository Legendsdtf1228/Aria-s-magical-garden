/**
 * Typed phrase manifest for optional recorded natural voices.
 * Files live under:
 *   public/audio/voice/en-US/
 *   public/audio/voice/es-MX/
 *
 * Missing files are OK — the game falls back to the best browser voice.
 */

export type PhraseId = keyof typeof PHRASE_MANIFEST;

export type PhraseEntry = {
  /** Friendly label for VOICE-RECORDING-LIST.md */
  label: string;
  /** Spoken English script (also TTS fallback) */
  enText: string;
  /** Spoken Spanish script (also TTS fallback) */
  esText: string;
  en: string;
  es: string;
};

const en = (file: string) => `/audio/voice/en-US/${file}`;
const es = (file: string) => `/audio/voice/es-MX/${file}`;

export const PHRASE_MANIFEST = {
  welcome: {
    label: "Welcome",
    enText: "Welcome to the color garden!",
    esText: "¡Bienvenida al jardín de colores!",
    en: en("welcome.mp3"),
    es: es("welcome.mp3"),
  },
  tryAgain: {
    label: "Gentle retry",
    enText: "Let's try another one.",
    esText: "Intentemos otra vez.",
    en: en("try-again.mp3"),
    es: es("try-again.mp3"),
  },
  greatJob: {
    label: "Great job",
    enText: "Great job!",
    esText: "¡Muy bien!",
    en: en("great-job.mp3"),
    es: es("great-job.mp3"),
  },
  playAgain: {
    label: "Play again",
    enText: "Want to play again?",
    esText: "¿Quieres jugar otra vez?",
    en: en("play-again.mp3"),
    es: es("play-again.mp3"),
  },
  newFriend: {
    label: "New garden friend",
    enText: "You found a new friend!",
    esText: "¡Encontraste un nuevo amigo!",
    en: en("new-friend.mp3"),
    es: es("new-friend.mp3"),
  },
  caughtFriend: {
    label: "Caught floating friend",
    enText: "You caught a friend!",
    esText: "¡Atrapaste un amigo!",
    en: en("caught-friend.mp3"),
    es: es("caught-friend.mp3"),
  },
  findColor: {
    label: "Find a color (generic)",
    enText: "Can you find the matching basket?",
    esText: "¿Puedes encontrar la canasta correcta?",
    en: en("find-color.mp3"),
    es: es("find-color.mp3"),
  },
  findRed: {
    label: "Find red",
    enText: "Can you find the red basket?",
    esText: "¿Puedes encontrar la canasta roja?",
    en: en("find-red.mp3"),
    es: es("find-red.mp3"),
  },
  findBlue: {
    label: "Find blue",
    enText: "Can you find the blue basket?",
    esText: "¿Puedes encontrar la canasta azul?",
    en: en("find-blue.mp3"),
    es: es("find-blue.mp3"),
  },
  findYellow: {
    label: "Find yellow",
    enText: "Can you find the yellow basket?",
    esText: "¿Puedes encontrar la canasta amarilla?",
    en: en("find-yellow.mp3"),
    es: es("find-yellow.mp3"),
  },
  findGreen: {
    label: "Find green",
    enText: "Can you find the green basket?",
    esText: "¿Puedes encontrar la canasta verde?",
    en: en("find-green.mp3"),
    es: es("find-green.mp3"),
  },
  findPurple: {
    label: "Find purple",
    enText: "Can you find the purple basket?",
    esText: "¿Puedes encontrar la canasta morada?",
    en: en("find-purple.mp3"),
    es: es("find-purple.mp3"),
  },
  findOrange: {
    label: "Find orange",
    enText: "Can you find the orange basket?",
    esText: "¿Puedes encontrar la canasta anaranjada?",
    en: en("find-orange.mp3"),
    es: es("find-orange.mp3"),
  },
  findPink: {
    label: "Find pink",
    enText: "Can you find the pink basket?",
    esText: "¿Puedes encontrar la canasta rosa?",
    en: en("find-pink.mp3"),
    es: es("find-pink.mp3"),
  },
  findBrown: {
    label: "Find brown",
    enText: "Can you find the brown basket?",
    esText: "¿Puedes encontrar la canasta café?",
    en: en("find-brown.mp3"),
    es: es("find-brown.mp3"),
  },
  findBlack: {
    label: "Find black",
    enText: "Can you find the black basket?",
    esText: "¿Puedes encontrar la canasta negra?",
    en: en("find-black.mp3"),
    es: es("find-black.mp3"),
  },
  findWhite: {
    label: "Find white",
    enText: "Can you find the white basket?",
    esText: "¿Puedes encontrar la canasta blanca?",
    en: en("find-white.mp3"),
    es: es("find-white.mp3"),
  },
  findAnimal: {
    label: "Find an animal (generic)",
    enText: "Can you find the animal?",
    esText: "¿Puedes encontrar el animal?",
    en: en("find-animal.mp3"),
    es: es("find-animal.mp3"),
  },
  findShape: {
    label: "Find a shape (generic)",
    enText: "Can you find the matching shape?",
    esText: "¿Puedes encontrar la forma correcta?",
    en: en("find-shape.mp3"),
    es: es("find-shape.mp3"),
  },
  howMany: {
    label: "How many?",
    enText: "How many do you see?",
    esText: "¿Cuántas ves?",
    en: en("how-many.mp3"),
    es: es("how-many.mp3"),
  },
  feedFriend: {
    label: "Feed a friend",
    enText: "What should we feed our friend?",
    esText: "¿Qué le damos de comer a nuestro amigo?",
    en: en("feed-friend.mp3"),
    es: es("feed-friend.mp3"),
  },
  movement: {
    label: "Movement prompt",
    enText: "Let's move together!",
    esText: "¡Vamos a movernos juntos!",
    en: en("movement.mp3"),
    es: es("movement.mp3"),
  },
  previewEnglish: {
    label: "Parent English preview",
    enText: "Hi there! This is the English garden voice.",
    esText: "",
    en: en("preview-english.mp3"),
    es: es("preview-english.mp3"),
  },
  previewSpanish: {
    label: "Parent Spanish preview",
    enText: "",
    esText: "¡Hola! Esta es la voz del jardín en español.",
    en: en("preview-spanish.mp3"),
    es: es("preview-spanish.mp3"),
  },
} as const satisfies Record<string, PhraseEntry>;

export function getPhrase(id: PhraseId): PhraseEntry {
  return PHRASE_MANIFEST[id];
}

/** Resolve audio URL for a phrase key + language. */
export function recordingUrl(phraseKey: string, lang: "en" | "es"): string | null {
  const entry = (PHRASE_MANIFEST as Record<string, PhraseEntry>)[phraseKey];
  if (!entry) return null;
  return lang === "en" ? entry.en : entry.es;
}

/** Common instructions to preload after first user tap. */
export const PRELOAD_PHRASE_IDS: PhraseId[] = [
  "welcome",
  "tryAgain",
  "greatJob",
  "playAgain",
  "findColor",
  "findAnimal",
  "howMany",
  "feedFriend",
  "movement",
];
