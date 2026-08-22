/** Garden map helpers for Node tests (ESM). */

export const GARDEN_LOCATION_IDS = [
  "colors",
  "feed",
  "findFriend",
  "animalSounds",
  "gardenCare",
  "freePlay",
  "shapes",
  "counting",
  "music",
  "animals",
];

export const FRIEND_HOME_IDS = [
  "butterfly",
  "bunny",
  "bird",
  "ladybug",
  "bee",
  "frog",
  "cat",
  "puppy",
];

/** Clamp map scroll so toddlers never overshoot the garden edges. */
export function clampMapScroll(scrollLeft, maxScroll) {
  if (maxScroll <= 0) return 0;
  return Math.min(maxScroll, Math.max(0, scrollLeft));
}

/** Pan step for arrow buttons (~one garden “room”). */
export function nextMapScroll(scrollLeft, maxScroll, direction, step = 280) {
  const delta = direction === "right" ? step : -step;
  return clampMapScroll(scrollLeft + delta, maxScroll);
}

export function isValidGardenLocation(id) {
  return GARDEN_LOCATION_IDS.includes(id);
}

/** Scene transition should stay snappy for toddlers. */
export function transitionMs(reducedMotion) {
  return reducedMotion ? 0 : 420;
}
