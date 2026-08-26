/**
 * Checkerboard audit — every hub transparent prop on contrasting grid.
 */
import sharp from "sharp";
import { existsSync } from "fs";
import { join } from "path";

const PROPS = "public/art/hub-props";
const OUT = "docs/review/v5/phaser-poc/PROP-AUDIT-CHECKERBOARD.png";

const ORDER = [
  "prop-lily-pad.webp",
  "prop-pot-red.webp",
  "prop-pot-blue.webp",
  "prop-pot-yellow.webp",
  "prop-pot-purple.webp",
  "prop-watering-can.webp",
  "prop-shape-triangle.webp",
  "prop-shape-circle.webp",
  "prop-shape-square.webp",
  "prop-shape-star.webp",
  "prop-chimes.webp",
  "prop-drum.webp",
  "prop-harp.webp",
  "prop-xylophone.webp",
  "prop-birdhouse.webp",
  "prop-magnifier.webp",
  "prop-picnic-basket.webp",
];

const files = ORDER.filter((f) => existsSync(join(PROPS, f)));
const COLS = 4;
const ROWS = Math.ceil(files.length / COLS);
const CELL = 240;
const W = COLS * CELL;
const H = ROWS * CELL;
const bg = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const tile = (Math.floor(x / 20) + Math.floor(y / 20)) % 2 === 0;
    bg[i] = tile ? 200 : 120;
    bg[i + 1] = tile ? 200 : 120;
    bg[i + 2] = tile ? 200 : 120;
    bg[i + 3] = 255;
  }
}

let canvas = sharp(bg, { raw: { width: W, height: H, channels: 4 } });
const composites = [];
for (let i = 0; i < files.length; i++) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const path = join(PROPS, files[i]);
  const resized = await sharp(path)
    .resize(CELL - 36, CELL - 36, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  composites.push({
    input: resized,
    left: col * CELL + Math.floor((CELL - (meta.width || 0)) / 2),
    top: row * CELL + Math.floor((CELL - (meta.height || 0)) / 2),
  });
}

await canvas.composite(composites).png().toFile(OUT);
console.log("wrote", OUT, files.length, "props");
