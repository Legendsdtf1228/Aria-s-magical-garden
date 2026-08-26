/**
 * Phaser POC layout math — normalized scene coords (0–1).
 * Landscape reference 1440×900, portrait 390×844.
 */
export const LAYOUT = {
  landscape: { w: 1440, h: 900 },
  portrait: { w: 390, h: 844 },
} as const;

export type PocAspect = "landscape" | "portrait";

export type Norm = { x: number; y: number; scale?: number };

export type NormRect = { x: number; y: number; w: number; h: number };

export const UI_SAFE = {
  landscape: {
    topChrome: 0.12,
    bottomChrome: 0.06,
    promptY: 0.1,
  },
  portrait: {
    topChrome: 0.14,
    bottomChrome: 0.08,
    promptY: 0.12,
  },
} as const;

/** Three toddler choice slots — feet anchors (Find Friend meadow). */
export const CHOICE_SLOTS: Record<PocAspect, [Norm, Norm, Norm]> = {
  landscape: [
    { x: 0.22, y: 0.8, scale: 1 },
    { x: 0.5, y: 0.84, scale: 1 },
    { x: 0.78, y: 0.8, scale: 1 },
  ],
  portrait: [
    { x: 0.22, y: 0.74, scale: 1 },
    { x: 0.5, y: 0.78, scale: 1 },
    { x: 0.78, y: 0.74, scale: 1 },
  ],
};

/**
 * Color Garden — feet anchors in the center of each front soil bed
 * (left / center / right). Calibrated to cover-mode mural at 1440×900 / 390×844.
 */
export const COLOR_BED_SLOTS: Record<PocAspect, [Norm, Norm, Norm]> = {
  landscape: [
    { x: 0.2, y: 0.855, scale: 1 },
    { x: 0.5, y: 0.875, scale: 1 },
    { x: 0.8, y: 0.855, scale: 1 },
  ],
  portrait: [
    { x: 0.28, y: 0.62, scale: 1 },
    { x: 0.72, y: 0.62, scale: 1 },
    { x: 0.5, y: 0.84, scale: 1 },
  ],
};

/** Color Garden visible prop size targets (px at live canvas). */
export const COLOR_CHOICE_SIZE = {
  landscape: { min: 170, target: 200, max: 220, touch: 140 },
  portrait: { min: 120, target: 145, max: 160, touch: 110 },
} as const;

export const CHAR_HEIGHT_FRAC = 0.2;
export const PROP_HEIGHT_FRAC = 0.14;
export const LANDMARK_HEIGHT_FRAC = 0.2;
/** Phone / tablet minimum touch target. */
export const MIN_TOUCH_CSS_PX = 96;
/** Desktop open-zone activity props should read at least this tall. */
export const MIN_ACTIVITY_PROP_PX = 110;

export function detectAspect(width: number, height: number): PocAspect {
  return height > width * 1.05 ? "portrait" : "landscape";
}

export function toPx(norm: Norm, w: number, h: number) {
  return { x: norm.x * w, y: norm.y * h, scale: norm.scale ?? 1 };
}

export type HubActivity = {
  id: string;
  en: string;
  es: string;
  scene: string | null;
  /** Anchor for default single-prop activities. */
  pos: Norm;
  heightFrac: number;
};

export type HubZone = {
  id: "cottage" | "pond" | "gazebo" | "picnic";
  en: string;
  es: string;
  hit: NormRect;
  activities: HubActivity[];
};

/** Numbered lily pads — inside pond water, clear of frog pad. */
export const COUNTING_PADS: Record<PocAspect, { num: 1 | 2 | 3; pos: Norm }[]> = {
  landscape: [
    { num: 1, pos: { x: 0.58, y: 0.655 } },
    { num: 2, pos: { x: 0.66, y: 0.64 } },
    { num: 3, pos: { x: 0.74, y: 0.66 } },
  ],
  portrait: [
    { num: 1, pos: { x: 0.70, y: 0.73 } },
    { num: 2, pos: { x: 0.82, y: 0.715 } },
    { num: 3, pos: { x: 0.90, y: 0.69 } },
  ],
};

/** Four transparent shapes on the grassy bank beside the pond (not on bridge). */
export const SHAPE_PROPS: Record<PocAspect, { key: string; pos: Norm }[]> = {
  landscape: [
    { key: "prop-shape-triangle", pos: { x: 0.34, y: 0.9 } },
    { key: "prop-shape-circle", pos: { x: 0.4, y: 0.905 } },
    { key: "prop-shape-square", pos: { x: 0.46, y: 0.9 } },
    { key: "prop-shape-star", pos: { x: 0.52, y: 0.905 } },
  ],
  portrait: [
    { key: "prop-shape-triangle", pos: { x: 0.42, y: 0.795 } },
    { key: "prop-shape-circle", pos: { x: 0.52, y: 0.80 } },
    { key: "prop-shape-square", pos: { x: 0.62, y: 0.795 } },
    { key: "prop-shape-star", pos: { x: 0.72, y: 0.80 } },
  ],
};

/** Gazebo — separate chimes + instruments with spacing. */
export const GAZEBO_PROPS: Record<
  PocAspect,
  { chimes: Norm; drum: Norm; harp: Norm; xylophone: Norm; heightFrac: number }
> = {
  landscape: {
    chimes: { x: 0.82, y: 0.4 },
    drum: { x: 0.79, y: 0.54 },
    harp: { x: 0.86, y: 0.52 },
    xylophone: { x: 0.915, y: 0.545 },
    heightFrac: 0.085,
  },
  portrait: {
    chimes: { x: 0.80, y: 0.26 },
    drum: { x: 0.72, y: 0.345 },
    harp: { x: 0.81, y: 0.335 },
    xylophone: { x: 0.89, y: 0.35 },
    heightFrac: 0.06,
  },
};

/** Cottage porch — four individual transparent pots. */
export const COTTAGE_POTS: Record<PocAspect, { key: string; pos: Norm }[]> = {
  landscape: [
    { key: "prop-pot-red", pos: { x: 0.102, y: 0.644 } },
    { key: "prop-pot-blue", pos: { x: 0.118, y: 0.644 } },
    { key: "prop-pot-yellow", pos: { x: 0.134, y: 0.644 } },
    { key: "prop-pot-purple", pos: { x: 0.15, y: 0.644 } },
  ],
  portrait: [
    { key: "prop-pot-red", pos: { x: 0.12, y: 0.575 } },
    { key: "prop-pot-blue", pos: { x: 0.18, y: 0.575 } },
    { key: "prop-pot-yellow", pos: { x: 0.24, y: 0.575 } },
    { key: "prop-pot-purple", pos: { x: 0.3, y: 0.575 } },
  ],
};

/**
 * Four natural garden zones — idle hub shows hit areas only (no broken prop previews).
 */
export const HUB_ZONES: Record<PocAspect, HubZone[]> = {
  landscape: [
    {
      id: "cottage",
      en: "Cottage garden",
      es: "Jardín de la casita",
      hit: { x: 0.02, y: 0.42, w: 0.34, h: 0.52 },
      activities: [
        {
          id: "colors",
          en: "Color Garden",
          es: "Jardín de Colores",
          scene: "ColorGarden",
          pos: { x: 0.118, y: 0.644 },
          heightFrac: 0.1,
        },
        {
          id: "findFriend",
          en: "Find My Friend",
          es: "Busca a Mi Amigo",
          scene: "FindFriend",
          pos: { x: 0.22, y: 0.66 },
          heightFrac: 0.12,
        },
        {
          id: "gardenCare",
          en: "Garden Care",
          es: "Cuidar el Jardín",
          scene: null,
          pos: { x: 0.095, y: 0.89 },
          heightFrac: 0.1,
        },
      ],
    },
    {
      id: "pond",
      en: "Pond",
      es: "Estanque",
      hit: { x: 0.36, y: 0.48, w: 0.34, h: 0.36 },
      activities: [
        {
          id: "counting",
          en: "Counting Pond",
          es: "Estanque de Contar",
          scene: null,
          pos: { x: 0.62, y: 0.66 },
          heightFrac: 0.075,
        },
        {
          id: "shapes",
          en: "Shapes",
          es: "Formas",
          scene: null,
          pos: { x: 0.45, y: 0.888 },
          heightFrac: 0.09,
        },
      ],
    },
    {
      id: "gazebo",
      en: "Gazebo",
      es: "Glorieta",
      hit: { x: 0.7, y: 0.28, w: 0.28, h: 0.42 },
      activities: [
        {
          id: "animalSounds",
          en: "Animal Sounds",
          es: "Sonidos de Animales",
          scene: null,
          pos: { x: 0.82, y: 0.44 },
          heightFrac: 0.1,
        },
        {
          id: "music",
          en: "Music",
          es: "Música",
          scene: null,
          pos: { x: 0.86, y: 0.52 },
          heightFrac: 0.1,
        },
      ],
    },
    {
      id: "picnic",
      en: "Picnic meadow",
      es: "Prado del picnic",
      hit: { x: 0.62, y: 0.72, w: 0.36, h: 0.26 },
      activities: [
        {
          id: "feed",
          en: "Feed Friends",
          es: "Alimenta a los Amigos",
          scene: "FeedFriends",
          pos: { x: 0.9, y: 0.9 },
          heightFrac: 0.12,
        },
        {
          id: "freePlay",
          en: "Free Play",
          es: "Jardín Libre",
          scene: "FreePlay",
          pos: { x: 0.72, y: 0.9 },
          heightFrac: 0.12,
        },
      ],
    },
  ],
  portrait: [
    {
      id: "cottage",
      en: "Cottage garden",
      es: "Jardín de la casita",
      hit: { x: 0.02, y: 0.38, w: 0.46, h: 0.4 },
      activities: [
        {
          id: "colors",
          en: "Color Garden",
          es: "Jardín de Colores",
          scene: "ColorGarden",
          pos: { x: 0.18, y: 0.575 },
          heightFrac: 0.085,
        },
        {
          id: "findFriend",
          en: "Find My Friend",
          es: "Busca a Mi Amigo",
          scene: "FindFriend",
          pos: { x: 0.34, y: 0.54 },
          heightFrac: 0.1,
        },
        {
          id: "gardenCare",
          en: "Garden Care",
          es: "Cuidar el Jardín",
          scene: null,
          pos: { x: 0.13, y: 0.72 },
          heightFrac: 0.085,
        },
      ],
    },
    {
      id: "pond",
      en: "Pond",
      es: "Estanque",
      hit: { x: 0.45, y: 0.55, w: 0.52, h: 0.28 },
      activities: [
        {
          id: "counting",
          en: "Counting Pond",
          es: "Estanque de Contar",
          scene: null,
          pos: { x: 0.82, y: 0.72 },
          heightFrac: 0.07,
        },
        {
          id: "shapes",
          en: "Shapes",
          es: "Formas",
          scene: null,
          pos: { x: 0.58, y: 0.80 },
          heightFrac: 0.08,
        },
      ],
    },
    {
      id: "gazebo",
      en: "Gazebo",
      es: "Glorieta",
      hit: { x: 0.55, y: 0.20, w: 0.43, h: 0.28 },
      activities: [
        {
          id: "animalSounds",
          en: "Animal Sounds",
          es: "Sonidos de Animales",
          scene: null,
          pos: { x: 0.80, y: 0.28 },
          heightFrac: 0.08,
        },
        {
          id: "music",
          en: "Music",
          es: "Música",
          scene: null,
          pos: { x: 0.81, y: 0.34 },
          heightFrac: 0.08,
        },
      ],
    },
    {
      id: "picnic",
      en: "Picnic meadow",
      es: "Prado del picnic",
      hit: { x: 0.4, y: 0.7, w: 0.56, h: 0.26 },
      activities: [
        {
          id: "feed",
          en: "Feed Friends",
          es: "Alimenta a los Amigos",
          scene: "FeedFriends",
          pos: { x: 0.84, y: 0.88 },
          heightFrac: 0.11,
        },
        {
          id: "freePlay",
          en: "Free Play",
          es: "Jardín Libre",
          scene: "FreePlay",
          pos: { x: 0.52, y: 0.88 },
          heightFrac: 0.1,
        },
      ],
    },
  ],
};

/** @deprecated — zone model replaces sticker landmarks; kept for test compat. */
export const HUB_LANDMARKS = {
  landscape: HUB_ZONES.landscape.flatMap((z) =>
    z.activities.map((a) => ({
      id: a.id,
      en: a.en,
      es: a.es,
      scene: a.scene ?? "GardenHub",
      pos: a.pos,
    })),
  ),
  portrait: HUB_ZONES.portrait.flatMap((z) =>
    z.activities.map((a) => ({
      id: a.id,
      en: a.en,
      es: a.es,
      scene: a.scene ?? "GardenHub",
      pos: a.pos,
    })),
  ),
};

/** Bunny hops along cottage-to-center path — dry dirt, clear of pond edge. */
export const BUNNY_PATH: Record<PocAspect, Norm[]> = {
  landscape: [
    { x: 0.17, y: 0.855, scale: 1 },
    { x: 0.21, y: 0.82, scale: 0.98 },
    { x: 0.25, y: 0.795, scale: 0.96 },
    { x: 0.21, y: 0.82, scale: 0.98 },
  ],
  portrait: [
    { x: 0.36, y: 0.8, scale: 1 },
    { x: 0.42, y: 0.76, scale: 0.98 },
    { x: 0.48, y: 0.74, scale: 0.96 },
    { x: 0.42, y: 0.76, scale: 0.98 },
  ],
};

/** Frog on plain lily pad — open water, clear of numbered pads. */
export const FROG_PAD: Record<PocAspect, Norm> = {
  landscape: { x: 0.5, y: 0.705, scale: 0.82 },
  portrait: { x: 0.64, y: 0.74, scale: 0.72 },
};

export const FEED_TARGETS: Record<PocAspect, Norm[]> = {
  landscape: [
    { x: 0.32, y: 0.62 },
    { x: 0.68, y: 0.62 },
  ],
  portrait: [
    { x: 0.3, y: 0.58 },
    { x: 0.7, y: 0.58 },
  ],
};

export const FEED_FOODS: Record<PocAspect, Norm[]> = {
  landscape: [
    { x: 0.25, y: 0.88 },
    { x: 0.5, y: 0.9 },
    { x: 0.75, y: 0.88 },
  ],
  portrait: [
    { x: 0.22, y: 0.86 },
    { x: 0.5, y: 0.88 },
    { x: 0.78, y: 0.86 },
  ],
};
