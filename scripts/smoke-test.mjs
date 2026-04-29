import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mapsDir = path.join(root, "maps");
const mapFiles = ["map1.json", "map2.json", "map3.json"];
const issues = [];

for (const file of mapFiles) {
  const fullPath = path.join(mapsDir, file);
  const map = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!map.mapSize?.width || !map.mapSize?.height) issues.push(`${file}: missing mapSize`);
  if (!map.startPoint?.label) issues.push(`${file}: missing startPoint label`);
  if (!map.endPoint?.label) issues.push(`${file}: missing endPoint label`);
  for (const wormhole of map.wormholes || []) {
    if (!wormhole.toMap) issues.push(`${file}: wormhole missing toMap`);
    if (wormhole.toMap && !mapFiles.includes(wormhole.toMap)) issues.push(`${file}: wormhole toMap not found (${wormhole.toMap})`);
  }
}

if (issues.length) {
  console.error("Smoke test failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Smoke test passed: maps and wormhole links are valid.");
