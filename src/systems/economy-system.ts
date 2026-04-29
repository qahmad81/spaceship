import { gameState } from "../state";
import { saveProfileToStorage } from "./persistence-system";

const ECONOMY_TICK_MS = 45_000;
let lastEconomyTick = Date.now();

function stationTypePriceMultiplier(type: string) {
  if (type === "fuel_depot") return 0.7;
  if (type === "armory") return 0.8;
  if (type === "refinery") return 0.85;
  if (type === "luxury_port") return 1.2;
  if (type === "free_market") return 1.1;
  if (type === "shipyard") return 1.15;
  return 1;
}

function categoryPriceMultiplier(category: string) {
  if (category === "basic") return 0.92;
  if (category === "industrial") return 1;
  if (category === "hightech") return 1.12;
  if (category === "energy") return 0.88;
  if (category === "military") return 1.05;
  if (category === "luxury") return 1.22;
  return 1;
}

function approachValue(current: number, target: number, strength: number) {
  return current + (target - current) * strength;
}

function clampPrice(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function marketBounds(goodBasePrice: number) {
  return {
    minBuy: Math.max(2, Math.floor(goodBasePrice * 0.55)),
    maxBuy: Math.ceil(goodBasePrice * 2.4),
    minSell: Math.max(1, Math.floor(goodBasePrice * 0.35)),
    maxSell: Math.ceil(goodBasePrice * 1.8),
  };
}

function nudgeGoodsAfterTrade(entry: { buyPrice: number; sellPrice: number }, goodBasePrice: number, direction: "buy" | "sell") {
  const { minBuy, maxBuy, minSell, maxSell } = marketBounds(goodBasePrice);
  const swing = Math.max(1, Math.round(goodBasePrice * 0.04));
  const buyDelta = direction === "buy" ? swing : -Math.max(1, Math.floor(swing * 0.7));
  const sellDelta = direction === "buy" ? Math.max(1, Math.floor(swing * 0.5)) : -Math.max(1, Math.floor(swing * 0.5));
  entry.buyPrice = clampPrice(entry.buyPrice + buyDelta, minBuy, maxBuy);
  entry.sellPrice = clampPrice(entry.sellPrice + sellDelta, minSell, maxSell);
  if (entry.buyPrice <= entry.sellPrice + 2) {
    entry.buyPrice = Math.min(maxBuy, entry.sellPrice + 2);
  }
}

export function tickEconomy() {
  const now = Date.now();
  if (now - lastEconomyTick < ECONOMY_TICK_MS) return;
  lastEconomyTick = now;

  for (const station of gameState.stations.values()) {
    const multiplier = stationTypePriceMultiplier(station.type);
    station.fuelPrice = clampPrice(approachValue(station.fuelPrice, station.type === "fuel_depot" ? 4 : station.type === "shipyard" ? 12 : 8, 0.12), 2, 18);
    station.ammoPrice = clampPrice(approachValue(station.ammoPrice, station.type === "armory" ? 6 : station.type === "shipyard" ? 10 : 12, 0.12), 3, 22);
    for (const entry of station.goods) {
      const good = gameState.goods.get(entry.goodId);
      if (!good) continue;
      const categoryMultiplier = categoryPriceMultiplier(good.category);
      const targetBuy = good.basePrice * multiplier * categoryMultiplier * 1.15;
      const targetSell = good.basePrice * multiplier * categoryMultiplier * 0.78;
      const { minBuy, maxBuy, minSell, maxSell } = marketBounds(good.basePrice);
      const nextBuy = clampPrice(approachValue(entry.buyPrice, targetBuy, 0.18), minBuy, maxBuy);
      const nextSell = clampPrice(approachValue(entry.sellPrice, targetSell, 0.18), minSell, maxSell);
      entry.buyPrice = Math.max(nextBuy, nextSell + 2);
      entry.sellPrice = Math.min(nextSell, entry.buyPrice - 2);
      const stockCap = station.type === "fuel_depot" ? 320 : station.type === "armory" ? 280 : station.type === "shipyard" ? 120 : 220;
      const restock = entry.stock < 20 ? 8 : entry.stock < 60 ? 4 : 2;
      entry.stock = Math.min(stockCap, Math.max(0, entry.stock + restock));
    }
  }
}

export function buyGood(stationId: string, goodId: string): boolean {
  const station = gameState.stations.get(stationId);
  const good = gameState.goods.get(goodId);
  if (!station || !good) return false;
  const entry = station.goods.find((g) => g.goodId === goodId);
  if (!entry || entry.stock <= 0) return false;
  if (gameState.profile.credits < entry.buyPrice) return false;
  if (gameState.cargoMass() + good.mass > gameState.currentShip.cargoCapacity) return false;

  gameState.profile.credits -= entry.buyPrice;
  entry.stock -= 1;
  gameState.profile.cargo[goodId] = (gameState.profile.cargo[goodId] ?? 0) + 1;
  nudgeGoodsAfterTrade(entry, good.basePrice, "buy");
  saveProfileToStorage();
  return true;
}

export function sellGood(stationId: string, goodId: string): boolean {
  const station = gameState.stations.get(stationId);
  const good = gameState.goods.get(goodId);
  if (!station) return false;
  const entry = station.goods.find((g) => g.goodId === goodId);
  if (!entry || !good) return false;
  const current = gameState.profile.cargo[goodId] ?? 0;
  if (current <= 0) return false;

  gameState.profile.cargo[goodId] = current - 1;
  gameState.profile.credits += entry.sellPrice;
  entry.stock += 1;
  nudgeGoodsAfterTrade(entry, good.basePrice, "sell");
  saveProfileToStorage();
  return true;
}

export function refuel(stationId: string): boolean {
  const station = gameState.stations.get(stationId);
  if (!station || !station.services.includes("fuel")) return false;
  if (gameState.profile.fuel >= gameState.currentShip.fuelCapacity) return false;
  if (gameState.profile.credits < station.fuelPrice) return false;
  gameState.profile.credits -= station.fuelPrice;
  gameState.profile.fuel += 1;
  station.fuelPrice = clampPrice(station.fuelPrice + 1, 2, 18);
  saveProfileToStorage();
  return true;
}

export function reammo(stationId: string): boolean {
  const station = gameState.stations.get(stationId);
  if (!station || !station.services.includes("ammo")) return false;
  if (gameState.profile.ammo >= gameState.currentShip.ammoCapacity) return false;
  if (gameState.profile.credits < station.ammoPrice) return false;
  gameState.profile.credits -= station.ammoPrice;
  gameState.profile.ammo += 1;
  station.ammoPrice = clampPrice(station.ammoPrice + 1, 3, 22);
  saveProfileToStorage();
  return true;
}

export function buyShip(stationId: string, shipId: string): boolean {
  const station = gameState.stations.get(stationId);
  const ship = gameState.ships.get(shipId);
  if (!station || !ship || !station.services.includes("shipyard")) return false;
  const offer = station.shipOffers?.find((entry) => entry.shipId === shipId);
  if (!offer) return false;
  const alreadyOwned = gameState.profile.ownedShips.includes(shipId);
  if (!alreadyOwned && gameState.profile.credits < offer.price) return false;

  if (!alreadyOwned) {
    gameState.profile.credits -= offer.price;
    gameState.profile.ownedShips.push(shipId);
  }

  gameState.profile.currentShip = shipId;
  gameState.profile.fuel = Math.min(gameState.profile.fuel, ship.fuelCapacity);
  gameState.profile.ammo = Math.min(gameState.profile.ammo, ship.ammoCapacity);
  saveProfileToStorage();
  return true;
}
