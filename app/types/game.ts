export type Screen =
  | "welcome"
  | "hub"
  | "activity"
  | "garden"
  | "settings";

export type ActivityId =
  | "colors"
  | "animals"
  | "shapes"
  | "counting"
  | "feed"
  | "music"
  | "findFriend"
  | "animalSounds"
  | "gardenCare"
  | "freePlay";

export type FriendId =
  | "butterfly"
  | "bunny"
  | "bird"
  | "ladybug"
  | "bee"
  | "frog"
  | "cat"
  | "puppy";

export type Friend = {
  id: FriendId;
  en: string;
  es: string;
  emoji: string;
};

export type Bilingual = { en: string; es: string };

export type ColorItem = Bilingual & {
  id: string;
  hex: string;
  dark: string;
  emoji: string;
};

export type AnimalItem = Bilingual & {
  id: string;
  emoji: string;
  sound: "bark" | "meow" | "chirp" | "ribbit" | "moo" | "quack" | "neigh" | "baa";
};

export type ShapeItem = Bilingual & {
  id: string;
  kind: "circle" | "square" | "triangle" | "star" | "heart" | "oval";
  gardenEmoji: string;
};

export type NumberItem = Bilingual & {
  id: string;
  value: number;
  digit: string;
};

export type FeedPair = {
  id: string;
  animal: Bilingual & { emoji: string };
  food: Bilingual & { emoji: string };
};

export type MovementItem = Bilingual & {
  id: string;
  emoji: string;
  cue: "clap" | "stomp" | "spin" | "jump" | "wiggle" | "freeze";
};

export type LanguageMode = "en" | "es" | "both";

export type ParentSettings = {
  speechOn: boolean;
  musicOn: boolean;
  speechVolume: number;
  musicVolume: number;
  enVoiceURI: string | null;
  esVoiceURI: string | null;
  languageMode: LanguageMode;
};

export type GardenProgress = {
  version: number;
  completedActivities: ActivityId[];
  surprises: string[];
};

export const FRIENDS_STORAGE_KEY = "aria-color-garden-friends";
export const SETTINGS_STORAGE_KEY = "aria-color-garden-settings";
export const PROGRESS_STORAGE_KEY = "aria-color-garden-progress";
