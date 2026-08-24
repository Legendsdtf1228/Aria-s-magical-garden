import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIR = "Z:/public/art/characters/painted-garden-v1";

function isBlackOpaque(r, g, b, a) {
  return r < 20 && g < 20 && b < 20 && a > 200;
}

function cornerMajorityBlackPlate(data, width, height) {
  // Sample corner regions: 8x8 at each corner
  const s = Math.min(8, Math.floor(width / 4), Math.floor(height / 4));
  if (s < 1) return false;
  const corners = [
    [0, 0],
    [width - s, 0],
    [0, height - s],
    [width - s, height - s],
  ];
  let black = 0;
  let total = 0;
  for (const [ox, oy] of corners) {
    for (let y = oy; y < oy + s; y++) {
      for (let x = ox; x < ox + s; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        total++;
        if (isBlackOpaque(r, g, b, a)) black++;
      }
    }
  }
  return black / total >= 0.5;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith("-idle.webp"));
const rows = [];

for (const file of files.sort()) {
  const full = path.join(DIR, file);
  const { data, info } = await sharp(full)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let blackish = 0;
  let fullyTransparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) fullyTransparent++;
    if (isBlackOpaque(r, g, b, a)) blackish++;
  }
  const solidBlackPlate = cornerMajorityBlackPlate(data, width, height);
  rows.push({
    file,
    width,
    height,
    hasAlpha: channels === 4,
    blackishOpaque: blackish,
    fullyTransparent,
    solidBlackPlate,
  });
}

console.log(JSON.stringify(rows, null, 2));
