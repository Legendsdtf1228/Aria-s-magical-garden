/**
 * Placement review composites — bunny hop waypoints + frog lily/ripple.
 * Env stays creature-free; characters are cast-v2 transparent overlays.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const scenes = "public/art/scenes";
const chars = "public/art/characters";
const out = "docs/review/placement";

const ROUTES = {
  landscape: {
    bunny: [
      { x: 0.22, y: 0.76, scale: 1 },
      { x: 0.3, y: 0.72, scale: 0.94 },
      { x: 0.4, y: 0.68, scale: 0.88 },
    ],
    bunnyBase: 0.155,
    frogPads: [
      { x: 0.68, y: 0.72, scale: 1 },
      { x: 0.76, y: 0.7, scale: 0.92 },
    ],
    frogBase: 0.095,
  },
  portrait: {
    bunny: [
      { x: 0.34, y: 0.82, scale: 1 },
      { x: 0.42, y: 0.72, scale: 0.92 },
      { x: 0.5, y: 0.64, scale: 0.84 },
    ],
    bunnyBase: 0.14,
    frogPads: [
      { x: 0.8, y: 0.72, scale: 1 },
      { x: 0.86, y: 0.7, scale: 0.9 },
    ],
    frogBase: 0.065,
  },
};

async function sprite(id, size) {
  return sharp(join(chars, `${id}-idle-cast-v2.webp`))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

function shadowSvg(w, h, water = false) {
  const fill = water ? "rgba(10,48,72,0.35)" : "rgba(26,24,8,0.35)";
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${w / 2}" cy="${h * 0.92}" rx="${w * 0.28}" ry="${h * 0.06}" fill="${fill}"/>
    </svg>`,
  );
}

function rippleSvg(w, h) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${w / 2}" cy="${h * 0.9}" rx="${w * 0.22}" ry="${h * 0.08}" fill="none" stroke="#7ec8ff" stroke-width="3" opacity="0.85"/>
      <ellipse cx="${w / 2}" cy="${h * 0.9}" rx="${w * 0.34}" ry="${h * 0.12}" fill="none" stroke="#b8e4ff" stroke-width="2" opacity="0.55"/>
      <circle cx="${w * 0.42}" cy="${h * 0.78}" r="4" fill="#dff4ff"/>
      <circle cx="${w * 0.58}" cy="${h * 0.76}" r="3" fill="#dff4ff"/>
      <circle cx="${w * 0.5}" cy="${h * 0.72}" r="3" fill="#dff4ff"/>
    </svg>`,
  );
}

function titleSvg(w, portrait) {
  if (portrait) {
    return Buffer.from(`<svg width="${w}" height="110" xmlns="http://www.w3.org/2000/svg">
      <text x="12" y="42" font-family="Trebuchet MS,sans-serif" font-size="28" font-weight="900" fill="#fffef8" stroke="#1a2a18" stroke-width="5" paint-order="stroke">Aria's</text>
      <text x="12" y="78" font-family="Trebuchet MS,sans-serif" font-size="28" font-weight="900" fill="#ffe27a" stroke="#3a2808" stroke-width="5" paint-order="stroke">Magical Garden</text>
    </svg>`);
  }
  return Buffer.from(`<svg width="${w}" height="140" xmlns="http://www.w3.org/2000/svg">
    <text x="${w / 2}" y="58" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="54" font-weight="900" fill="#fffef8" stroke="#1a2a18" stroke-width="6" paint-order="stroke">Aria's</text>
    <text x="${w / 2}" y="118" text-anchor="middle" font-family="Trebuchet MS,sans-serif" font-size="54" font-weight="900" fill="#ffe27a" stroke="#3a2808" stroke-width="6" paint-order="stroke">Magical Garden</text>
  </svg>`);
}

async function compose(aspect, w, h, overlays, name) {
  const env =
    aspect === "landscape"
      ? join(scenes, "welcome-garden-landscape.webp")
      : join(scenes, "welcome-garden-portrait.webp");
  const base = await sharp(env).resize(w, h, { fit: "cover" }).ensureAlpha().png().toBuffer();
  await sharp(base).composite(overlays).png().toFile(join(out, name));
  console.log("wrote", name);
}

await mkdir(out, { recursive: true });

async function buildAspect(aspect, w, h) {
  const R = ROUTES[aspect];
  const labels = ["start", "middle", "end"];

  for (let i = 0; i < 3; i++) {
    const pt = R.bunny[i];
    const size = Math.round(h * R.bunnyBase * (pt.scale || 1));
    const left = Math.max(0, Math.round(pt.x * w - size / 2));
    const top = Math.max(0, Math.round(pt.y * h - size));
    const sh = await sharp(shadowSvg(size, size, false)).png().toBuffer();
    const bun = await sprite("bunny", size);
    const title = await sharp(titleSvg(w, aspect === "portrait")).png().toBuffer();
    await compose(
      aspect,
      w,
      h,
      [
        { input: title, left: 0, top: aspect === "portrait" ? 14 : 16 },
        { input: sh, left, top },
        { input: bun, left, top },
      ],
      `P-bunny-${labels[i]}-${aspect}.png`,
    );
  }

  {
    const pt = R.frogPads[0];
    const size = Math.round(h * R.frogBase * (pt.scale || 1));
    const left = Math.max(0, Math.round(pt.x * w - size / 2));
    const top = Math.max(0, Math.round(pt.y * h - size));
    const sh = await sharp(shadowSvg(size, size, true)).png().toBuffer();
    const fr = await sprite("frog", size);
    const title = await sharp(titleSvg(w, aspect === "portrait")).png().toBuffer();
    await compose(
      aspect,
      w,
      h,
      [
        { input: title, left: 0, top: aspect === "portrait" ? 14 : 16 },
        { input: sh, left, top },
        { input: fr, left, top },
      ],
      `P-frog-home-${aspect}.png`,
    );
  }

  {
    const pt = R.frogPads[1];
    const size = Math.round(h * R.frogBase * (pt.scale || 1));
    const left = Math.max(0, Math.round(pt.x * w - size / 2));
    const top = Math.max(0, Math.round(pt.y * h - size));
    const sh = await sharp(shadowSvg(size, size, true)).png().toBuffer();
    const rip = await sharp(rippleSvg(size, size)).png().toBuffer();
    const fr = await sprite("frog", size);
    const title = await sharp(titleSvg(w, aspect === "portrait")).png().toBuffer();
    await compose(
      aspect,
      w,
      h,
      [
        { input: title, left: 0, top: aspect === "portrait" ? 14 : 16 },
        { input: sh, left, top },
        { input: rip, left, top },
        { input: fr, left, top },
      ],
      `P-frog-landing-ripple-${aspect}.png`,
    );
  }

  {
    const overlays = [];
    const title = await sharp(titleSvg(w, aspect === "portrait")).png().toBuffer();
    overlays.push({ input: title, left: 0, top: aspect === "portrait" ? 14 : 16 });

    const bunny = R.bunny[1];
    const bSize = Math.round(h * R.bunnyBase * (bunny.scale || 1));
    const bLeft = Math.max(0, Math.round(bunny.x * w - bSize / 2));
    const bTop = Math.max(0, Math.round(bunny.y * h - bSize));
    overlays.push({ input: await sharp(shadowSvg(bSize, bSize)).png().toBuffer(), left: bLeft, top: bTop });
    overlays.push({ input: await sprite("bunny", bSize), left: bLeft, top: bTop });

    const frog = R.frogPads[0];
    const fSize = Math.round(h * R.frogBase * (frog.scale || 1));
    const fLeft = Math.max(0, Math.round(frog.x * w - fSize / 2));
    const fTop = Math.max(0, Math.round(frog.y * h - fSize));
    overlays.push({
      input: await sharp(shadowSvg(fSize, fSize, true)).png().toBuffer(),
      left: fLeft,
      top: fTop,
    });
    overlays.push({ input: await sprite("frog", fSize), left: fLeft, top: fTop });

    await compose(aspect, w, h, overlays, `P-welcome-confirm-${aspect}.png`);
  }
}

await buildAspect("landscape", 1440, 900);
await buildAspect("portrait", 390, 844);

await writeFile(
  join(out, "PLACEMENT-NOTES.json"),
  JSON.stringify(
    {
      routes: [
        "bunnyGardenPath",
        "frogLilyPads",
        "butterflyFlowerLoop",
        "birdBranchRoute",
        "ladybugLeafPath",
        "beeFlowerRoute",
        "catCottageArea",
        "puppyMeadowArea",
      ],
      bunny: "Feet on path; separate cast-v2 sprite; not baked into env",
      frog: "Sitting on lily pad; landing shows ripple; separate cast-v2 sprite",
      env: "welcome-garden-* / garden-map-* remain creature-free",
    },
    null,
    2,
  ),
);

console.log("Placement review pack complete →", out);
