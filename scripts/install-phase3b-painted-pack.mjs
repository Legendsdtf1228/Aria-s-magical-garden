/**
 * Install Phase 3b painted pack: scenes, color props, map landmarks,
 * food, shape stones, care tools, music cues.
 * Sources live in Cursor assets folder; work from Z:\ only.
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ASSETS =
  process.env.CURSOR_ASSETS ||
  join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets",
  );
const SCENES = "public/art/scenes";
const OBJECTS = "public/art/objects";
const LANDMARKS = "public/art/landmarks";

await mkdir(SCENES, { recursive: true });
await mkdir(OBJECTS, { recursive: true });
await mkdir(LANDMARKS, { recursive: true });

function must(name) {
  const p = join(ASSETS, name);
  if (!existsSync(p)) {
    console.error("MISSING", p);
    process.exit(1);
  }
  return p;
}

async function chromaKey(buf, info) {
  const data = Buffer.from(buf);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Pure / near chroma green
    if (g > 160 && g > r + 40 && g > b + 40) data[i + 3] = 0;
    if (g > 200 && r < 120 && b < 120) data[i + 3] = 0;
  }
  return { data, info };
}

async function sceneWebp(srcName, destName, w, h) {
  const dest = join(SCENES, destName);
  await sharp(must(srcName))
    .resize(w, h, { fit: "cover", position: "centre" })
    .webp({ quality: 86 })
    .toFile(dest);
  console.log("scene", dest);
}

async function sliceGrid(srcName, cols, rows, names, outDir, size = 512) {
  const src = must(srcName);
  const meta = await sharp(src).metadata();
  const W = meta.width || 1024;
  const H = meta.height || 1024;
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);
  // inset to avoid green borders between cells
  const padX = Math.floor(cellW * 0.04);
  const padY = Math.floor(cellH * 0.04);

  for (let i = 0; i < names.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cellW + padX;
    const top = row * cellH + padY;
    const width = cellW - padX * 2;
    const height = cellH - padY * 2;
    const extracted = await sharp(src)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .resize(size, size, { fit: "contain", background: { r: 0, g: 255, b: 0, alpha: 1 } })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const keyed = await chromaKey(extracted.data, extracted.info);
    const dest = join(outDir, names[i]);
    await sharp(keyed.data, {
      raw: { width: keyed.info.width, height: keyed.info.height, channels: 4 },
    })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(dest);
    console.log("slice", dest);
  }
}

const sceneJobs = [
  ["picnic-meadow-landscape.png", "picnic-meadow-landscape.webp", 1440, 900],
  ["picnic-meadow-portrait.png", "picnic-meadow-portrait.webp", 390, 844],
  ["sound-grove-landscape.png", "sound-grove-landscape.webp", 1440, 900],
  ["sound-grove-portrait.png", "sound-grove-portrait.webp", 390, 844],
  ["shape-meadow-landscape.png", "shape-meadow-landscape.webp", 1440, 900],
  ["shape-meadow-portrait.png", "shape-meadow-portrait.webp", 390, 844],
  ["care-beds-landscape.png", "care-beds-landscape.webp", 1440, 900],
  ["care-beds-portrait.png", "care-beds-portrait.webp", 390, 844],
  ["freeplay-path-landscape.png", "freeplay-path-landscape.webp", 1440, 900],
  ["freeplay-path-portrait.png", "freeplay-path-portrait.webp", 390, 844],
  ["music-gazebo-landscape.png", "music-gazebo-landscape.webp", 1440, 900],
  ["music-gazebo-portrait.png", "music-gazebo-portrait.webp", 390, 844],
  ["friends-yard-landscape.png", "friends-yard-landscape.webp", 1440, 900],
  ["friends-yard-portrait.png", "friends-yard-portrait.webp", 390, 844],
];

for (const j of sceneJobs) await sceneWebp(...j);

await sliceGrid(
  "color-props-sheet-v1.png",
  5,
  2,
  [
    "color-prop-red.webp",
    "color-prop-blue.webp",
    "color-prop-yellow.webp",
    "color-prop-green.webp",
    "color-prop-purple.webp",
    "color-prop-orange.webp",
    "color-prop-pink.webp",
    "color-prop-brown.webp",
    "color-prop-black.webp",
    "color-prop-white.webp",
  ],
  OBJECTS,
);

await sliceGrid(
  "map-landmarks-sheet-v1.png",
  5,
  2,
  [
    "landmark-colors.webp",
    "landmark-feed.webp",
    "landmark-findFriend.webp",
    "landmark-animalSounds.webp",
    "landmark-gardenCare.webp",
    "landmark-freePlay.webp",
    "landmark-shapes.webp",
    "landmark-counting.webp",
    "landmark-music.webp",
    "landmark-animals.webp",
  ],
  LANDMARKS,
  640,
);

await sliceGrid(
  "food-props-sheet-v1.png",
  4,
  2,
  [
    "food-carrot.webp",
    "food-bone.webp",
    "food-fish.webp",
    "food-seeds.webp",
    "food-fly.webp",
    "food-flower.webp",
    "food-berry.webp",
    "food-leaf.webp",
  ],
  OBJECTS,
);

await sliceGrid(
  "shape-stones-sheet-v1.png",
  3,
  2,
  [
    "shape-circle.webp",
    "shape-square.webp",
    "shape-triangle.webp",
    "shape-star.webp",
    "shape-heart.webp",
    "shape-oval.webp",
  ],
  OBJECTS,
);

await sliceGrid(
  "care-tools-sheet-v1.png",
  4,
  1,
  [
    "tool-water.webp",
    "tool-sun.webp",
    "tool-grow.webp",
    "tool-visit.webp",
  ],
  OBJECTS,
);

await sliceGrid(
  "music-cues-sheet-v1.png",
  3,
  2,
  [
    "music-clap.webp",
    "music-stomp.webp",
    "music-spin.webp",
    "music-jump.webp",
    "music-wiggle.webp",
    "music-freeze.webp",
  ],
  OBJECTS,
);

console.log("Phase 3b painted pack installed.");
