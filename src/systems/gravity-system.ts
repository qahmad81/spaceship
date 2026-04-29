import type Phaser from "phaser";
import type { Body, BodyClass } from "../types";

const BASE_GRAVITY: Record<BodyClass, number> = {
  sun: 0.065,
  planet_large: 0.038,
  planet_medium: 0.028,
  planet_small: 0.018,
  asteroid_belt_core: 0.002,
};

export function applyBodyGravity(body: Body, point: Phaser.Math.Vector2, velocity: Phaser.Math.Vector2) {
  const dx = body.x - point.x;
  const dy = body.y - point.y;
  const distSq = dx * dx + dy * dy;
  const distance = Math.sqrt(distSq);
  if (distance < body.radius + 24) return;
  const falloff = Math.min(2.2, 420000 / Math.max(1, distSq));
  const accel = BASE_GRAVITY[body.bodyClass] * falloff;
  velocity.x += (dx / distance) * accel;
  velocity.y += (dy / distance) * accel;
}
