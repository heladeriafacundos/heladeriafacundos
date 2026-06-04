import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(standaloneNextDir, "static");
const publicSource = path.join(root, "public");
const publicTarget = path.join(standaloneDir, "public");
const standaloneNextNodeModules = path.join(standaloneNextDir, "node_modules");
const electronOutput = path.join(root, "dist-electron");

if (!existsSync(standaloneDir)) {
  throw new Error("No existe .next/standalone. Ejecuta npm run build primero.");
}

await mkdir(standaloneNextDir, { recursive: true });
await rm(electronOutput, { recursive: true, force: true });
await rm(standaloneNextNodeModules, { recursive: true, force: true });

if (existsSync(staticSource)) {
  await cp(staticSource, staticTarget, { recursive: true, force: true });
}

if (existsSync(publicSource)) {
  await cp(publicSource, publicTarget, { recursive: true, force: true });
}

console.log("Electron listo: standalone, static y public preparados.");
