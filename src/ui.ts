import { gameState } from "./state";
import { buyGood, buyShip, reammo, refuel, sellGood } from "./systems/economy-system";

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element ${id}`);
  return node;
}

function stationIconForType(type: string) {
  if (type === "shipyard") return "/world/icons/station_shipyard.png";
  if (type === "fuel_depot") return "/world/icons/station_fuel_depot.png";
  if (type === "armory") return "/world/icons/station_armory.png";
  return "/world/icons/station_trade_hub.png";
}

export function updateHud() {
  el("hud-credits").textContent = `${Math.floor(gameState.profile.credits)}`;
  el("hud-fuel").textContent = `${Math.floor(gameState.profile.fuel)}/${gameState.currentShip.fuelCapacity}`;
  el("hud-ammo").textContent = `${gameState.profile.ammo}/${gameState.currentShip.ammoCapacity}`;
  el("hud-cargo").textContent = `${gameState.cargoMass()}/${gameState.currentShip.cargoCapacity}`;
  el("hud-map").textContent = gameState.profile.currentMap;
  el("hud-station").textContent = gameState.currentStationId ?? "-";
}

export function closeMarket() {
  gameState.marketOpen = false;
  el("market-panel").classList.add("hidden");
}

export function showGameOver(message = "You crashed.") {
  el("game-over-message").textContent = message;
  el("game-over").classList.remove("hidden");
}

export function hideGameOver() {
  el("game-over").classList.add("hidden");
}

export function openMarket(stationId: string) {
  if (!stationId) return;
  gameState.currentStationId = stationId;
  gameState.marketOpen = true;
  renderMarket(stationId);
  el("market-panel").classList.remove("hidden");
}

export function toggleMarket(stationId: string | null) {
  if (!stationId) return;
  if (gameState.marketOpen && gameState.currentStationId === stationId) {
    closeMarket();
    return;
  }
  openMarket(stationId);
}

export function renderMarket(stationId: string) {
  const station = gameState.stations.get(stationId);
  if (!station) return;
  const services = el("market-services");
  const goodsContainer = el("market-goods");
  const stationIcon = stationIconForType(station.type);
  services.innerHTML = `
    <div class="market-header">
      <img class="station-icon" src="${stationIcon}" alt="${station.type}" />
      <div>
        <div class="market-title">${station.type}</div>
        <div class="market-subtitle">${station.stationId} on ${station.mapId}</div>
      </div>
    </div>
    <div class="market-row"><span>Fuel price</span><span>${station.fuelPrice}</span><button id="btn-refuel">Refuel +1</button><span></span></div>
    <div class="market-row"><span>Ammo price</span><span>${station.ammoPrice}</span><button id="btn-reammo">Ammo +1</button><span></span></div>
  `;
  goodsContainer.innerHTML = station.goods.map((g) => {
    const good = gameState.goods.get(g.goodId);
    const owned = gameState.profile.cargo[g.goodId] ?? 0;
    const iconKey = good?.iconKey ?? "good_food";
    return `<div class="market-row">
      <span class="good-cell"><img class="good-icon" src="/world/icons/${iconKey}.png" alt="${good?.name ?? g.goodId}" /><span>${good?.name ?? g.goodId} (${owned})</span></span>
      <span>B:${g.buyPrice} / S:${g.sellPrice}</span>
      <button data-buy="${g.goodId}">Buy</button>
      <button data-sell="${g.goodId}">Sell</button>
    </div>`;
  }).join("") + (station.shipOffers?.length ? `
    <div class="ship-offers-title">Ships</div>
    ${station.shipOffers.map((offer) => {
      const ship = gameState.ships.get(offer.shipId);
      const owned = gameState.profile.ownedShips.includes(offer.shipId);
      return `<div class="market-row">
        <span class="good-cell"><img class="good-icon" src="/world/ships/${ship?.spriteKey ?? offer.shipId}.png" alt="${ship?.name ?? offer.shipId}" /><span>${ship?.name ?? offer.shipId}</span></span>
        <span>${owned ? "Owned" : `P:${offer.price}`}</span>
        <button data-ship="${offer.shipId}">${owned ? "Use" : "Buy"}</button>
        <span></span>
      </div>`;
    }).join("")}
  ` : "");

  document.getElementById("btn-refuel")?.addEventListener("click", () => {
    refuel(stationId);
    renderMarket(stationId);
    updateHud();
  });
  document.getElementById("btn-reammo")?.addEventListener("click", () => {
    reammo(stationId);
    renderMarket(stationId);
    updateHud();
  });

  goodsContainer.querySelectorAll("[data-buy]").forEach((node) => {
    node.addEventListener("click", () => {
      const goodId = (node as HTMLElement).dataset.buy!;
      buyGood(stationId, goodId);
      renderMarket(stationId);
      updateHud();
    });
  });
  goodsContainer.querySelectorAll("[data-sell]").forEach((node) => {
    node.addEventListener("click", () => {
      const goodId = (node as HTMLElement).dataset.sell!;
      sellGood(stationId, goodId);
      renderMarket(stationId);
      updateHud();
    });
  });

  goodsContainer.querySelectorAll("[data-ship]").forEach((node) => {
    node.addEventListener("click", () => {
      const shipId = (node as HTMLElement).dataset.ship!;
      buyShip(stationId, shipId);
      const worldScene = (window as any).worldScene;
      worldScene?.setShipTexture?.();
      renderMarket(stationId);
      updateHud();
    });
  });
}
