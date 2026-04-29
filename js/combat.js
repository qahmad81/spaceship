export function fireProjectile(game) {
  game.projectiles.push({
    x: game.ship.x + Math.cos(game.ship.angle) * (game.ship.size / 2 + 5),
    y: game.ship.y + Math.sin(game.ship.angle) * (game.ship.size / 2 + 5),
    vx: Math.cos(game.ship.angle) * game.projectileSpeed + game.ship.velocity.x,
    vy: Math.sin(game.ship.angle) * game.projectileSpeed + game.ship.velocity.y,
    size: game.projectileSize,
    life: 100,
  });
}

export function updateProjectiles(game) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) game.projectiles.splice(i, 1);
  }
}

export function checkProjectileCollisions(game) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const projectile = game.projectiles[i];
    for (let j = game.targets.length - 1; j >= 0; j--) {
      const t = game.targets[j];
      const d = Math.hypot(projectile.x - t.x, projectile.y - t.y);
      if (d < projectile.size + t.radius) {
        game.destroyedTargets.push(t.id);
        game.targets.splice(j, 1);
        game.projectiles.splice(i, 1);
        break;
      }
    }
  }
}
