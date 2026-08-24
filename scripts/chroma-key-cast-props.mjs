/**
 * Make near-black (and optional near-white) backgrounds transparent, write WebP.
 */
import sharp from "sharp";
import { mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ASSETS =
  process.env.CURSOR_ASSETS ||
  join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets",
  );

const CHAR = "public/art/characters/painted-garden-v1";
const OBJ = "public/art/objects";
await mkdir(CHAR, { recursive: true });
await mkdir(OBJ, { recursive: true });

async function chromaToWebp(srcPath, destPath, { keyBlack = true, keyWhite = false, extractRight = false } = {}) {
  let img = sharp(srcPath);
  const meta = await img.metadata();
  if (extractRight) {
    const left = Math.round((meta.width || 512) * 0.18);
    img = sharp(srcPath).extract({
      left,
      top: 0,
      width: (meta.width || 512) - left,
      height: meta.height || 512,
    });
  }

  const { data, info } = await img
    .ensureAlpha()
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (keyBlack && r < 28 && g < 28 && b < 28) {
      data[i + 3] = 0;
    }
    if (keyWhite && r > 245 && g > 245 && b > 245) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(destPath);
  console.log("wrote", destPath);
}

await chromaToWebp(join(ASSETS, "bird-idle-clean.png"), join(CHAR, "bird-idle.webp"), { keyBlack: true });
await chromaToWebp(join(ASSETS, "bee-idle-clean.png"), join(CHAR, "bee-idle.webp"), {
  keyBlack: true,
  extractRight: true,
});
await chromaToWebp(join(ASSETS, "ladybug-idle-clean.png"), join(CHAR, "ladybug-idle.webp"), { keyBlack: true });
await chromaToWebp(join(ASSETS, "frog-idle-clean.png"), join(CHAR, "frog-idle.webp"), { keyBlack: true });

await chromaToWebp(join(ASSETS, "prop-pot.png"), join(OBJ, "flower-pot.webp"), {
  keyBlack: true,
  keyWhite: true,
});
await chromaToWebp(join(ASSETS, "prop-can.png"), join(OBJ, "watering-can.webp"), {
  keyBlack: true,
  keyWhite: true,
});
await chromaToWebp(join(ASSETS, "prop-boots.png"), join(OBJ, "garden-boots.webp"), {
  keyBlack: true,
  keyWhite: true,
});
await chromaToWebp(join(ASSETS, "prop-bed.png"), join(OBJ, "flower-bed.webp"), {
  keyBlack: true,
  keyWhite: true,
});

console.log("chroma key complete");
