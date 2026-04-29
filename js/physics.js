export function applyGravity(game) {
  if (!game.mapData) return;
  const attractors = [];
  if (game.mapData.sun) attractors.push({ ...game.mapData.sun, factor: 0.001 });
  if (game.mapData.planets) attractors.push(...game.mapData.planets.map((p) => ({ ...p, factor: 0.0005 })));
  for (const a of attractors) {
    const dx = a.x - game.ship.x;
    const dy = a.y - game.ship.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > a.radius) {
      const g = (a.radius * a.factor) / (d * d);
      game.ship.velocity.x += (dx / d) * g;
      game.ship.velocity.y += (dy / d) * g;
    }
  }
}

export function updateShip(game) {
  if (game.keys.left) game.ship.angle -= game.ship.rotationSpeed;
  if (game.keys.right) game.ship.angle += game.ship.rotationSpeed;
  if (game.keys.up && game.fuel > 0) {
    game.ship.velocity.x += Math.cos(game.ship.angle) * game.ship.acceleration;
    game.ship.velocity.y += Math.sin(game.ship.angle) * game.ship.acceleration;
    game.createThrustParticles();
  }
  if (game.keys.down) {
    game.ship.velocity.x -= Math.cos(game.ship.angle) * game.ship.acceleration * 0.5;
    game.ship.velocity.y -= Math.sin(game.ship.angle) * game.ship.acceleration * 0.5;
  }
  game.ship.velocity.x *= game.ship.friction;
  game.ship.velocity.y *= game.ship.friction;
  game.ship.speed = Math.sqrt(game.ship.velocity.x ** 2 + game.ship.velocity.y ** 2);
  if (game.ship.speed > game.ship.maxSpeed) {
    const ratio = game.ship.maxSpeed / game.ship.speed;
    game.ship.velocity.x *= ratio;
    game.ship.velocity.y *= ratio;
    game.ship.speed = game.ship.maxSpeed;
  }
  game.ship.x += game.ship.velocity.x;
  game.ship.y += game.ship.velocity.y;
}

export function updateCamera(game) {
  game.camera.targetX = game.ship.x - game.canvas.width / 2;
  game.camera.targetY = game.ship.y - game.canvas.height / 2;
  game.camera.x += (game.camera.targetX - game.camera.x) * game.camera.smoothing;
  game.camera.y += (game.camera.targetY - game.camera.y) * game.camera.smoothing;
}

export function checkCollisions(game) {
  const hits = [];
  if (game.mapData.sun) hits.push(game.mapData.sun);
  if (game.mapData.planets) hits.push(...game.mapData.planets);
  if (game.mapData.celestialBodies) hits.push(...game.mapData.celestialBodies);
  for (const h of hits) {
    if (Math.hypot(game.ship.x - h.x, game.ship.y - h.y) < game.ship.size / 2 + h.radius) {
      game.showCrashScreen(Date.now() - game.gameStartTime);
      return;
    }
  }
}

export function checkWinCondition(game) {
  const endPoint = game.mapData.endPoint;
  if (Math.hypot(game.ship.x - endPoint.x, game.ship.y - endPoint.y) < 45) {
    game.showResultScreen(game.fuel, game.ship.speed, Date.now() - game.gameStartTime, game.destroyedTargets);
  }
}
