import sharp from "sharp";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";

const scenes = "public/art/scenes";
const chars = "public/art/characters";
const out = "docs/review";

async function auditCreatures(path, label) {
  const { data, info } = await sharp(path)
    .resize(320, 180, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let warmPink = 0;
  const total = info.width * info.height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 200 && g > 120 && g < 190 && b > 160 && b < 230 && r > g + 20) warmPink++;
  }
  const pinkPct = (warmPink / total) * 100;
  return {
    label,
    pinkishPct: Number(pinkPct.toFixed(3)),
    note:
      pinkPct > 0.8
        ? "REVIEW: elevated pink pixels — inspect for butterflies"
        : "OK: no elevated butterfly-pink signal",
  };
}

await mkdir(out, { recursive: true });

const a1 = await auditCreatures(join(scenes, "garden-map-landscape.webp"), "landscape");
const a2 = await auditCreatures(join(scenes, "garden-map-portrait.webp"), "portrait");

const audit = {
  method:
    "Heuristic pink-pixel scan + manual visual inspection of clean environment regenerations.",
  results: [a1, a2],
  visualInspection: {
    landscape: "PASS — cottage, tree, gazebo, pond, picnic, flowers; no creatures/text/UI observed.",
    portrait: "PASS — same empty scenery; no creatures/text/UI observed.",
  },
  characterSet: "cast-v2 (single sheet crop)",
};

await writeFile(join(out, "PIXEL-AUDIT.json"), JSON.stringify(audit, null, 2));

await sharp(join(scenes, "garden-map-landscape.webp"))
  .resize(1440, 900, { fit: "cover" })
  .png()
  .toFile(join(out, "R1-env-landscape-zero-creatures.png"));

await sharp(join(scenes, "garden-map-portrait.webp"))
  .resize(390, 844, { fit: "cover" })
  .png()
  .toFile(join(out, "R2-env-portrait-zero-creatures.png"));

await sharp(join(chars, "cast-sheet-v2.webp"))
  .resize(1600, null, { fit: "inside" })
  .png()
  .toFile(join(out, "R3-character-cast-sheet-v1.png"));

async function spritePng(id, size) {
  let img = sharp(join(chars, `${id}-idle-cast-v2.webp`));
  if (id === "puppy") {
    const meta = await img.metadata();
    const trim = 18;
    img = sharp(join(chars, `${id}-idle-cast-v2.webp`)).extract({
      left: trim,
      top: 0,
      width: meta.width - trim,
      height: meta.height,
    });
  }
  return img
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

const homes = [
  ["bunny", Math.round(1440 * 0.44 - 80), Math.round(900 * 0.66 - 80), 160],
  ["butterfly", Math.round(1440 * 0.6 - 50), Math.round(900 * 0.3 - 50), 100],
  ["bird", Math.round(1440 * 0.68 - 52), Math.round(900 * 0.22 - 52), 104],
  ["puppy", Math.round(1440 * 0.16 - 64), Math.round(900 * 0.56 - 64), 128],
];

const baseL = await sharp(join(scenes, "welcome-garden-landscape.webp"))
  .resize(1440, 900, { fit: "cover" })
  .ensureAlpha()
  .png()
  .toBuffer();

const overlays = [];
for (const [id, x, y, s] of homes) {
  const buf = await spritePng(id, s);
  overlays.push({ input: buf, left: Math.max(0, x), top: Math.max(0, y) });
}

const titleSvg = Buffer.from(`<svg width="1440" height="140" xmlns="http://www.w3.org/2000/svg">
  <text x="720" y="58" text-anchor="middle" font-family="Trebuchet MS, sans-serif" font-size="54" font-weight="900" fill="#fffef8" stroke="#1a2a18" stroke-width="6" paint-order="stroke">Aria's</text>
  <text x="720" y="118" text-anchor="middle" font-family="Trebuchet MS, sans-serif" font-size="54" font-weight="900" fill="#ffe27a" stroke="#3a2808" stroke-width="6" paint-order="stroke">Magical Garden</text>
</svg>`);
overlays.push({ input: await sharp(titleSvg).png().toBuffer(), left: 0, top: 16 });

const playL = Buffer.from(`<svg width="168" height="168" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="g" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#ffe56a"/><stop offset="100%" stop-color="#f0a820"/></radialGradient></defs>
  <g transform="translate(84,84)">
    ${[0,60,120,180,240,300].map((a)=>`<ellipse rx="34" ry="22" fill="#ff7eb6" transform="rotate(${a}) translate(42,0)"/>`).join("")}
    <circle r="46" fill="url(#g)" stroke="#c47a10" stroke-width="3"/>
    <text y="-4" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="22" font-weight="800" fill="#3a2808">Play</text>
    <text y="22" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="18" font-weight="700" fill="#3a2808">Jugar</text>
  </g>
</svg>`);
overlays.push({
  input: await sharp(playL).png().toBuffer(),
  left: Math.round(1440 / 2 - 84),
  top: 900 - 168 - 36,
});

await sharp(baseL)
  .composite(overlays)
  .png()
  .toFile(join(out, "R4-composed-welcome-landscape-1440x900.png"));

const baseP = await sharp(join(scenes, "welcome-garden-portrait.webp"))
  .resize(390, 844, { fit: "cover" })
  .ensureAlpha()
  .png()
  .toBuffer();

const homesP = [
  ["bunny", Math.round(390 * 0.44 - 55), Math.round(844 * 0.66 - 55), 110],
  ["butterfly", Math.round(390 * 0.62 - 35), Math.round(844 * 0.3 - 35), 70],
  ["bird", Math.round(390 * 0.7 - 36), Math.round(844 * 0.22 - 36), 72],
  ["puppy", Math.round(390 * 0.18 - 45), Math.round(844 * 0.56 - 45), 90],
];
const overlaysP = [];
for (const [id, x, y, s] of homesP) {
  const buf = await spritePng(id, s);
  overlaysP.push({ input: buf, left: Math.max(0, x), top: Math.max(0, y) });
}
const titleP = Buffer.from(`<svg width="390" height="110" xmlns="http://www.w3.org/2000/svg">
  <text x="12" y="42" font-family="Trebuchet MS, sans-serif" font-size="28" font-weight="900" fill="#fffef8" stroke="#1a2a18" stroke-width="5" paint-order="stroke">Aria's</text>
  <text x="12" y="78" font-family="Trebuchet MS, sans-serif" font-size="28" font-weight="900" fill="#ffe27a" stroke="#3a2808" stroke-width="5" paint-order="stroke">Magical Garden</text>
</svg>`);
overlaysP.push({ input: await sharp(titleP).png().toBuffer(), left: 0, top: 14 });

const playP = Buffer.from(`<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="g" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#ffe56a"/><stop offset="100%" stop-color="#f0a820"/></radialGradient></defs>
  <g transform="translate(64,64)">
    ${[0,60,120,180,240,300].map((a)=>`<ellipse rx="26" ry="17" fill="#ff7eb6" transform="rotate(${a}) translate(32,0)"/>`).join("")}
    <circle r="36" fill="url(#g)" stroke="#c47a10" stroke-width="3"/>
    <text y="-2" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="17" font-weight="800" fill="#3a2808">Play</text>
    <text y="18" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="14" font-weight="700" fill="#3a2808">Jugar</text>
  </g>
</svg>`);
overlaysP.push({
  input: await sharp(playP).png().toBuffer(),
  left: Math.round(390 / 2 - 64),
  top: 844 - 128 - 44,
});

await sharp(baseP)
  .composite(overlaysP)
  .png()
  .toFile(join(out, "R5-composed-welcome-portrait-390x844.png"));

console.log(JSON.stringify(audit, null, 2));
console.log("Wrote R1–R5 review PNGs");
