/**
 * Install painted-garden-v1 cast from chroma sheet + crop idle frames from bunny/frog sheets.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const assets =
  "C:/Users/Mark/.cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets";
const out = "public/art/characters/painted-garden-v1";
const review = "docs/review/v5";

await mkdir(out, { recursive: true });
await mkdir(review, { recursive: true });

async function chromaBuffer(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if ((g > 200 && r < 120 && b < 120) || (g > r + 40 && g > b + 40 && g > 150)) data[i + 3] = 0;
  }
  return { data, info };
}

function extractCell(data, info, index, n) {
  const cell = Math.floor(info.width / n);
  const left = index * cell;
  const width = index === n - 1 ? info.width - left : cell;
  const outBuf = Buffer.alloc(width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    data.copy(outBuf, y * width * 4, (y * info.width + left) * 4, (y * info.width + left + width) * 4);
  }
  return { data: outBuf, width, height: info.height };
}

async function saveSprite(raw, name) {
  const buf = await sharp(raw.data, {
    raw: { width: raw.width, height: raw.height, channels: 4 },
  })
    .trim({ threshold: 6 })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92 })
    .toBuffer();
  await sharp(buf).toFile(join(out, `${name}-idle.webp`));
  console.log("sprite", name);
}

// Full cast sheet (8)
{
  const { data, info } = await chromaBuffer(join(assets, "cast-painted-garden-v1.png"));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(join(review, "cast-sheet-painted-garden-v1.png"));
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 92 })
    .toFile(join(out, "cast-sheet.webp"));

  const names = ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"];
  for (let i = 0; i < 8; i++) {
    await saveSprite(extractCell(data, info, i, 8), names[i]);
  }
}

// Prefer bunny/frog idle from approved anim sheets (frame 0)
for (const [file, name] of [
  ["bunny-anim-sheet-v4.png", "bunny"],
  ["frog-anim-sheet-v4.png", "frog"],
]) {
  const sheetPath = join(out, file);
  const src = join(assets, file.replace("painted", "").includes("bunny") ? "bunny-anim-sheet-v4.png" : "frog-anim-sheet-v4.png");
  try {
    const { data, info } = await chromaBuffer(src);
    await saveSprite(extractCell(data, info, 0, 7), name);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .webp({ quality: 92 })
      .toFile(join(out, `${name}-anim-sheet.webp`));
  } catch (e) {
    console.warn("anim sheet", name, e.message);
  }
}

await writeFile(
  join(review, "PHASE-STATUS.json"),
  JSON.stringify(
    {
      characterSetVersion: "painted-garden-v1",
      phase1: "ActivityShell hills/SVG friends removed",
      phase2: "cast + bunny/frog sheets installed",
      note: "Visual approval still required for screenshots",
    },
    null,
    2,
  ),
);

console.log("painted-garden-v1 installed");
