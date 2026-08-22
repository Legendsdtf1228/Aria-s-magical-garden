/**
 * Install storybook-v4 review gate (unified painted welcomes + anim sheets).
 * Does not reuse cast-v2 / storybook-v3 layered composites.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const assets =
  "C:/Users/Mark/.cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets";
const out = "docs/review/storybook-v4";
const char = "public/art/characters/storybook-v4";

await mkdir(out, { recursive: true });
await mkdir(char, { recursive: true });

async function chromaPng(src, destPng, destWebp) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if ((g > 200 && r < 120 && b < 120) || (g > r + 40 && g > b + 40 && g > 150)) {
      data[i + 3] = 0;
    }
  }
  const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  await img.clone().png().toFile(destPng);
  await sharp(destPng).webp({ quality: 92 }).toFile(destWebp);
}

await chromaPng(
  join(assets, "bunny-anim-sheet-v4.png"),
  join(out, "bunny-anim-sheet-v4.png"),
  join(char, "bunny-anim-sheet-v4.webp"),
);
await chromaPng(
  join(assets, "frog-anim-sheet-v4.png"),
  join(out, "frog-anim-sheet-v4.png"),
  join(char, "frog-anim-sheet-v4.webp"),
);

await sharp(join(assets, "welcome-unified-landscape-v4.png"))
  .resize(1440, 900, { fit: "cover" })
  .png()
  .toFile(join(out, "V4-welcome-landscape-bunny-frog.png"));

await sharp(join(assets, "welcome-unified-portrait-v4b.png"))
  .resize(390, 844, { fit: "cover" })
  .png()
  .toFile(join(out, "V4-welcome-portrait-bunny-frog.png"));

await writeFile(
  join(out, "REVIEW-GATE.json"),
  JSON.stringify(
    {
      status: "AWAITING_VISUAL_APPROVAL",
      approach:
        "Unified painted welcome scenes (single illustration) + matching animation sprite sheets. Not layered clip-art.",
      rejected: [
        "cast-v2 sticker cast",
        "storybook-v3 layered composites",
        "02-character-layer-strip",
        "R3/R4/R5",
        "pink flower Play",
        "heavy outlined title",
      ],
      deliverables: [
        "bunny-anim-sheet-v4.png",
        "frog-anim-sheet-v4.png",
        "V4-welcome-landscape-bunny-frog.png",
        "V4-welcome-portrait-bunny-frog.png",
      ],
      deferred: ["butterfly", "bird", "puppy", "other friends", "full animation wiring"],
    },
    null,
    2,
  ),
);

console.log("storybook-v4 review gate ready →", out);
