import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "popup"), { recursive: true });

await Promise.all([
  build({
    entryPoints: [resolve(root, "src/content/bootstrap.ts")],
    bundle: true,
    outfile: resolve(dist, "content.js"),
    format: "iife",
    platform: "browser",
    target: "chrome120",
    loader: { ".css": "text" },
    sourcemap: false,
    minify: false,
    legalComments: "none"
  }),
  build({
    entryPoints: [resolve(root, "src/popup/popup.ts")],
    bundle: true,
    outfile: resolve(dist, "popup/popup.js"),
    format: "iife",
    platform: "browser",
    target: "chrome120",
    sourcemap: false,
    minify: false,
    legalComments: "none"
  })
]);

for (const file of ["manifest.json", "src/popup/popup.html", "src/popup/popup.css"]) {
  const destination = file.startsWith("src/popup/")
    ? resolve(dist, "popup", file.replace("src/popup/", ""))
    : resolve(dist, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(root, file), destination);
}

await cp(resolve(root, "assets/icons"), resolve(dist, "icons"), { recursive: true });

const manifest = JSON.parse(await readFile(resolve(dist, "manifest.json"), "utf8"));
await writeFile(resolve(dist, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
