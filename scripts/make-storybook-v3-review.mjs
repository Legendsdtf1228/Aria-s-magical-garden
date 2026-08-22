/**
 * Storybook-v3 review gate:
 * 1) bunny sprite sheet
 * 2) frog sprite sheet
 * 3) landscape welcome (bunny + frog only)
 * 4) portrait welcome (bunny + frog only)
 *
 * Chroma-keys #00FF00 sheets. Does NOT reuse cast-v2.
 */
import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "fs/promises";
import { join } from "path";

const assetsRoot =
  "C:/Users/Mark/.cursor/projects/c-Users-Mark-Aria-s-Magical-Garden-Aria-Color-Garden-Cursor-Aria-Color-Garden/assets";
const outDir = "docs/review/storybook-v3";
const charDir = "public/art/characters/storybook-v3";
const scenes = "public/art/scenes";

await mkdir(outDir, { recursive: true });
await mkdir(charDir, { recursive: true });

async function chromaKeyToRgba(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // green screen — keep characters (not highly green-dominant)
    const greenDom = g > r + 35 && g > b + 35 && g > 140;
    const nearKey = g > 200 && r < 120 && b < 120;
    if (nearKey || greenDom) {
      data[i + 3] = 0;
    }
  }
  return { data, info };
}

async function saveSheet(srcName, destBase) {
  const src = join(assetsRoot, srcName);
  const { data, info } = await chromaKeyToRgba(src);
  const pngBuf = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  await sharp(pngBuf).toFile(join(charDir, `${destBase}.png`));
  await sharp(pngBuf).webp({ quality: 92 }).toFile(join(charDir, `${destBase}.webp`));
  await sharp(pngBuf)
    .resize(1600, null, { fit: "inside" })
    .png()
    .toFile(join(outDir, `${destBase}.png`));
  return { data, info, pngBuf };
}

function extractFrame(data, info, index, frames = 7) {
  const cell = Math.floor(info.width / frames);
  const left = index * cell;
  const width = index === frames - 1 ? info.width - left : cell;
  // copy region
  const out = Buffer.alloc(width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    const srcStart = (y * info.width + left) * 4;
    const dstStart = y * width * 4;
    data.copy(out, dstStart, srcStart, srcStart + width * 4);
  }
  return { data: out, width, height: info.height };
}

async function frameToPng(frame, maxH) {
  return sharp(frame.data, {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .resize({ height: maxH, fit: "inside" })
    .png()
    .toBuffer();
}

console.log("Processing bunny sheet…");
const bunny = await saveSheet("bunny-anim-sheet-v3.png", "bunny-anim-sheet-v3");
console.log("Processing frog sheet…");
const frog = await saveSheet("frog-anim-sheet-v3.png", "frog-anim-sheet-v3");

// Gate asset
{
  const { data, info } = await chromaKeyToRgba(join(assetsRoot, "play-gate-v3.png"));
  const gate = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
  await sharp(gate).webp({ quality: 92 }).toFile(join(charDir, "play-gate-v3.webp"));
  await sharp(gate).png().toFile(join(charDir, "play-gate-v3.png"));
}

// Idle / sit frames for composition
const bunnyStand = await frameToPng(extractFrame(bunny.data, bunny.info, 0), 220);
const frogSit = await frameToPng(extractFrame(frog.data, frog.info, 0), 140);
await sharp(bunnyStand).webp({ quality: 92 }).toFile(join(charDir, "bunny-stand-v3.webp"));
await sharp(frogSit).webp({ quality: 92 }).toFile(join(charDir, "frog-sit-v3.webp"));

function titleSvg(w, portrait) {
  // Cream/warm yellow fill, soft dark-green shadow — no heavy black outline
  if (portrait) {
    return Buffer.from(`<svg width="${w}" height="120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#1e3a24" flood-opacity="0.45"/>
        </filter>
      </defs>
      <text x="16" y="48" font-family="Georgia, 'Palatino Linotype', serif" font-size="34" font-weight="700"
        fill="#fff6d6" filter="url(#soft)">Aria's</text>
      <text x="16" y="92" font-family="Georgia, 'Palatino Linotype', serif" font-size="32" font-weight="700"
        fill="#ffe9a0" filter="url(#soft)">Magical Garden</text>
    </svg>`);
  }
  return Buffer.from(`<svg width="${w}" height="130" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1e3a24" flood-opacity="0.4"/>
      </filter>
    </defs>
    <text x="${w / 2}" y="52" text-anchor="middle" font-family="Georgia, 'Palatino Linotype', serif" font-size="52" font-weight="700"
      fill="#fff6d6" filter="url(#soft)">Aria's Magical Garden</text>
  </svg>`);
}

async function compose(aspect, w, h, name) {
  const env =
    aspect === "landscape"
      ? join(scenes, "welcome-garden-landscape.webp")
      : join(scenes, "welcome-garden-portrait.webp");
  const base = await sharp(env).resize(w, h, { fit: "cover" }).ensureAlpha().png().toBuffer();

  // Placement: bunny on path, frog on lily pad (storybook-v3 coords)
  const place =
    aspect === "landscape"
      ? {
          bunny: { x: 0.26, y: 0.74, h: 168 },
          frog: { x: 0.72, y: 0.73, h: 118 },
          // beside path, left of bridge — never covering bridge/animals
          gate: { x: 0.4, y: 0.86, h: 140 },
        }
      : {
          bunny: { x: 0.36, y: 0.78, h: 130 },
          frog: { x: 0.8, y: 0.72, h: 95 },
          gate: { x: 0.2, y: 0.9, h: 105 },
        };

  const bunnyImg = await sharp(bunnyStand)
    .resize({ height: place.bunny.h, fit: "inside" })
    .png()
    .toBuffer();
  const frogImg = await sharp(frogSit)
    .resize({ height: place.frog.h, fit: "inside" })
    .png()
    .toBuffer();
  const gateImg = await sharp(join(charDir, "play-gate-v3.png"))
    .resize({ height: place.gate.h, fit: "inside" })
    .png()
    .toBuffer();

  const bMeta = await sharp(bunnyImg).metadata();
  const fMeta = await sharp(frogImg).metadata();
  const gMeta = await sharp(gateImg).metadata();

  const overlays = [
    {
      input: await sharp(titleSvg(w, aspect === "portrait")).png().toBuffer(),
      left: 0,
      top: aspect === "portrait" ? 18 : 22,
    },
    {
      input: bunnyImg,
      left: Math.max(0, Math.round(place.bunny.x * w - bMeta.width / 2)),
      top: Math.max(0, Math.round(place.bunny.y * h - bMeta.height)),
    },
    {
      input: frogImg,
      left: Math.max(0, Math.round(place.frog.x * w - fMeta.width / 2)),
      top: Math.max(0, Math.round(place.frog.y * h - fMeta.height)),
    },
    {
      input: gateImg,
      left: Math.max(0, Math.round(place.gate.x * w - gMeta.width / 2)),
      top: Math.max(0, Math.round(place.gate.y * h - gMeta.height)),
    },
  ];

  await sharp(base)
    .composite(overlays)
    .png()
    .toFile(join(outDir, name));
  console.log("wrote", name);
}

await compose("landscape", 1440, 900, "V3-welcome-landscape-bunny-frog.png");
await compose("portrait", 390, 844, "V3-welcome-portrait-bunny-frog.png");

await writeFile(
  join(outDir, "REVIEW-GATE.json"),
  JSON.stringify(
    {
      status: "AWAITING_VISUAL_APPROVAL",
      rejected: [
        "cast-v2 / cast-v1 character assets (quarantined)",
        "R3 cast sheet",
        "R4/R5 composed welcomes",
        "02-character-layer-strip",
        "pink flower Play button",
        "heavy outlined title",
      ],
      deliverables: [
        "bunny-anim-sheet-v3.png",
        "frog-anim-sheet-v3.png",
        "V3-welcome-landscape-bunny-frog.png",
        "V3-welcome-portrait-bunny-frog.png",
      ],
      notes:
        "Bunny + frog only. Butterfly/bird/puppy deferred. Soft storybook paint; no sticker outlines. Title: cream fill + soft green shadow. Play: wooden flower gate.",
    },
    null,
    2,
  ),
);

console.log("Review gate pack ready →", outDir);
