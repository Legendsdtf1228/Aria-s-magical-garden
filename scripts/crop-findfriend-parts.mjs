/**
 * Split Find Friend landmark into separate birdhouse + magnifying glass crops.
 */
import sharp from "sharp";
import { join } from "path";
import { existsSync } from "fs";

const LM = "public/art/landmarks";
const src = join(LM, "lm-findFriend.webp");
if (!existsSync(src)) {
  console.error("missing", src);
  process.exit(1);
}

const meta = await sharp(src).metadata();
const W = meta.width || 640;
const H = meta.height || 640;

await sharp(src)
  .extract({ left: 0, top: 0, width: Math.floor(W * 0.55), height: H })
  .webp({ quality: 86, alphaQuality: 100 })
  .toFile(join(LM, "lm-findFriend-birdhouse.webp"));

await sharp(src)
  .extract({ left: Math.floor(W * 0.45), top: 0, width: Math.floor(W * 0.55), height: H })
  .webp({ quality: 86, alphaQuality: 100 })
  .toFile(join(LM, "lm-findFriend-glass.webp"));

console.log("wrote birdhouse + glass");
