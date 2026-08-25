/**
 * Slice POC hub landmarks v2 into public/art/landmarks.
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
const OUT = "public/art/landmarks";
await mkdir(OUT, { recursive: true });

const src = join(ASSETS, "poc-hub-landmarks-v2.png");
if (!existsSync(src)) {
  console.error("MISSING", src);
  process.exit(1);
}

const meta = await sharp(src).metadata();
const W = meta.width || 1024;
const H = meta.height || 1024;
const cols = 3;
const cellW = Math.floor(W / cols);
const names = ["landmark-findFriend.webp", "landmark-feed.webp", "landmark-freePlay.webp"];

for (let i = 0; i < 3; i++) {
  const pad = Math.floor(cellW * 0.04);
  const left = i * cellW + pad;
  const { data, info } = await sharp(src)
    .extract({ left, top: pad, width: cellW - pad * 2, height: H - pad * 2 })
    .ensureAlpha()
    .resize(640, 640, { fit: "contain", background: { r: 0, g: 255, b: 0, alpha: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let p = 0; p < data.length; p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    if (g > 160 && g > r + 40 && g > b + 40) data[p + 3] = 0;
  }
  const dest = join(OUT, names[i]);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(dest);
  console.log("wrote", dest);
}
