/** Hub-shared assets only — activity murals/food lazy-load later. */
const CAST = ["bunny", "frog", "puppy", "cat", "butterfly", "bird", "bee", "ladybug"];

/** Genuine transparent props — one object per file in hub-props/. */
const HUB_PROPS = [
  "prop-lily-pad",
  "prop-pot-red",
  "prop-pot-blue",
  "prop-pot-yellow",
  "prop-pot-purple",
  "prop-watering-can",
  "prop-shape-triangle",
  "prop-shape-circle",
  "prop-shape-square",
  "prop-shape-star",
  "prop-chimes",
  "prop-drum",
  "prop-harp",
  "prop-xylophone",
  "prop-birdhouse",
  "prop-magnifier",
  "prop-picnic-basket",
];

export const HUB_SHARED_ASSETS: { key: string; path: string }[] = [
  { key: "hub-landscape", path: "/art/scenes/garden-map-landscape.webp" },
  { key: "hub-portrait", path: "/art/scenes/garden-map-portrait.webp" },
  ...CAST.map((id) => ({
    key: `char-${id}`,
    path: `/art/characters/poc-cast-v1/${id}-idle.webp`,
  })),
  ...HUB_PROPS.map((key) => ({
    key,
    path: `/art/hub-props/${key}.webp`,
  })),
  { key: "ui-home", path: "/art/ui/ui-home.webp" },
  { key: "ui-replay", path: "/art/ui/ui-replay.webp" },
  { key: "ui-parent-flower", path: "/art/ui/ui-parent-flower.webp" },
];

/** Activity-specific art — lazy-loaded when leaving hub (not in cold hub preload). */
export const ACTIVITY_ASSETS: Record<string, { key: string; path: string }[]> = {
  FindFriend: [
    { key: "meadow-landscape", path: "/art/scenes/animal-meadow-landscape.webp" },
    { key: "meadow-portrait", path: "/art/scenes/animal-meadow-portrait.webp" },
  ],
  FeedFriends: [
    { key: "picnic-landscape", path: "/art/scenes/picnic-meadow-landscape.webp" },
    { key: "picnic-portrait", path: "/art/scenes/picnic-meadow-portrait.webp" },
    { key: "food-carrot", path: "/art/objects/food-carrot.webp" },
    { key: "food-flower", path: "/art/objects/food-flower.webp" },
    { key: "food-seeds", path: "/art/objects/food-seeds.webp" },
    { key: "food-bone", path: "/art/objects/food-bone.webp" },
    { key: "food-fish", path: "/art/objects/food-fish.webp" },
    { key: "food-leaf", path: "/art/objects/food-leaf.webp" },
    { key: "food-fly", path: "/art/objects/food-fly.webp" },
    { key: "food-berry", path: "/art/objects/food-berry.webp" },
  ],
  FreePlay: [
    { key: "freeplay-landscape", path: "/art/scenes/freeplay-path-landscape.webp" },
    { key: "freeplay-portrait", path: "/art/scenes/freeplay-path-portrait.webp" },
  ],
};

/** @deprecated alias — hub cold load uses HUB_SHARED_ASSETS only */
export const POC_ASSETS = HUB_SHARED_ASSETS;

export const REVIEW_SCENE_MAP: Record<string, string> = {
  hub: "GardenHub",
  findFriend: "FindFriend",
  feed: "FeedFriends",
  freePlay: "FreePlay",
};

export function resolveStartScene(review: string | null | undefined): string {
  if (!review) return "GardenHub";
  return REVIEW_SCENE_MAP[review] ?? "GardenHub";
}
