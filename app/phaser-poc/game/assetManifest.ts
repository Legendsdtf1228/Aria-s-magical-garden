/** Central list of every Phaser POC preload asset (path + texture key). */
export const POC_ASSETS: { key: string; path: string }[] = [
  { key: "hub-landscape", path: "/art/scenes/garden-map-landscape.webp" },
  { key: "hub-portrait", path: "/art/scenes/garden-map-portrait.webp" },
  { key: "meadow-landscape", path: "/art/scenes/animal-meadow-landscape.webp" },
  { key: "meadow-portrait", path: "/art/scenes/animal-meadow-portrait.webp" },
  { key: "picnic-landscape", path: "/art/scenes/picnic-meadow-landscape.webp" },
  { key: "picnic-portrait", path: "/art/scenes/picnic-meadow-portrait.webp" },
  { key: "freeplay-landscape", path: "/art/scenes/freeplay-path-landscape.webp" },
  { key: "freeplay-portrait", path: "/art/scenes/freeplay-path-portrait.webp" },
  ...["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"].map((id) => ({
    key: `char-${id}`,
    path: `/art/characters/painted-garden-v1/${id}-idle.webp`,
  })),
  { key: "lm-findFriend", path: "/art/landmarks/landmark-findFriend.webp" },
  { key: "lm-feed", path: "/art/landmarks/landmark-feed.webp" },
  { key: "lm-freePlay", path: "/art/landmarks/landmark-freePlay.webp" },
  { key: "food-carrot", path: "/art/objects/food-carrot.webp" },
  { key: "food-flower", path: "/art/objects/food-flower.webp" },
  { key: "food-seeds", path: "/art/objects/food-seeds.webp" },
  { key: "food-bone", path: "/art/objects/food-bone.webp" },
  { key: "food-fish", path: "/art/objects/food-fish.webp" },
  { key: "food-leaf", path: "/art/objects/food-leaf.webp" },
  { key: "food-fly", path: "/art/objects/food-fly.webp" },
  { key: "food-berry", path: "/art/objects/food-berry.webp" },
];

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
