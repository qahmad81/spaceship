export type BodyClass = "sun" | "planet_large" | "planet_medium" | "planet_small" | "asteroid_belt_core";

export interface Body {
  x: number;
  y: number;
  radius: number;
  bodyClass: BodyClass;
}

export interface Asteroid {
  x: number;
  y: number;
  radius: number;
}

export interface Gate {
  id: string;
  x: number;
  y: number;
  radius: number;
  toMapId: string;
  toGateId: string;
}

export interface StationRef {
  stationId: string;
  x: number;
  y: number;
  dockingRadius: number;
}

export interface SpaceMap {
  mapId: string;
  size: { width: number; height: number };
  primaryBody: Body;
  asteroidBelts: Asteroid[][];
  stations: StationRef[];
  gates: Gate[];
  spawnPoints: Array<{ x: number; y: number; label: string }>;
}

export interface Good {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  mass: number;
  iconKey: string;
}

export interface StationGood {
  goodId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  flags?: string[];
}

export interface StationData {
  stationId: string;
  mapId: string;
  type: string;
  services: string[];
  goods: StationGood[];
  fuelPrice: number;
  ammoPrice: number;
  shipOffers?: Array<{ shipId: string; price: number }>;
}

export interface ShipDef {
  id: string;
  name: string;
  maxSpeed: number;
  acceleration: number;
  rotationSpeed: number;
  cargoCapacity: number;
  fuelCapacity: number;
  ammoCapacity: number;
  fuelBurnRate: number;
  spriteKey: string;
}

export interface PlayerProfile {
  credits: number;
  cargo: Record<string, number>;
  fuel: number;
  ammo: number;
  ownedShips: string[];
  currentShip: string;
  currentMap: string;
  position: { x: number; y: number };
}
