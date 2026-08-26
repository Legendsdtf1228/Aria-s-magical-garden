/**
 * Verify deployed assets return HTTP 200 + report git SHA.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.REVIEW_URL?.replace(/\/phaser-poc.*$/, "") ||
  "https://arias-color-garden.old-rice-0a9f.workers.dev";

const { HUB_SHARED_ASSETS } = await import(
  pathToFileURL(join(ROOT, "app/phaser-poc/game/assetManifest.ts")).href
);
const paths = HUB_SHARED_ASSETS.map((a) => a.path);

const sha = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();

const results = [];
for (const p of paths) {
  const url = `${BASE}${p}`;
  const res = await fetch(url, { method: "HEAD" });
  results.push({ path: p, status: res.status, ok: res.ok });
}

const failed = results.filter((r) => !r.ok);
const report = {
  generatedAt: new Date().toISOString(),
  branch,
  commitSha: sha,
  base: BASE,
  total: results.length,
  failed: failed.length,
  results,
};

const outDir = join(ROOT, "docs/review/v5/phaser-poc");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "DEPLOY-VERIFY.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ branch, commitSha: sha, failed: failed.length, total: results.length }, null, 2));
if (failed.length) {
  console.error("FAILED", failed);
  process.exit(1);
}
