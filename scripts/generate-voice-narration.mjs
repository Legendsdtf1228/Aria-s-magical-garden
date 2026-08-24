/**
 * Offline bilingual narration generation via Cloudflare Workers AI
 * (elevenlabs/eleven-multilingual-v2).
 *
 * Auth: Wrangler OAuth (preferred) or CLOUDFLARE_API_TOKEN env.
 * Never puts credentials in the browser or the git repo.
 *
 * Usage:
 *   node scripts/generate-voice-narration.mjs --audition
 *   node scripts/generate-voice-narration.mjs --audition --force
 *   node scripts/generate-voice-narration.mjs --pack=audition --voice=<id>
 *
 * Requires: Cloudflare account with Workers AI access to ElevenLabs models.
 * Optional: CLOUDFLARE_ACCOUNT_ID (else parsed from `wrangler whoami`)
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MODEL = "elevenlabs/eleven-multilingual-v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const ACCOUNT_FALLBACK = "12822a682d486803b85d43ffdbc3c45d";

const require = createRequire(import.meta.url);

/** Warm, friendly female ElevenLabs voices suitable for toddler bilingual narration. */
export const AUDITION_VOICES = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    note: "Calm, clear, warm — strong bilingual baseline",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    note: "Soft, conversational, gentle encouragement",
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    name: "Matilda",
    note: "Storybook warmth — expressive without being sharp",
  },
];

/** Identical phrase IDs for EN + ES. Audition pack only (not full library). */
export const AUDITION_PHRASES = [
  {
    id: "welcomeMagical",
    en: "Welcome to your magical garden, Aria!",
    es: "¡Bienvenida a tu jardín mágico, Aria!",
  },
  {
    id: "findRedFlower",
    en: "Can you find the red flower?",
    es: "¿Puedes encontrar la flor roja?",
  },
  {
    id: "countOneToFour",
    en: "One, two, three, four!",
    es: "¡Uno, dos, tres, cuatro!",
  },
  {
    id: "greatJobAria",
    en: "Great job, Aria!",
    es: "¡Muy bien, Aria!",
  },
  {
    id: "tryAnother",
    en: "Let's try another one.",
    es: "Intentemos otra vez.",
  },
];

function parseArgs(argv) {
  const out = { force: false, audition: false, voice: null, pack: "audition" };
  for (const a of argv) {
    if (a === "--force") out.force = true;
    else if (a === "--audition") out.audition = true;
    else if (a.startsWith("--voice=")) out.voice = a.slice("--voice=".length);
    else if (a.startsWith("--pack=")) out.pack = a.slice("--pack=".length);
  }
  if (out.audition) out.pack = "audition";
  return out;
}

function loadDotEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function wranglerConfigPaths() {
  const home = homedir();
  const roaming = process.env.APPDATA || join(home, "AppData", "Roaming");
  return [
    join(roaming, "xdg.config", ".wrangler", "config", "default.toml"),
    join(home, ".wrangler", "config", "default.toml"),
    join(home, ".config", ".wrangler", "config", "default.toml"),
  ];
}

function readWranglerOauthToken() {
  for (const p of wranglerConfigPaths()) {
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8");
    const m = raw.match(/oauth_token\s*=\s*"([^"]+)"/);
    if (m?.[1]) return { token: m[1], source: "wrangler-oauth" };
  }
  return null;
}

function resolveAuth() {
  const envToken =
    process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "";
  if (envToken.trim()) {
    return { token: envToken.trim(), source: "env:CLOUDFLARE_API_TOKEN" };
  }
  const oauth = readWranglerOauthToken();
  if (oauth) return oauth;
  throw new Error(
    "No Cloudflare credentials. Run `npx wrangler login` or set CLOUDFLARE_API_TOKEN in a local .env (gitignored).",
  );
}

function isBillingError(err) {
  return (
    err?.code === 2021 ||
    err?.status === 402 ||
    /insufficient balance/i.test(err?.message || "")
  );
}

function resolveAccountId() {
  const fromEnv =
    process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "";
  if (fromEnv.trim()) return fromEnv.trim();
  try {
    const r = spawnSync("npx", ["wrangler", "whoami"], {
      cwd: ROOT,
      encoding: "utf8",
      shell: true,
    });
    const text = `${r.stdout || ""}\n${r.stderr || ""}`;
    const m = text.match(/\b([a-f0-9]{32})\b/i);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  return ACCOUNT_FALLBACK;
}

async function runTts({ token, accountId, text, voiceId, languageCode }) {
  const input = {
    text,
    voice_id: voiceId,
    language_code: languageCode,
    output_format: OUTPUT_FORMAT,
  };
  const attempts = [
    {
      name: "ai/run+model",
      url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`,
      body: { model: MODEL, input },
    },
    {
      name: "ai/run/@cf",
      url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/${MODEL}`,
      body: input,
    },
  ];

  let lastErr;
  for (const attempt of attempts) {
    const res = await fetch(attempt.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attempt.body),
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("audio") || contentType.includes("octet-stream")) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok) {
        lastErr = new Error(`TTS HTTP ${res.status}: binary error body (${buf.length} bytes)`);
        lastErr.status = res.status;
        continue;
      }
      return buf;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const err = json?.errors?.[0];
      const msg = err
        ? `${err.code || res.status}: ${err.message || JSON.stringify(err)}`
        : `HTTP ${res.status}`;
      const e = new Error(`Workers AI TTS failed — ${msg}`);
      e.code = err?.code;
      e.status = res.status;
      lastErr = e;
      // Try next endpoint shape on auth / not-found style failures
      if (res.status === 401 || res.status === 403 || err?.code === 10000 || res.status === 404) {
        continue;
      }
      throw e;
    }
    const audio = json?.result?.audio ?? json?.result?.response?.audio;
    if (!audio) {
      lastErr = new Error(
        `Workers AI returned no audio field. Keys: ${Object.keys(json?.result || json || {}).join(",")}`,
      );
      continue;
    }
    if (typeof audio === "string" && audio.startsWith("http")) {
      const aRes = await fetch(audio);
      if (!aRes.ok) throw new Error(`Failed to download audio URL: ${aRes.status}`);
      return Buffer.from(await aRes.arrayBuffer());
    }
    if (typeof audio === "string" && audio.startsWith("data:")) {
      const b64 = audio.replace(/^data:[^;]+;base64,/, "");
      return Buffer.from(b64, "base64");
    }
    if (typeof audio === "string") {
      return Buffer.from(audio, "base64");
    }
    lastErr = new Error("Unrecognized audio payload shape from Workers AI");
  }
  throw lastErr || new Error("Workers AI TTS failed on all endpoint shapes");
}

function ffmpegBin() {
  try {
    return require("ffmpeg-static");
  } catch {
    return null;
  }
}

/** Normalize loudness and strip long leading/trailing silence. */
function postProcessMp3(inputPath, outputPath) {
  const ff = ffmpegBin();
  if (!ff || !existsSync(ff)) {
    console.warn("ffmpeg-static missing — copying raw MP3 without normalize/trim");
    writeFileSync(outputPath, readFileSync(inputPath));
    return;
  }
  const filter =
    "silenceremove=start_periods=1:start_silence=0.15:start_threshold=-40dB:" +
    "stop_periods=1:stop_silence=0.2:stop_threshold=-40dB," +
    "loudnorm=I=-16:TP=-1.5:LRA=11";
  const r = spawnSync(
    ff,
    ["-y", "-i", inputPath, "-af", filter, "-codec:a", "libmp3lame", "-b:a", "128k", outputPath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.warn("ffmpeg post-process failed; using raw file\n", r.stderr?.slice(-400));
    writeFileSync(outputPath, readFileSync(inputPath));
  }
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function relPosix(abs) {
  return abs.replace(/\\/g, "/").replace(ROOT.replace(/\\/g, "/") + "/", "");
}

function emptyManifest({ authSource, accountId } = {}) {
  return {
    pack: "audition",
    model: MODEL,
    outputFormat: OUTPUT_FORMAT,
    generatedAt: new Date().toISOString(),
    authSource: authSource || "none",
    accountId: accountId || ACCOUNT_FALLBACK,
    voices: [...AUDITION_VOICES],
    phrases: AUDITION_PHRASES.map(({ id, en, es }) => ({ id, en, es })),
    entries: [],
  };
}

async function generateAudition({ force, voiceFilter }) {
  const auth = resolveAuth();
  const accountId = resolveAccountId();
  console.log(`Auth: ${auth.source}`);
  console.log(`Account: ${accountId}`);
  console.log(`Model: ${MODEL} / ${OUTPUT_FORMAT}`);

  const voices = voiceFilter
    ? AUDITION_VOICES.filter((v) => v.id === voiceFilter || v.name.toLowerCase() === voiceFilter.toLowerCase())
    : AUDITION_VOICES;
  if (!voices.length) throw new Error(`Unknown voice filter: ${voiceFilter}`);

  const generatedAt = new Date().toISOString();
  const manifest = {
    pack: "audition",
    model: MODEL,
    outputFormat: OUTPUT_FORMAT,
    generatedAt,
    authSource: auth.source,
    accountId,
    voices: [],
    phrases: AUDITION_PHRASES.map(({ id, en, es }) => ({ id, en, es })),
    entries: [],
  };

  const auditionRoot = join(ROOT, "public", "audio", "voice", "audition");
  ensureDir(auditionRoot);

  let billingBlocked = null;

  for (const voice of voices) {
    console.log(`\n=== Voice: ${voice.name} (${voice.id}) ===`);
    manifest.voices.push(voice);
    for (const phrase of AUDITION_PHRASES) {
      for (const { lang, code, text, folder } of [
        { lang: "en-US", code: "en", text: phrase.en, folder: "en-US" },
        { lang: "es-MX", code: "es", text: phrase.es, folder: "es-MX" },
      ]) {
        const dir = join(auditionRoot, voice.id, folder);
        ensureDir(dir);
        const fileName = `${phrase.id}.mp3`;
        const outPath = join(dir, fileName);
        const rel = `/audio/voice/audition/${voice.id}/${folder}/${fileName}`;
        const entry = {
          phraseId: phrase.id,
          text,
          language: lang,
          languageCode: code,
          filePath: rel,
          model: MODEL,
          voiceId: voice.id,
          voiceName: voice.name,
          generationDate: generatedAt,
        };

        if (existsSync(outPath) && !force) {
          console.log(`  skip ${rel}`);
          entry.reused = true;
          manifest.entries.push(entry);
          continue;
        }

        if (billingBlocked) {
          console.log(`  skip (billing) ${rel}`);
          continue;
        }

        console.log(`  gen  ${rel}`);
        try {
          const rawBuf = await runTts({
            token: auth.token,
            accountId,
            text,
            voiceId: voice.id,
            languageCode: code,
          });
          const tmp = join(dir, `.tmp-${phrase.id}.mp3`);
          writeFileSync(tmp, rawBuf);
          postProcessMp3(tmp, outPath);
          try {
            unlinkSync(tmp);
          } catch {
            /* ignore */
          }
          entry.reused = false;
          entry.bytes = readFileSync(outPath).length;
          manifest.entries.push(entry);
          await new Promise((r) => setTimeout(r, 250));
        } catch (err) {
          if (isBillingError(err)) {
            billingBlocked = err;
            console.error(`  BILLING BLOCK: ${err.message}`);
            continue;
          }
          throw err;
        }
      }
    }
  }

  const manifestPath = join(auditionRoot, "voice-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${relPosix(manifestPath)} (${manifest.entries.length} entries)`);

  if (billingBlocked) {
    const e = new Error(billingBlocked.message);
    e.code = billingBlocked.code;
    e.status = billingBlocked.status;
    e.manifest = manifest;
    e.billing = true;
    throw e;
  }
  return manifest;
}

function writeAuditionHtml(manifest) {
  const voices = manifest.voices?.length ? manifest.voices : AUDITION_VOICES;
  const phrases = manifest.phrases?.length
    ? manifest.phrases
    : AUDITION_PHRASES.map(({ id, en, es }) => ({ id, en, es }));
  const rows = phrases
    .map((p) => {
      const cells = voices
        .map((v) => {
          const en = `/audio/voice/audition/${v.id}/en-US/${p.id}.mp3`;
          const es = `/audio/voice/audition/${v.id}/es-MX/${p.id}.mp3`;
          return `<td class="plays">
            <button type="button" data-src="${en}">EN ▶</button>
            <button type="button" data-src="${es}">ES ▶</button>
          </td>`;
        })
        .join("");
      return `<tr>
        <th scope="row"><code>${p.id}</code><div class="txt"><span lang="en">${escapeHtml(p.en)}</span><span lang="es">${escapeHtml(p.es)}</span></div></th>
        ${cells}
      </tr>`;
    })
    .join("\n");

  const voiceHeads = voices
    .map(
      (v) =>
        `<th><strong>${escapeHtml(v.name)}</strong><div class="vid"><code>${v.id}</code></div><p>${escapeHtml(v.note)}</p></th>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aria Garden — Voice Audition</title>
  <style>
    :root { color-scheme: light; font-family: Georgia, "Times New Roman", serif; }
    body { margin: 0; padding: 24px; background: linear-gradient(180deg, #e8f6ff, #f7ffe8); color: #1f2a1a; }
    h1 { font-size: 1.6rem; margin: 0 0 0.35rem; }
    .sub { margin: 0 0 1.25rem; max-width: 52rem; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; background: #fffef8cc; box-shadow: 0 8px 24px #0001; }
    th, td { border: 1px solid #d5e0c8; padding: 12px; vertical-align: top; }
    thead th { background: #dff0c8; text-align: left; font-weight: 700; }
    .vid { font-size: 0.72rem; opacity: 0.75; margin: 4px 0; }
    thead p { margin: 0; font-weight: 400; font-size: 0.85rem; }
    .txt { display: grid; gap: 4px; margin-top: 6px; font-weight: 400; font-size: 0.92rem; }
    .txt [lang="es"] { opacity: 0.85; }
    .plays { white-space: nowrap; }
    button {
      margin: 0 4px 4px 0; padding: 8px 12px; border-radius: 999px; border: 0;
      background: #3f8f4d; color: #fff; font-weight: 700; cursor: pointer;
    }
    button:hover { filter: brightness(1.05); }
    button.playing { background: #c45c2a; }
    .meta { margin-top: 1rem; font-size: 0.85rem; opacity: 0.8; }
    #now { min-height: 1.2em; margin: 0.5rem 0 1rem; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Voice audition pack</h1>
  <p class="sub">Compare three warm female ElevenLabs voices (Cloudflare Workers AI · <code>${MODEL}</code>).
  Play English and Spanish for each phrase. Choose one voice_id for the full offline library.</p>
  <p id="now"></p>
  <table>
    <thead>
      <tr>
        <th>Phrase</th>
        ${voiceHeads}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="meta">Generated ${escapeHtml(manifest.generatedAt)} · Open via local app at <code>/voice-audition/</code> · Stop here for voice approval.</p>
  <script>
    const now = document.getElementById("now");
    let current = null;
    document.querySelectorAll("button[data-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src");
        if (current) { current.pause(); current = null; }
        document.querySelectorAll("button.playing").forEach((b) => b.classList.remove("playing"));
        const audio = new Audio(src);
        current = audio;
        btn.classList.add("playing");
        now.textContent = "Playing: " + src;
        audio.play().catch((e) => { now.textContent = "Play failed: " + e.message; });
        audio.onended = () => { btn.classList.remove("playing"); now.textContent = ""; };
      });
    });
  </script>
</body>
</html>
`;

  const outDir = join(ROOT, "public", "voice-audition");
  ensureDir(outDir);
  writeFileSync(join(outDir, "index.html"), html);
  console.log("Wrote public/voice-audition/index.html");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printBillingHelp() {
  console.error(
    "\nCloudflare Workers AI reported insufficient balance for ElevenLabs.\n" +
      "Add Workers AI / AI Gateway credits in the Cloudflare dashboard, then re-run:\n" +
      "  node scripts/generate-voice-narration.mjs --audition --force\n",
  );
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.pack !== "audition" && !args.audition) {
    console.error("Only --audition is enabled until a voice is approved.");
    process.exit(2);
  }

  let manifest;
  try {
    manifest = await generateAudition({ force: args.force, voiceFilter: args.voice });
  } catch (err) {
    if (err?.billing || isBillingError(err)) {
      printBillingHelp();
      console.error("Waiting 4s then retrying once…");
      await new Promise((r) => setTimeout(r, 4000));
      try {
        manifest = await generateAudition({ force: args.force, voiceFilter: args.voice });
      } catch (err2) {
        const partial = err2?.manifest || err?.manifest || emptyManifest({});
        writeAuditionHtml(partial);
        console.error("\n" + (err2.message || err.message));
        printBillingHelp();
        console.error(
          "Audition HTML scaffold written despite billing blocker. MP3 generation incomplete.",
        );
        process.exit(1);
      }
    } else {
      try {
        writeAuditionHtml(err?.manifest || emptyManifest({}));
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  writeAuditionHtml(manifest);
  console.log(
    "\nAudition pack ready. Open /voice-audition/ and pick a voice before full library generation.",
  );
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err) => {
    console.error("\n" + err.message);
    if (isBillingError(err)) printBillingHelp();
    process.exit(1);
  });
}
