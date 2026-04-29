import type { Good, PlayerProfile, ShipDef, SpaceMap, StationData } from "./types";
import { gameState } from "./state";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json() as Promise<T>;
}

export async function loadWorldData() {
  const mapsIndex = await fetchJson<{ maps: string[] }>("/world/maps/index.json");
  for (const mapId of mapsIndex.maps) {
    const map = await fetchJson<SpaceMap>(`/world/maps/${mapId}.json`);
    gameState.maps.set(map.mapId, map);
  }

  const goods = await fetchJson<Good[]>("/world/data/goods.json");
  goods.forEach((g) => gameState.goods.set(g.id, g));

  const ships = await fetchJson<ShipDef[]>("/world/data/ships.json");
  ships.forEach((s) => gameState.ships.set(s.id, s));

  const stationIndex = await fetchJson<{ stations: string[] }>("/world/stations/index.json");
  for (const stationId of stationIndex.stations) {
    const station = await fetchJson<StationData>(`/world/stations/${stationId}.json`);
    gameState.stations.set(station.stationId, station);
  }
}

export async function loadDefaultProfile() {
  const profile = await fetchJson<PlayerProfile>("/world/save/profile.json");
  gameState.profile = {
    ...profile,
    cargo: { ...profile.cargo },
    ownedShips: [...profile.ownedShips],
    position: { ...profile.position },
  };
}
