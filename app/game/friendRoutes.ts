/**
 * Named environment zones + movement routes.
 * Coordinates are normalized to the illustrated frame (0–1).
 * Anchor points are FEET / surface contact — not sprite centers.
 */

export type SceneAspect = "landscape" | "portrait";

export type NormPoint = {
  /** 0 = left edge of art, 1 = right */
  x: number;
  /** 0 = top of art, 1 = bottom — feet / pad contact */
  y: number;
  /** Relative scale vs route base (perspective) */
  scale?: number;
};

export type PathRoute = {
  zone: string;
  /** Pixel-ish size as fraction of frame height at scale 1 */
  baseSize: number;
  waypoints: NormPoint[];
};

export type PadRoute = {
  zone: string;
  baseSize: number;
  pads: NormPoint[];
  homeIndex: number;
};

export type AreaRoute = {
  zone: string;
  baseSize: number;
  /** Rest / home point (feet) */
  home: NormPoint;
  /** Soft wander bounds for idle motion (optional) */
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
};

export type FriendRouteId =
  | "bunnyGardenPath"
  | "frogLilyPads"
  | "butterflyFlowerLoop"
  | "birdBranchRoute"
  | "ladybugLeafPath"
  | "beeFlowerRoute"
  | "catCottageArea"
  | "puppyMeadowArea";

type AspectRoutes = {
  bunnyGardenPath: PathRoute;
  frogLilyPads: PadRoute;
  butterflyFlowerLoop: PathRoute;
  birdBranchRoute: PathRoute;
  ladybugLeafPath: PathRoute;
  beeFlowerRoute: PathRoute;
  catCottageArea: AreaRoute;
  puppyMeadowArea: AreaRoute;
};

/** UI keep-out so characters never cover title / Play / parent flower. */
export const UI_SAFE = {
  landscape: {
    titleMaxY: 0.14,
    play: { x: 0.5, y: 0.9, r: 0.11 },
    parent: { x: 0.94, y: 0.06, r: 0.08 },
  },
  portrait: {
    titleMaxY: 0.12,
    play: { x: 0.5, y: 0.92, r: 0.14 },
    parent: { x: 0.9, y: 0.05, r: 0.1 },
  },
} as const;

export const FRIEND_ROUTES: Record<SceneAspect, AspectRoutes> = {
  landscape: {
    // Dirt path: cottage → center tree bed (on path only)
    bunnyGardenPath: {
      zone: "garden-path",
      baseSize: 0.155,
      waypoints: [
        { x: 0.22, y: 0.76, scale: 1 },
        { x: 0.3, y: 0.72, scale: 0.94 },
        { x: 0.4, y: 0.68, scale: 0.88 },
      ],
    },
    // Pond lily pads — never rocks / flowers / sky
    frogLilyPads: {
      zone: "pond",
      baseSize: 0.095,
      homeIndex: 0,
      pads: [
        { x: 0.68, y: 0.72, scale: 1 },
        { x: 0.76, y: 0.7, scale: 0.92 },
        { x: 0.72, y: 0.78, scale: 1.05 },
      ],
    },
    butterflyFlowerLoop: {
      zone: "flower-beds",
      baseSize: 0.09,
      waypoints: [
        { x: 0.1, y: 0.56, scale: 1 },
        { x: 0.16, y: 0.5, scale: 0.95 },
        { x: 0.12, y: 0.44, scale: 0.9 },
        { x: 0.08, y: 0.5, scale: 0.95 },
      ],
    },
    birdBranchRoute: {
      zone: "central-tree",
      baseSize: 0.085,
      waypoints: [
        { x: 0.46, y: 0.32, scale: 1 },
        { x: 0.5, y: 0.28, scale: 0.95 },
        { x: 0.54, y: 0.34, scale: 1 },
      ],
    },
    ladybugLeafPath: {
      zone: "large-leaf",
      baseSize: 0.07,
      waypoints: [
        { x: 0.58, y: 0.78, scale: 1 },
        { x: 0.62, y: 0.76, scale: 1 },
        { x: 0.6, y: 0.8, scale: 1 },
      ],
    },
    beeFlowerRoute: {
      zone: "blossoms",
      baseSize: 0.075,
      waypoints: [
        { x: 0.4, y: 0.58, scale: 1 },
        { x: 0.48, y: 0.54, scale: 0.95 },
        { x: 0.44, y: 0.5, scale: 0.9 },
      ],
    },
    catCottageArea: {
      zone: "cottage-steps",
      baseSize: 0.12,
      home: { x: 0.145, y: 0.58, scale: 1 },
      bounds: { minX: 0.12, maxX: 0.2, minY: 0.54, maxY: 0.62 },
    },
    puppyMeadowArea: {
      zone: "grassy-clearing",
      baseSize: 0.12,
      home: { x: 0.56, y: 0.72, scale: 1 },
      bounds: { minX: 0.5, maxX: 0.62, minY: 0.68, maxY: 0.78 },
    },
  },
  portrait: {
    bunnyGardenPath: {
      zone: "garden-path",
      baseSize: 0.14,
      waypoints: [
        { x: 0.34, y: 0.82, scale: 1 },
        { x: 0.42, y: 0.72, scale: 0.92 },
        { x: 0.5, y: 0.64, scale: 0.84 },
      ],
    },
    frogLilyPads: {
      zone: "pond",
      baseSize: 0.065,
      homeIndex: 0,
      pads: [
        { x: 0.8, y: 0.72, scale: 1 },
        { x: 0.86, y: 0.7, scale: 0.9 },
        { x: 0.78, y: 0.76, scale: 1.05 },
      ],
    },
    butterflyFlowerLoop: {
      zone: "flower-beds",
      baseSize: 0.085,
      waypoints: [
        { x: 0.18, y: 0.72, scale: 1 },
        { x: 0.22, y: 0.66, scale: 0.95 },
        { x: 0.14, y: 0.64, scale: 0.9 },
      ],
    },
    birdBranchRoute: {
      zone: "central-tree",
      baseSize: 0.08,
      waypoints: [
        { x: 0.42, y: 0.36, scale: 1 },
        { x: 0.48, y: 0.32, scale: 0.95 },
        { x: 0.52, y: 0.38, scale: 1 },
      ],
    },
    ladybugLeafPath: {
      zone: "large-leaf",
      baseSize: 0.065,
      waypoints: [
        { x: 0.28, y: 0.52, scale: 1 },
        { x: 0.32, y: 0.5, scale: 1 },
        { x: 0.3, y: 0.54, scale: 1 },
      ],
    },
    beeFlowerRoute: {
      zone: "blossoms",
      baseSize: 0.07,
      waypoints: [
        { x: 0.55, y: 0.7, scale: 1 },
        { x: 0.6, y: 0.66, scale: 0.95 },
        { x: 0.52, y: 0.64, scale: 0.9 },
      ],
    },
    catCottageArea: {
      zone: "cottage-steps",
      baseSize: 0.11,
      home: { x: 0.12, y: 0.62, scale: 1 },
      bounds: { minX: 0.08, maxX: 0.18, minY: 0.58, maxY: 0.68 },
    },
    puppyMeadowArea: {
      zone: "grassy-clearing",
      baseSize: 0.11,
      home: { x: 0.78, y: 0.82, scale: 1 },
      bounds: { minX: 0.7, maxX: 0.88, minY: 0.76, maxY: 0.88 },
    },
  },
};

export function routeFor(aspect: SceneAspect) {
  return FRIEND_ROUTES[aspect];
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpPoint(a: NormPoint, b: NormPoint, t: number): NormPoint {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
  };
}

/** Ease in-out for gentle hops */
export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Hop arc: 0..1 progress → vertical lift in normalized units */
export function hopLift(t: number, peak = 0.045) {
  return Math.sin(Math.PI * t) * peak;
}

export function frameSizePx(frameH: number, baseSize: number, scale = 1) {
  return Math.round(frameH * baseSize * scale);
}
