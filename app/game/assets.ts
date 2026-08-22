/** Painted Garden V5 character & scene registry. Never fall back to SVG/emoji/cast-v*. */

export const CHARACTER_SET_VERSION = "painted-garden-v1" as const;

export type SceneId =
  | "welcome-garden-landscape"
  | "welcome-garden-portrait"
  | "garden-map-landscape"
  | "garden-map-portrait"
  | "counting-pond";

export type FriendSpriteId =
  | "butterfly"
  | "bunny"
  | "bird"
  | "ladybug"
  | "bee"
  | "frog"
  | "cat"
  | "puppy";

export type CharacterArtId = `${FriendSpriteId}-idle`;

export const SCENE_ART: Record<SceneId, { src: string; alt: string; creaturesAllowed: false }> = {
  "welcome-garden-landscape": {
    src: "/art/scenes/welcome-garden-landscape.webp",
    alt: "Empty garden environment",
    creaturesAllowed: false,
  },
  "welcome-garden-portrait": {
    src: "/art/scenes/welcome-garden-portrait.webp",
    alt: "Empty garden environment for phones",
    creaturesAllowed: false,
  },
  "garden-map-landscape": {
    src: "/art/scenes/garden-map-landscape.webp",
    alt: "Empty garden map environment",
    creaturesAllowed: false,
  },
  "garden-map-portrait": {
    src: "/art/scenes/garden-map-portrait.webp",
    alt: "Empty garden map environment for phones",
    creaturesAllowed: false,
  },
  "counting-pond": {
    src: "/art/scenes/counting-pond.webp",
    alt: "Garden pond environment",
    creaturesAllowed: false,
  },
};

const sprite = (id: FriendSpriteId, alt: string) =>
  ({
    src: `/art/characters/painted-garden-v1/${id}-idle.webp`,
    alt,
    characterSetVersion: CHARACTER_SET_VERSION,
  }) as const;

export const CHARACTER_ART: Record<
  CharacterArtId,
  { src: string; alt: string; characterSetVersion: typeof CHARACTER_SET_VERSION }
> = {
  "butterfly-idle": sprite("butterfly", "Butterfly"),
  "bunny-idle": sprite("bunny", "Bunny"),
  "bird-idle": sprite("bird", "Bird"),
  "ladybug-idle": sprite("ladybug", "Ladybug"),
  "bee-idle": sprite("bee", "Bee"),
  "frog-idle": sprite("frog", "Frog"),
  "cat-idle": sprite("cat", "Cat"),
  "puppy-idle": sprite("puppy", "Puppy"),
};

export const BUNNY_ANIM_SHEET = "/art/characters/painted-garden-v1/bunny-anim-sheet.webp";
export const FROG_ANIM_SHEET = "/art/characters/painted-garden-v1/frog-anim-sheet.webp";
export const PLAY_GATE_ART = "/art/characters/painted-garden-v1/play-gate.webp";
export const CAST_SHEET = {
  src: "/art/characters/painted-garden-v1/cast-sheet.webp",
  characterSetVersion: CHARACTER_SET_VERSION,
};

export function characterArtId(friendId: string): CharacterArtId {
  return `${friendId}-idle` as CharacterArtId;
}

export function assertCharacterSet(
  art: { characterSetVersion?: string } | null | undefined,
  context: string,
) {
  if (!art) {
    throw new Error(
      `[AriaGarden] Missing painted-garden-v1 sprite in ${context}. No SVG/emoji/cast-v* fallback.`,
    );
  }
  if (art.characterSetVersion !== CHARACTER_SET_VERSION) {
    throw new Error(
      `[AriaGarden] Character set mismatch in ${context}: got ${art.characterSetVersion}, expected ${CHARACTER_SET_VERSION}`,
    );
  }
}

export function isDevMissingArt() {
  return import.meta.env?.DEV === true;
}

/** Forbidden legacy markers for regression tests / runtime guards */
export const FORBIDDEN_VISUAL_MARKERS = [
  "hill-back",
  "hill-mid",
  "hill-front",
  "GardenAnimal",
  "FloatingFriends",
  "LivingFriends",
  "welcome-play-flower",
  "big-choice",
  "color-buddy",
  "cast-v1",
  "cast-v2",
  "lg-hills",
] as const;
