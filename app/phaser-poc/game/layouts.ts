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

/** Three toddler choice slots — feet anchors. */
export const CHOICE_SLOTS: Record<PocAspect, [Norm, Norm, Norm]> = {
  landscape: [
    { x: 0.22, y: 0.78, scale: 1 },
    { x: 0.5, y: 0.82, scale: 1 },
    { x: 0.78, y: 0.78, scale: 1 },
  ],
  portrait: [
    { x: 0.22, y: 0.72, scale: 0.95 },
    { x: 0.5, y: 0.76, scale: 0.95 },
    { x: 0.78, y: 0.72, scale: 0.95 },
  ],
};

/** Character display height as fraction of scene height (consistent cast scale). */
export const CHAR_HEIGHT_FRAC = 0.18;
export const PROP_HEIGHT_FRAC = 0.14;
export const LANDMARK_HEIGHT_FRAC = 0.22;
export const MIN_TOUCH_CSS_PX = 96;

export function detectAspect(width: number, height: number): PocAspect {
  return height > width * 1.05 ? "portrait" : "landscape";
}

export function toPx(norm: Norm, w: number, h: number) {
  return { x: norm.x * w, y: norm.y * h, scale: norm.scale ?? 1 };
}

/** Hub activity landmarks — visibly painted locations (normalized). */
export const HUB_LANDMARKS: Record<
  PocAspect,
  { id: string; en: string; es: string; scene: string; pos: Norm }[]
> = {
  landscape: [
    { id: "findFriend", en: "Find My Friend", es: "Busca a Mi Amigo", scene: "FindFriend", pos: { x: 0.48, y: 0.58 } },
    { id: "feed", en: "Feed the Friends", es: "Alimenta a los Amigos", scene: "FeedFriends", pos: { x: 0.78, y: 0.82 } },
    { id: "freePlay", en: "Free Play", es: "Jardín Libre", scene: "FreePlay", pos: { x: 0.62, y: 0.42 } },
  ],
  portrait: [
    { id: "findFriend", en: "Find My Friend", es: "Busca a Mi Amigo", scene: "FindFriend", pos: { x: 0.5, y: 0.52 } },
    { id: "feed", en: "Feed the Friends", es: "Alimenta a los Amigos", scene: "FeedFriends", pos: { x: 0.72, y: 0.78 } },
    { id: "freePlay", en: "Free Play", es: "Jardín Libre", scene: "FreePlay", pos: { x: 0.55, y: 0.38 } },
  ],
};

export const BUNNY_PATH: Record<PocAspect, Norm[]> = {
  landscape: [
    { x: 0.2, y: 0.78, scale: 1 },
    { x: 0.28, y: 0.74, scale: 0.96 },
    { x: 0.36, y: 0.7, scale: 0.92 },
    { x: 0.28, y: 0.74, scale: 0.96 },
  ],
  portrait: [
    { x: 0.26, y: 0.72, scale: 1 },
    { x: 0.36, y: 0.68, scale: 0.96 },
    { x: 0.46, y: 0.66, scale: 0.92 },
    { x: 0.36, y: 0.68, scale: 0.96 },
  ],
};

export const FROG_PAD: Record<PocAspect, Norm> = {
  landscape: { x: 0.74, y: 0.68, scale: 1 },
  portrait: { x: 0.7, y: 0.6, scale: 1 },
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
