import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const vinextBin = path.join(
  root,
  "node_modules",
  ".bin",
  isWin ? "vinext.cmd" : "vinext",
);

if (!existsSync(vinextBin)) {
  console.error("vinext is unavailable. Run npm.cmd install first.");
  process.exit(69);
}

console.log("Running vinext build...");
const result = spawnSync(vinextBin, ["build"], {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
console.log("Build complete.");
