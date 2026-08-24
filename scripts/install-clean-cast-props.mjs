/**
 * Install cleaned character idles + color props into public/art.
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

async function toIdle(srcName, destName, opts = {}) {
  const src = join(ASSETS, srcName);
  if (!existsSync(src)) throw new Error("missing " + src);
  let pipeline = sharp(src);
  const meta = await pipeline.metadata();
  if (opts.extractRight) {
    // Drop left contamination strip (~18% of width)
    const left = Math.round((meta.width || 512) * 0.18);
    const width = (meta.width || 512) - left;
    pipeline = sharp(src).extract({
      left,
      top: 0,
      width,
      height: meta.height || 512,
    });
  }
  await pipeline
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(join(CHAR, destName));
  console.log("idle", destName);
}

async function toProp(srcName, destName) {
  const src = join(ASSETS, srcName);
  if (!existsSync(src)) throw new Error("missing " + src);
  await sharp(src)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88 })
    .toFile(join(OBJ, destName));
  console.log("prop", destName);
}

// Backup contaminated originals once
for (const id of ["bird", "bee", "ladybug", "frog"]) {
  const p = join(CHAR, `${id}-idle.webp`);
  const bak = join(CHAR, `${id}-idle._contaminated.webp`);
  if (existsSync(p) && !existsSync(bak)) {
    await copyFile(p, bak);
    console.log("backed up", id);
  }
}

await toIdle("bird-idle-clean.png", "bird-idle.webp");
await toIdle("bee-idle-clean.png", "bee-idle.webp", { extractRight: true });
await toIdle("ladybug-idle-clean.png", "ladybug-idle.webp");
await toIdle("frog-idle-clean.png", "frog-idle.webp");

await toProp("prop-pot.png", "flower-pot.webp");
await toProp("prop-can.png", "watering-can.webp");
await toProp("prop-boots.png", "garden-boots.webp");
await toProp("prop-bed.png", "flower-bed.webp");

console.log("done");
