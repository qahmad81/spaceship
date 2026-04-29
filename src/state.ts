import type { Good, PlayerProfile, ShipDef, SpaceMap, StationData } from "./types";

export class GameState {
  maps = new Map<string, SpaceMap>();
  stations = new Map<string, StationData>();
  goods = new Map<string, Good>();
  ships = new Map<string, ShipDef>();
  profile: PlayerProfile = {
    credits: 3000,
    cargo: {},
    fuel: 200,
    ammo: 30,
    ownedShips: ["starter_shuttle"],
    currentShip: "starter_shuttle",
    currentMap: "map01",
    position: { x: 400, y: 300 },
  };

  marketOpen = false;
  currentStationId: string | null = null;
  gateTransitionCooldownUntil = 0;

  get currentMap(): SpaceMap {
    const map = this.maps.get(this.profile.currentMap);
    if (!map) throw new Error(`Missing map ${this.profile.currentMap}`);
    return map;
  }

  get currentShip(): ShipDef {
    const ship = this.ships.get(this.profile.currentShip);
    if (!ship) throw new Error(`Missing ship ${this.profile.currentShip}`);
    return ship;
  }

  cargoMass(): number {
    let total = 0;
    for (const [goodId, qty] of Object.entries(this.profile.cargo)) {
      total += (this.goods.get(goodId)?.mass ?? 0) * qty;
    }
    return total;
  }
}

export const gameState = new GameState();
