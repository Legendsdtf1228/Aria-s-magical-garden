import sharp from "sharp";
import { copyFile, access } from "fs/promises";
import { constants } from "fs";

const SRC =
  process.env.USERPROFILE +
  "/.cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets/bee-idle-clean-v2.png";
const DEST = "Z:/public/art/characters/painted-garden-v1/bee-idle.webp";
const BACKUP = "Z:/public/art/characters/painted-garden-v1/bee-idle._contaminated.webp";

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isNearGreen(r, g, b) {
  // #00FF00 and near-green chroma
  if (g >= 200 && r <= 80 && b <= 80) return true;
  if (g >= 140 && g - r >= 50 && g - b >= 50) return true;
  const dr = r - 0;
  const dg = g - 255;
  const db = b - 0;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  return dist < 90;
}

if (!(await exists(BACKUP))) {
  await copyFile(DEST, BACKUP);
  console.log("backed up to", BACKUP);
} else {
  console.log("backup already exists:", BACKUP);
}

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .raw()
  .toBuffer({ resolveWithObject: true });

let keyed = 0;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (isNearGreen(r, g, b)) {
    data[i + 3] = 0;
    keyed++;
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(DEST);

console.log(JSON.stringify({ wrote: DEST, keyedPixels: keyed, size: info }, null, 2));

// quick verify
const v = await sharp(DEST).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let transparent = 0;
let blackish = 0;
let greenish = 0;
for (let i = 0; i < v.data.length; i += 4) {
  const r = v.data[i], g = v.data[i + 1], b = v.data[i + 2], a = v.data[i + 3];
  if (a === 0) transparent++;
  if (r < 20 && g < 20 && b < 20 && a > 200) blackish++;
  if (a > 200 && g >= 140 && g - r >= 50 && g - b >= 50) greenish++;
}
console.log(JSON.stringify({ verify: { transparent, blackish, remainingGreenOpaque: greenish } }, null, 2));
