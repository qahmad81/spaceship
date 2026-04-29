import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mapsDir = path.join(root, "public", "world", "maps");
const stationsDir = path.join(root, "public", "world", "stations");
const dataDir = path.join(root, "public", "world", "data");

const mapsIndex = JSON.parse(fs.readFileSync(path.join(mapsDir, "index.json"), "utf8"));
const stationIndex = JSON.parse(fs.readFileSync(path.join(stationsDir, "index.json"), "utf8"));
const goods = JSON.parse(fs.readFileSync(path.join(dataDir, "goods.json"), "utf8"));
const goodsIds = new Set(goods.map((g) => g.id));

const maps = new Map();
for (const mapId of mapsIndex.maps) {
  const file = path.join(mapsDir, `${mapId}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing map file ${mapId}`);
  const map = JSON.parse(fs.readFileSync(file, "utf8"));
  maps.set(mapId, map);
}

for (const [mapId, map] of maps.entries()) {
  for (const gate of map.gates) {
    const target = maps.get(gate.toMapId);
    if (!target) throw new Error(`Map ${mapId} gate ${gate.id} points to missing map ${gate.toMapId}`);
    const back = target.gates.find((g) => g.id === gate.toGateId);
    if (!back) throw new Error(`Map ${mapId} gate ${gate.id} points to missing gate ${gate.toGateId}`);
  }
}

for (const stationId of stationIndex.stations) {
  const file = path.join(stationsDir, `${stationId}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing station file ${stationId}`);
  const station = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!maps.has(station.mapId)) throw new Error(`Station ${stationId} references missing map ${station.mapId}`);
  for (const g of station.goods) {
    if (!goodsIds.has(g.goodId)) throw new Error(`Station ${stationId} references missing good ${g.goodId}`);
  }
}

console.log(`World validation passed: ${maps.size} maps, ${stationIndex.stations.length} stations, ${goods.length} goods.`);
