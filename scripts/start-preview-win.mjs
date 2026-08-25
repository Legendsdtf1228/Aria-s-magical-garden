import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

// Fix vinext StaticFileCache on Windows: path.relative returns backslashes,
// so cache keys become "/assets\\file.js" and /assets/* 404.
const origRelative = path.relative;
path.relative = (from, to) => origRelative(from, to).split(path.sep).join("/");

const prodServerPath = path.join(
  process.cwd(),
  "node_modules",
  "vinext",
  "dist",
  "server",
  "prod-server.js"
);
const { startProdServer } = await import(pathToFileURL(prodServerPath).href);

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
console.log(`\n  preview-win  (port ${port})\n`);
await startProdServer({
  host,
  port,
  outDir: path.resolve(process.cwd(), "dist"),
});
