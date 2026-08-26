/**
 * Hub prop crops — alpha-trim, no rectangular scene fragments.
 */
import sharp from "sharp";
import { join } from "path";
import { existsSync } from "fs";

const LM = "public/art/landmarks";

function keyBackground(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 180 && b > 180 && g < 140 && Math.abs(r - b) < 80) data[i + 3] = 0;
    else if (r > 220 && b > 200 && g < 160) data[i + 3] = 0;
    else if (r < 36 && g < 36 && b < 36) data[i + 3] = 0;
  }
}

function keepMainComponents(data, w, h, minAlpha = 20, minFrac = 0.02) {
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
  if (!comps.length) return;
  comps.sort((a, b) => b.length - a.length);
  const minSize = Math.max(32, Math.floor(comps[0].length * minFrac));
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
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function findBlobs(data, w, h, minArea = 400) {
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const blobs = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (visited[i] || data[i * 4 + 3] <= 20) continue;
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
          if (visited[ni] || data[ni * 4 + 3] <= 20) continue;
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
      if (area < minArea) continue;
      blobs.push({
        area,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        bounds: {
          left: Math.max(0, minX - 2),
          top: Math.max(0, minY - 2),
          width: maxX - minX + 1 + 4,
          height: maxY - minY + 1 + 4,
        },
      });
    }
  }
  return blobs;
}

async function loadKeyed(srcName) {
  const src = join(LM, srcName);
  if (!existsSync(src)) {
    console.error("missing", src);
    process.exit(1);
  }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyBackground(data);
  return { data, info };
}

async function writeExtract(data, w, h, bounds, outName) {
  const left = Math.max(0, Math.min(bounds.left, w - 1));
  const top = Math.max(0, Math.min(bounds.top, h - 1));
  const width = Math.max(1, Math.min(bounds.width, w - left));
  const height = Math.max(1, Math.min(bounds.height, h - top));
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width, height })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(LM, outName));
  console.log("wrote", outName);
}

async function cropTrim(srcName, outName, region) {
  const src = join(LM, srcName);
  if (!existsSync(src)) {
    console.error("missing", src);
    process.exit(1);
  }
  const meta = await sharp(src).metadata();
  const W = meta.width || 640;
  const H = meta.height || 640;
  const left = Math.min(Math.floor(W * region.l), W - 8);
  const top = Math.min(Math.floor(H * region.t), H - 8);
  const width = Math.min(Math.max(8, Math.floor(W * region.w)), W - left);
  const height = Math.min(Math.max(8, Math.floor(H * region.h)), H - top);
  const { data, info } = await sharp(src)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  keyBackground(data);
  keepMainComponents(data, info.width, info.height, 20, 0.08);
  const b = trimBounds(data, info.width, info.height);
  if (!b) {
    console.warn("empty crop", outName);
    return;
  }
  await writeExtract(data, info.width, info.height, b, outName);
}

async function cropBlobs(srcName, outNames, minArea = 400) {
  const { data, info } = await loadKeyed(srcName);
  const blobs = findBlobs(data, info.width, info.height, minArea);
  blobs.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  if (blobs.length < outNames.length) {
    console.error("expected", outNames.length, "blobs in", srcName, "found", blobs.length);
    process.exit(1);
  }
  for (let i = 0; i < outNames.length; i++) {
    await writeExtract(data, info.width, info.height, blobs[i].bounds, outNames[i]);
  }
}

/** Shape blocks — bottom grass row only (gazebo is one blob above). */
async function cropShapeBlocks() {
  await cropTrim("lm-shapes.webp", "lm-shapes-blocks.webp", { l: 0.1, t: 0.74, w: 0.8, h: 0.22 });
}

/** Instrument cluster inside gazebo — skip outer frame blob. */
async function cropMusicInstruments() {
  const { data, info } = await loadKeyed("lm-music.webp");
  const h = info.height;
  const inner = findBlobs(data, info.width, h, 800)
    .filter((b) => b.cy > h * 0.35 && b.cy < h * 0.82 && b.area < h * h * 0.2)
    .sort((a, b) => b.area - a.area);
  const pick = inner.slice(0, 3);
  if (pick.length < 2) {
    return cropTrim("lm-music.webp", "lm-music-instruments.webp", {
      l: 0.22,
      t: 0.46,
      w: 0.56,
      h: 0.32,
    });
  }
  let minX = info.width,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (const b of pick) {
    minX = Math.min(minX, b.bounds.left);
    minY = Math.min(minY, b.bounds.top);
    maxX = Math.max(maxX, b.bounds.left + b.bounds.width);
    maxY = Math.max(maxY, b.bounds.top + b.bounds.height);
  }
  await writeExtract(data, info.width, h, {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  }, "lm-music-instruments.webp");
}

/** Chimes tubes — tall narrow blob above stump. */
async function cropChimes() {
  const { data, info } = await loadKeyed("lm-animalSounds.webp");
  const h = info.height;
  const chimes = findBlobs(data, info.width, h, 500)
    .filter((b) => {
      const ar = b.bounds.height / Math.max(1, b.bounds.width);
      return b.cy < h * 0.55 && ar > 0.9;
    })
    .sort((a, b) => b.area - a.area)[0];
  if (!chimes) {
    console.error("chimes blob not found");
    process.exit(1);
  }
  await writeExtract(data, info.width, h, chimes.bounds, "lm-animalSounds-chimes.webp");
}

await cropShapeBlocks();
// Lily pads are one connected vignette — split by horizontal thirds
await cropTrim("lm-counting.webp", "lm-counting-pad1.webp", { l: 0.02, t: 0.12, w: 0.31, h: 0.78 });
await cropTrim("lm-counting.webp", "lm-counting-pad2.webp", { l: 0.34, t: 0.12, w: 0.31, h: 0.78 });
await cropTrim("lm-counting.webp", "lm-counting-pad3.webp", { l: 0.66, t: 0.12, w: 0.31, h: 0.78 });
await cropMusicInstruments();
await cropChimes();
await cropTrim("lm-feed.webp", "lm-feed-basket.webp", { l: 0.14, t: 0.02, w: 0.72, h: 0.68 });
await cropTrim("lm-findFriend.webp", "lm-findFriend-birdhouse.webp", { l: 0.0, t: 0.05, w: 0.48, h: 0.92 });
await cropTrim("lm-findFriend.webp", "lm-findFriend-glass.webp", { l: 0.52, t: 0.08, w: 0.46, h: 0.88 });
await cropTrim("lm-colors.webp", "lm-colors-pots.webp", { l: 0.04, t: 0.22, w: 0.92, h: 0.38 });
await cropTrim("lm-gardenCare.webp", "lm-gardenCare-can.webp", { l: 0.05, t: 0.18, w: 0.88, h: 0.78 });
console.log("done");
