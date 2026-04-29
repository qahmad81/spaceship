import type Phaser from "phaser";
import { gameState } from "../state";
import type { SpaceMap } from "../types";
import { saveProfileToStorage } from "./persistence-system";

export function tryJumpGate(ship: Phaser.GameObjects.Sprite): boolean {
  if (Date.now() < gameState.gateTransitionCooldownUntil) return false;
  const map = gameState.currentMap;
  const gate = map.gates.find((g) => Phaser.Math.Distance.Between(ship.x, ship.y, g.x, g.y) <= g.radius + 20);
  if (!gate) return false;

  const targetMap = gameState.maps.get(gate.toMapId);
  if (!targetMap) return false;
  const targetGate = targetMap.gates.find((g) => g.id === gate.toGateId);
  if (!targetGate) return false;

  gameState.profile.currentMap = targetMap.mapId;
  gameState.profile.position = chooseSafeExitPosition(targetMap, targetGate);
  gameState.gateTransitionCooldownUntil = Date.now() + 2500;
  saveProfileToStorage();
  return true;
}

function chooseSafeExitPosition(targetMap: SpaceMap, targetGate: { x: number; y: number; radius: number }) {
  const desiredDistance = targetGate.radius + 380;
  const candidates = [
    ...targetMap.spawnPoints.map((spawn) => ({ x: spawn.x, y: spawn.y })),
    vectorFromGateToCenter(targetMap, targetGate, desiredDistance),
  ];

  let best = candidates[0] ?? { x: targetGate.x, y: targetGate.y };
  let bestDistance = distance(best, targetGate);
  for (const candidate of candidates.slice(1)) {
    const candidateDistance = distance(candidate, targetGate);
    if (candidateDistance > bestDistance) {
      best = candidate;
      bestDistance = candidateDistance;
    }
  }

  if (bestDistance >= desiredDistance) {
    return clampToMap(targetMap, best);
  }

  return clampToMap(targetMap, vectorFromGateToCenter(targetMap, targetGate, desiredDistance + 40));
}

function vectorFromGateToCenter(targetMap: SpaceMap, targetGate: { x: number; y: number }, distance: number) {
  const centerX = targetMap.size.width / 2;
  const centerY = targetMap.size.height / 2;
  let dx = centerX - targetGate.x;
  let dy = centerY - targetGate.y;
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  dx /= length;
  dy /= length;
  return {
    x: targetGate.x + dx * distance,
    y: targetGate.y + dy * distance,
  };
}

function clampToMap(targetMap: SpaceMap, point: { x: number; y: number }) {
  return {
    x: Phaser.Math.Clamp(point.x, 48, targetMap.size.width - 48),
    y: Phaser.Math.Clamp(point.y, 48, targetMap.size.height - 48),
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
