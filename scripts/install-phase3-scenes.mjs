/**
 * Convert Phase-3-fix generated murals into public/art/scenes WebPs.
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
const OUT = "public/art/scenes";
await mkdir(OUT, { recursive: true });

const jobs = [
  ["animal-meadow-landscape-v2.png", "animal-meadow-landscape.webp", 1440, 900],
  ["animal-meadow-portrait.png", "animal-meadow-portrait.webp", 390, 844],
  ["color-flower-patch-landscape.png", "color-flower-patch-landscape.webp", 1440, 900],
  ["color-flower-patch-portrait.png", "color-flower-patch-portrait.webp", 390, 844],
  ["counting-pond-landscape.png", "counting-pond-landscape.webp", 1440, 900],
  ["counting-pond-portrait.png", "counting-pond-portrait.webp", 390, 844],
];

for (const [srcName, destName, w, h] of jobs) {
  const src = join(ASSETS, srcName);
  if (!existsSync(src)) {
    console.error("MISSING", src);
    process.exit(1);
  }
  const dest = join(OUT, destName);
  await sharp(src)
    .resize(w, h, { fit: "cover", position: "centre" })
    .webp({ quality: 86 })
    .toFile(dest);
  console.log("wrote", dest);
}

// Keep legacy counting-pond.webp pointing at landscape for old refs
await copyFile(join(OUT, "counting-pond-landscape.webp"), join(OUT, "counting-pond.webp"));
console.log("updated counting-pond.webp from landscape");
