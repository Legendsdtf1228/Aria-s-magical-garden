/** Painted Garden V5 character & scene registry. Never fall back to SVG/emoji/cast-v*. */

export const CHARACTER_SET_VERSION = "painted-garden-v1" as const;

export type SceneId =
  | "welcome-garden-landscape"
  | "welcome-garden-portrait"
  | "garden-map-landscape"
  | "garden-map-portrait"
  | "animal-meadow-landscape"
  | "animal-meadow-portrait"
  | "color-flower-patch-landscape"
  | "color-flower-patch-portrait"
  | "counting-pond-landscape"
  | "counting-pond-portrait"
  | "counting-pond"
  | "picnic-meadow-landscape"
  | "picnic-meadow-portrait"
  | "sound-grove-landscape"
  | "sound-grove-portrait"
  | "shape-meadow-landscape"
  | "shape-meadow-portrait"
  | "care-beds-landscape"
  | "care-beds-portrait"
  | "freeplay-path-landscape"
  | "freeplay-path-portrait"
  | "music-gazebo-landscape"
  | "music-gazebo-portrait"
  | "friends-yard-landscape"
  | "friends-yard-portrait";

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
  "animal-meadow-landscape": {
    src: "/art/scenes/animal-meadow-landscape.webp",
    alt: "Empty animal meadow",
    creaturesAllowed: false,
  },
  "animal-meadow-portrait": {
    src: "/art/scenes/animal-meadow-portrait.webp",
    alt: "Empty animal meadow for phones",
    creaturesAllowed: false,
  },
  "color-flower-patch-landscape": {
    src: "/art/scenes/color-flower-patch-landscape.webp",
    alt: "Empty color flower patch",
    creaturesAllowed: false,
  },
  "color-flower-patch-portrait": {
    src: "/art/scenes/color-flower-patch-portrait.webp",
    alt: "Empty color flower patch for phones",
    creaturesAllowed: false,
  },
  "counting-pond-landscape": {
    src: "/art/scenes/counting-pond-landscape.webp",
    alt: "Empty counting pond",
    creaturesAllowed: false,
  },
  "counting-pond-portrait": {
    src: "/art/scenes/counting-pond-portrait.webp",
    alt: "Empty counting pond for phones",
    creaturesAllowed: false,
  },
  "counting-pond": {
    src: "/art/scenes/counting-pond-landscape.webp",
    alt: "Garden pond environment",
    creaturesAllowed: false,
  },
  "picnic-meadow-landscape": {
    src: "/art/scenes/picnic-meadow-landscape.webp",
    alt: "Empty picnic meadow",
    creaturesAllowed: false,
  },
  "picnic-meadow-portrait": {
    src: "/art/scenes/picnic-meadow-portrait.webp",
    alt: "Empty picnic meadow for phones",
    creaturesAllowed: false,
  },
  "sound-grove-landscape": {
    src: "/art/scenes/sound-grove-landscape.webp",
    alt: "Empty sound grove",
    creaturesAllowed: false,
  },
  "sound-grove-portrait": {
    src: "/art/scenes/sound-grove-portrait.webp",
    alt: "Empty sound grove for phones",
    creaturesAllowed: false,
  },
  "shape-meadow-landscape": {
    src: "/art/scenes/shape-meadow-landscape.webp",
    alt: "Empty shape meadow",
    creaturesAllowed: false,
  },
  "shape-meadow-portrait": {
    src: "/art/scenes/shape-meadow-portrait.webp",
    alt: "Empty shape meadow for phones",
    creaturesAllowed: false,
  },
  "care-beds-landscape": {
    src: "/art/scenes/care-beds-landscape.webp",
    alt: "Empty garden care beds",
    creaturesAllowed: false,
  },
  "care-beds-portrait": {
    src: "/art/scenes/care-beds-portrait.webp",
    alt: "Empty garden care beds for phones",
    creaturesAllowed: false,
  },
  "freeplay-path-landscape": {
    src: "/art/scenes/freeplay-path-landscape.webp",
    alt: "Empty free-play garden path",
    creaturesAllowed: false,
  },
  "freeplay-path-portrait": {
    src: "/art/scenes/freeplay-path-portrait.webp",
    alt: "Empty free-play garden path for phones",
    creaturesAllowed: false,
  },
  "music-gazebo-landscape": {
    src: "/art/scenes/music-gazebo-landscape.webp",
    alt: "Empty music gazebo garden",
    creaturesAllowed: false,
  },
  "music-gazebo-portrait": {
    src: "/art/scenes/music-gazebo-portrait.webp",
    alt: "Empty music gazebo garden for phones",
    creaturesAllowed: false,
  },
  "friends-yard-landscape": {
    src: "/art/scenes/friends-yard-landscape.webp",
    alt: "Empty animal friends yard",
    creaturesAllowed: false,
  },
  "friends-yard-portrait": {
    src: "/art/scenes/friends-yard-portrait.webp",
    alt: "Empty animal friends yard for phones",
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

/** Per-color painted props — never recolor with washes. */
export const COLOR_PROP_ART: Record<string, string> = {
  red: "/art/objects/color-prop-red.webp",
  blue: "/art/objects/color-prop-blue.webp",
  yellow: "/art/objects/color-prop-yellow.webp",
  green: "/art/objects/color-prop-green.webp",
  purple: "/art/objects/color-prop-purple.webp",
  orange: "/art/objects/color-prop-orange.webp",
  pink: "/art/objects/color-prop-pink.webp",
  brown: "/art/objects/color-prop-brown.webp",
  black: "/art/objects/color-prop-black.webp",
  white: "/art/objects/color-prop-white.webp",
};

export const FOOD_PROP_ART: Record<string, string> = {
  carrot: "/art/objects/food-carrot.webp",
  bone: "/art/objects/food-bone.webp",
  fish: "/art/objects/food-fish.webp",
  seeds: "/art/objects/food-seeds.webp",
  fly: "/art/objects/food-fly.webp",
  flower: "/art/objects/food-flower.webp",
  berry: "/art/objects/food-berry.webp",
  leaf: "/art/objects/food-leaf.webp",
};

export const SHAPE_STONE_ART: Record<string, string> = {
  circle: "/art/objects/shape-circle.webp",
  square: "/art/objects/shape-square.webp",
  triangle: "/art/objects/shape-triangle.webp",
  star: "/art/objects/shape-star.webp",
  heart: "/art/objects/shape-heart.webp",
  oval: "/art/objects/shape-oval.webp",
};

export const CARE_TOOL_ART: Record<string, string> = {
  water: "/art/objects/tool-water.webp",
  sun: "/art/objects/tool-sun.webp",
  grow: "/art/objects/tool-grow.webp",
  visit: "/art/objects/tool-visit.webp",
};

export const MUSIC_CUE_ART: Record<string, string> = {
  clap: "/art/objects/music-clap.webp",
  stomp: "/art/objects/music-stomp.webp",
  spin: "/art/objects/music-spin.webp",
  jump: "/art/objects/music-jump.webp",
  wiggle: "/art/objects/music-wiggle.webp",
  freeze: "/art/objects/music-freeze.webp",
};

export const MAP_LANDMARK_ART: Record<string, string> = {
  colors: "/art/landmarks/landmark-colors.webp",
  feed: "/art/landmarks/landmark-feed.webp",
  findFriend: "/art/landmarks/landmark-findFriend.webp",
  animalSounds: "/art/landmarks/landmark-animalSounds.webp",
  gardenCare: "/art/landmarks/landmark-gardenCare.webp",
  freePlay: "/art/landmarks/landmark-freePlay.webp",
  shapes: "/art/landmarks/landmark-shapes.webp",
  counting: "/art/landmarks/landmark-counting.webp",
  music: "/art/landmarks/landmark-music.webp",
  animals: "/art/landmarks/landmark-animals.webp",
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
