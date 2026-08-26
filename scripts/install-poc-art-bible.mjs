/**
 * Install Phase-3 art bible — magenta chroma + largest-blob trim per cell.
 * Prevents neighbor bleed (bird/butterfly, bee/bird).
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
const CHAR = "public/art/characters/poc-cast-v1";
const LM = "public/art/landmarks";
const UI = "public/art/ui";
const REVIEW = "docs/review/v5/phaser-poc";

await mkdir(CHAR, { recursive: true });
await mkdir(LM, { recursive: true });
await mkdir(UI, { recursive: true });
await mkdir(REVIEW, { recursive: true });

function must(name) {
  const p = join(ASSETS, name);
  if (!existsSync(p)) {
    console.error("MISSING", p);
    process.exit(1);
  }
  return p;
}

function keyBackground(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Magenta chroma
    if (r > 180 && b > 180 && g < 140 && Math.abs(r - b) < 80) {
      data[i + 3] = 0;
      continue;
    }
    if (r > 220 && b > 200 && g < 160) {
      data[i + 3] = 0;
      continue;
    }
    // Black / near-black sheet backdrop
    if (r < 36 && g < 36 && b < 36) data[i + 3] = 0;
  }
  return data;
}

function findOpaqueBounds(data, w, h, minAlpha = 24) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > minAlpha) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return null;
  const pad = 3;
  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(w - Math.max(0, minX - pad), maxX - minX + 1 + pad * 2),
    height: Math.min(h - Math.max(0, minY - pad), maxY - minY + 1 + pad * 2),
  };
}

/** Keep only the largest connected opaque blob — drops neighbor wings/tails. */
function keepLargestComponent(data, w, h, minAlpha = 24) {
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  let best = [];
  let bestLen = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= minAlpha) continue;
      const stack = [[x, y]];
      const comp = [];
      visited[i] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        comp.push([cx, cy]);
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
          if (visited[ni] || data[ni * 4 + 3] <= minAlpha) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (comp.length > bestLen) {
        bestLen = comp.length;
        best = comp;
      }
    }
  }

  const keep = new Uint8Array(w * h);
  for (const [x, y] of best) keep[idx(x, y)] = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!keep[idx(x, y)]) {
        const o = (y * w + x) * 4 + 3;
        data[o] = 0;
      }
    }
  }
  return data;
}

/** Find all opaque blobs in full sheet, sorted left→right. */
function findAllBlobs(data, w, h, minAlpha = 24, minArea = 800) {
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const blobs = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= minAlpha) continue;
      const stack = [[x, y]];
      const pixels = [];
      visited[i] = 1;
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        pixels.push([cx, cy]);
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
          if (visited[ni] || data[ni * 4 + 3] <= minAlpha) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (pixels.length < minArea) continue;
      blobs.push({
        area: pixels.length,
        cx: (minX + maxX) / 2,
        bounds: {
          left: Math.max(0, minX - 2),
          top: Math.max(0, minY - 2),
          width: maxX - minX + 1 + 4,
          height: maxY - minY + 1 + 4,
        },
      });
    }
  }
  blobs.sort((a, b) => a.cx - b.cx);
  return blobs;
}

/** Drop tiny speckles; keep components ≥ minFrac of the largest blob. */
function keepMainComponents(data, w, h, minAlpha = 24, minFrac = 0.015) {
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const comps = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= minAlpha) continue;
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
          if (visited[ni] || data[ni * 4 + 3] <= minAlpha) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      comps.push(pixels);
    }
  }
  if (!comps.length) return data;
  comps.sort((a, b) => b.length - a.length);
  const minSize = Math.max(48, Math.floor(comps[0].length * minFrac));
  const keep = new Uint8Array(w * h);
  for (const comp of comps) {
    if (comp.length < minSize) continue;
    for (const [x, y] of comp) keep[idx(x, y)] = 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!keep[idx(x, y)]) data[(y * w + x) * 4 + 3] = 0;
    }
  }
  return data;
}

async function sliceCastByBlobs(srcName, names, outDir, size = 512) {
  const src = must(srcName);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyBackground(data);
  const blobs = findAllBlobs(data, info.width, info.height);
  if (blobs.length < names.length) {
    console.error("Expected", names.length, "cast blobs, found", blobs.length);
    process.exit(1);
  }
  const use = blobs.slice(0, names.length);
  for (let i = 0; i < names.length; i++) {
    const b = use[i].bounds;
    const cw = b.width;
    const ch = b.height;
    const cell = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) {
      const srcOff = ((b.top + y) * info.width + b.left) * 4;
      const dstOff = y * cw * 4;
      data.copy(cell, dstOff, srcOff, srcOff + cw * 4);
    }
    keepLargestComponent(cell, cw, ch);
    const bounds = findOpaqueBounds(cell, cw, ch);
    if (!bounds) continue;
    await sharp(cell, { raw: { width: cw, height: ch, channels: 4 } })
      .extract(bounds)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(join(outDir, names[i]));
    console.log("wrote", join(outDir, names[i]), names[i]);
  }
}

async function sliceGrid(srcName, cols, rows, names, outDir, size = 512) {
  const src = must(srcName);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyBackground(data);
  const W = info.width;
  const H = info.height;
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);
  const insetX = Math.floor(cellW * 0.03);
  const insetY = Math.floor(cellH * 0.03);

  for (let i = 0; i < names.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left0 = col * cellW + insetX;
    const top0 = row * cellH + insetY;
    const cw = cellW - insetX * 2;
    const ch = cellH - insetY * 2;
    const cell = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) {
      const srcOff = ((top0 + y) * W + left0) * 4;
      const dstOff = y * cw * 4;
      data.copy(cell, dstOff, srcOff, srcOff + cw * 4);
    }
    keepLargestComponent(cell, cw, ch);
    const bounds = findOpaqueBounds(cell, cw, ch);
    if (!bounds) {
      console.warn("EMPTY cell", names[i]);
      continue;
    }
    const cropped = await sharp(cell, {
      raw: { width: cw, height: ch, channels: 4 },
    })
      .extract(bounds)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(join(outDir, names[i]));
    console.log("wrote", join(outDir, names[i]), cropped.size, "bytes");
  }
}

const CAST = "poc-cast-bible-v2.png";
const LAND = "poc-landmark-bible-v2.png";
const UIP = "poc-hub-ui-props-v2.png";

// Cast sheet: eight separated characters on black — blob slice after black key.
await sliceCastByBlobs(
  CAST,
  [
    "bunny-idle.webp",
    "frog-idle.webp",
    "puppy-idle.webp",
    "cat-idle.webp",
    "butterfly-idle.webp",
    "bird-idle.webp",
    "bee-idle.webp",
    "ladybug-idle.webp",
  ],
  CHAR,
  512,
);

await sliceGrid(
  LAND,
  3,
  3,
  [
    "lm-colors.webp",
    "lm-findFriend.webp",
    "lm-counting.webp",
    "lm-feed.webp",
    "lm-animalSounds.webp",
    "lm-gardenCare.webp",
    "lm-shapes.webp",
    "lm-freePlay.webp",
    "lm-music.webp",
  ],
  LM,
  640,
);

await sliceGrid(
  UIP,
  2,
  2,
  ["ui-home.webp", "ui-replay.webp", "ui-parent-flower.webp", "ui-title-arch.webp"],
  UI,
  512,
);

async function writeReviewSheet(srcName, outBase) {
  const src = must(srcName);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyBackground(data);
  const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  await img.clone().png().toFile(join(REVIEW, `${outBase}.png`));
  await img.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(join(REVIEW, `${outBase}.webp`));
  console.log("wrote review", outBase);
}

await writeReviewSheet(CAST, "CAST-BIBLE");
await writeReviewSheet(LAND, "LANDMARK-BIBLE");
console.log("done");
