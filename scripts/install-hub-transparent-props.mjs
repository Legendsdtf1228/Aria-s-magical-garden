/**
 * Install genuine transparent hub props — one object per file.
 * NO rectangular scene crops. Sources: SVG lily, object shapes,
 * chroma-keyed generated instruments, blob-split color pots.
 */
import sharp from "sharp";
import { mkdir, copyFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const OUT = "public/art/hub-props";
const OBJ = "public/art/objects";
const LM = "public/art/landmarks";
const ASSETS =
  process.env.CURSOR_ASSETS ||
  join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets",
  );

await mkdir(OUT, { recursive: true });

function keyChroma(data, mode = "green") {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 180 && b > 180 && g < 140 && Math.abs(r - b) < 80) {
      data[i + 3] = 0;
      continue;
    }
    if (r > 220 && b > 200 && g < 160) {
      data[i + 3] = 0;
      continue;
    }
    if (r < 38 && g < 38 && b < 38) {
      data[i + 3] = 0;
      continue;
    }
    if (mode === "magenta") {
      if (r > 200 && b > 180 && g < 100) data[i + 3] = 0;
    }
  }
}

/** Remove backdrop only where connected to image edges (protects green leaves/tubes). */
function floodKeyFromEdges(data, w, h, isKey) {
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (visited[i]) return;
    if (!isKey(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])) return;
    visited[i] = 1;
    stack.push([x, y]);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const [cx, cy] = stack.pop();
    data[(cy * w + cx) * 4 + 3] = 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (visited[ni]) continue;
      const o = ni * 4;
      if (!isKey(data[o], data[o + 1], data[o + 2])) continue;
      visited[ni] = 1;
      stack.push([nx, ny]);
    }
  }
}

/** Drop tiny fringe blobs; keep largest + near-large companions. */
function keepMain(data, w, h, minFrac = 0.02) {
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const comps = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= 24) continue;
      const stack = [[x, y]];
      const pixels = [];
      visited[i] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        pixels.push([cx, cy]);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = idx(nx, ny);
          if (visited[ni] || data[ni * 4 + 3] <= 24) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      comps.push(pixels);
    }
  }
  if (!comps.length) return;
  comps.sort((a, b) => b.length - a.length);
  const minSize = Math.max(40, Math.floor(comps[0].length * minFrac));
  const keep = new Uint8Array(w * h);
  for (const c of comps) {
    if (c.length < minSize) continue;
    for (const [x, y] of c) keep[idx(x, y)] = 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!keep[idx(x, y)]) data[(y * w + x) * 4 + 3] = 0;
    }
  }
}

function trimBounds(data, w, h) {
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX) return null;
  const pad = 2;
  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(w - Math.max(0, minX - pad), maxX - minX + 1 + pad * 2),
    height: Math.min(h - Math.max(0, minY - pad), maxY - minY + 1 + pad * 2),
  };
}

async function writeRaw(data, w, h, outName) {
  const b = trimBounds(data, w, h);
  if (!b) {
    console.error("empty", outName);
    process.exit(1);
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract(b)
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(join(OUT, outName));
  console.log("wrote", outName);
}

async function fromGreenKey(srcPath, outName) {
  if (!existsSync(srcPath)) {
    console.error("missing", srcPath);
    process.exit(1);
  }
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Edge-connected chroma only — keeps interior object colors intact
  floodKeyFromEdges(data, info.width, info.height, (r, g, b) => {
    if (r < 45 && g < 45 && b < 45) return true;
    // Magenta backdrop
    if (r > 180 && b > 160 && g < 120) return true;
    // Lime green backdrop
    if (g > 140 && g > r + 35 && g > b + 35) return true;
    if (g > 190 && r < 140 && b < 140) return true;
    return false;
  });
  keepMain(data, info.width, info.height, 0.01);
  await writeRaw(data, info.width, info.height, outName);
}

async function fromBlackKeyedCopy(srcName, outName) {
  const p = join(OBJ, srcName);
  if (!existsSync(p)) {
    console.error("missing", p);
    process.exit(1);
  }
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyChroma(data, "black");
  // Remove thin green grass fringe on shape bottoms
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (g > 90 && g > r + 25 && g > b + 25 && r < 100 && b < 100) data[i + 3] = 0;
  }
  keepMain(data, info.width, info.height, 0.02);
  await writeRaw(data, info.width, info.height, outName);
}

async function makeLilyPad() {
  const W = 280;
  const H = 170;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#6ecf5a"/>
        <stop offset="70%" stop-color="#3d8f38"/>
        <stop offset="100%" stop-color="#2a6528"/>
      </radialGradient>
    </defs>
    <ellipse cx="${W / 2}" cy="${H / 2 + 8}" rx="${W * 0.42}" ry="${H * 0.34}" fill="url(#g)"/>
    <ellipse cx="${W / 2}" cy="${H / 2 + 8}" rx="${W * 0.38}" ry="${H * 0.28}" fill="none" stroke="#2a5528" stroke-width="3" opacity="0.45"/>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 92, alphaQuality: 100 }).toFile(join(OUT, "prop-lily-pad.webp"));
  console.log("wrote prop-lily-pad.webp");
}

/** Split lm-colors (4 pots on black) into individual transparent pots. */
async function splitColorPots() {
  const src = join(LM, "lm-colors.webp");
  if (!existsSync(src)) {
    // fallback to object color props
    await fromBlackKeyedCopy("color-prop-red.webp", "prop-pot-red.webp");
    await fromBlackKeyedCopy("color-prop-blue.webp", "prop-pot-blue.webp");
    await fromBlackKeyedCopy("color-prop-yellow.webp", "prop-pot-yellow.webp");
    await fromBlackKeyedCopy("color-prop-purple.webp", "prop-pot-purple.webp");
    return;
  }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyChroma(data, "black");
  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const blobs = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= 24) continue;
      const stack = [[x, y]];
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      visited[i] = 1;
      let area = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        area += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = idx(nx, ny);
          if (visited[ni] || data[ni * 4 + 3] <= 24) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (area < 800) continue;
      blobs.push({
        cx: (minX + maxX) / 2,
        bounds: {
          left: Math.max(0, minX - 3),
          top: Math.max(0, minY - 3),
          width: maxX - minX + 1 + 6,
          height: maxY - minY + 1 + 6,
        },
      });
    }
  }
  blobs.sort((a, b) => a.cx - b.cx);
  const names = ["prop-pot-red.webp", "prop-pot-blue.webp", "prop-pot-yellow.webp", "prop-pot-purple.webp"];
  if (blobs.length < 4) {
    console.warn("pot blobs", blobs.length, "— falling back to color-prop objects");
    await fromBlackKeyedCopy("color-prop-red.webp", "prop-pot-red.webp");
    await fromBlackKeyedCopy("color-prop-blue.webp", "prop-pot-blue.webp");
    await fromBlackKeyedCopy("color-prop-yellow.webp", "prop-pot-yellow.webp");
    await fromBlackKeyedCopy("color-prop-purple.webp", "prop-pot-purple.webp");
    return;
  }
  for (let i = 0; i < 4; i++) {
    const b = blobs[i].bounds;
    const cell = Buffer.alloc(b.width * b.height * 4);
    for (let y = 0; y < b.height; y++) {
      const srcOff = ((b.top + y) * w + b.left) * 4;
      data.copy(cell, y * b.width * 4, srcOff, srcOff + b.width * 4);
    }
    keepMain(cell, b.width, b.height, 0.02);
    await writeRaw(cell, b.width, b.height, names[i]);
  }
}

function findGen(name) {
  const p = join(ASSETS, name);
  if (existsSync(p)) return p;
  // also check workspace root assets
  const alt = join("assets", name);
  if (existsSync(alt)) return alt;
  console.error("MISSING generated asset", name, "looked in", ASSETS);
  process.exit(1);
}

await makeLilyPad();
await splitColorPots();

if (existsSync(join(OBJ, "watering-can.webp"))) {
  await fromBlackKeyedCopy("watering-can.webp", "prop-watering-can.webp");
} else {
  await fromBlackKeyedCopy("tool-water.webp", "prop-watering-can.webp");
}

await fromBlackKeyedCopy("shape-triangle.webp", "prop-shape-triangle.webp");
await fromBlackKeyedCopy("shape-circle.webp", "prop-shape-circle.webp");
await fromBlackKeyedCopy("shape-square.webp", "prop-shape-square.webp");
await fromBlackKeyedCopy("shape-star.webp", "prop-shape-star.webp");

await fromGreenKey(findGen("gen-prop-chimes-v2.png"), "prop-chimes.webp");
await fromGreenKey(findGen("gen-prop-drum.png"), "prop-drum.webp");
await fromGreenKey(findGen("gen-prop-harp.png"), "prop-harp.webp");
await fromGreenKey(findGen("gen-prop-xylophone.png"), "prop-xylophone.webp");
await fromGreenKey(findGen("gen-prop-birdhouse.png"), "prop-birdhouse.webp");
await fromGreenKey(findGen("gen-prop-magnifier.png"), "prop-magnifier.webp");

// Picnic basket — blob from feed landmark on black
{
  const src = join(LM, "lm-feed.webp");
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyChroma(data, "black");
  keepMain(data, info.width, info.height, 0.05);
  await writeRaw(data, info.width, info.height, "prop-picnic-basket.webp");
}

console.log("done", OUT);
