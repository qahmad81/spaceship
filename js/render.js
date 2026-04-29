export function drawImageAtCenter(ctx, image, x, y, r) {
  if (!image) return;
  ctx.drawImage(image, x - r, y - r, r * 2, r * 2);
}

export function render(game) {
  game.ctx.fillStyle = "#000000";
  game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  game.ctx.save();
  game.ctx.translate(-game.camera.x, -game.camera.y);
  renderMap(game);
  renderTargets(game);
  renderParticles(game);
  renderShip(game);
  renderProjectiles(game);
  game.ctx.restore();
  renderMinimap(game);
  renderWormholeFlash(game);
}

export function renderStationLabel(game, label, x, y) {
  game.ctx.fillStyle = "#ffffff";
  game.ctx.font = "bold 18px Arial";
  game.ctx.textAlign = "center";
  game.ctx.fillText(label, x, y - 52);
}

export function renderMap(game) {
  if (game.mapData.sun) drawImageAtCenter(game.ctx, game.images.sun, game.mapData.sun.x, game.mapData.sun.y, game.mapData.sun.radius);
  for (const p of game.mapData.planets || []) drawImageAtCenter(game.ctx, game.images[p.type] || game.images.planet_medium, p.x, p.y, p.radius);
  for (const c of game.mapData.celestialBodies || []) {
    const image = game.images[c.type] || game.images.celestial_body || game.images.rock;
    drawImageAtCenter(game.ctx, image, c.x, c.y, c.radius);
  }
  for (const w of game.mapData.wormholes || []) drawImageAtCenter(game.ctx, game.images.wormhole, w.x, w.y, w.radius);
  drawImageAtCenter(game.ctx, game.images[game.mapData.startPoint.type] || game.images.space_station1, game.mapData.startPoint.x, game.mapData.startPoint.y, 40);
  renderStationLabel(game, game.mapData.startPoint.label, game.mapData.startPoint.x, game.mapData.startPoint.y);
  drawImageAtCenter(game.ctx, game.images[game.mapData.endPoint.type] || game.images.space_station2, game.mapData.endPoint.x, game.mapData.endPoint.y, 44);
  renderStationLabel(game, game.mapData.endPoint.label, game.mapData.endPoint.x, game.mapData.endPoint.y);
  for (const station of game.mapData.spaceStations || []) drawImageAtCenter(game.ctx, game.images[station.type] || game.images.space_station3, station.x, station.y, 40);
}

export function renderTargets(game) {
  for (const t of game.targets) {
    const image = game.images[t.type] || game.images.rock || game.images.celestial_body;
    drawImageAtCenter(game.ctx, image, t.x, t.y, t.radius);
  }
}

export function renderShip(game) {
  game.ctx.save();
  game.ctx.translate(game.ship.x, game.ship.y);
  game.ctx.rotate(game.ship.angle);
  if (game.images.shuttle) game.ctx.drawImage(game.images.shuttle, -game.ship.size / 2, -game.ship.size / 2, game.ship.size, game.ship.size);
  game.ctx.restore();
}

export function renderProjectiles(game) {
  game.ctx.fillStyle = "#00ffff";
  for (const p of game.projectiles) {
    game.ctx.beginPath();
    game.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    game.ctx.fill();
  }
}

export function renderParticles(game) {
  for (const p of game.particles) {
    game.ctx.fillStyle = `rgba(255, 165, 0, ${p.life / p.maxLife})`;
    game.ctx.beginPath();
    game.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    game.ctx.fill();
  }
}

export function renderMinimap(game) {
  if (!game.mapData) return;
  const size = 160;
  const x = game.canvas.width - size - 14;
  const y = 14;
  const sx = size / game.mapData.mapSize.width;
  const sy = size / game.mapData.mapSize.height;
  game.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  game.ctx.fillRect(x, y, size, size);
  game.ctx.strokeStyle = "#00ffff";
  game.ctx.strokeRect(x, y, size, size);
  game.ctx.fillStyle = "#8aa0ff";
  for (const w of game.mapData.wormholes || []) {
    game.ctx.beginPath(); game.ctx.arc(x + w.x * sx, y + w.y * sy, 2, 0, Math.PI * 2); game.ctx.fill();
  }
  game.ctx.fillStyle = "#f3c34d";
  for (const p of game.mapData.planets || []) {
    game.ctx.beginPath(); game.ctx.arc(x + p.x * sx, y + p.y * sy, 2, 0, Math.PI * 2); game.ctx.fill();
  }
  game.ctx.fillStyle = "#ff6b6b";
  for (const c of game.mapData.celestialBodies || []) {
    game.ctx.beginPath(); game.ctx.arc(x + c.x * sx, y + c.y * sy, 1.5, 0, Math.PI * 2); game.ctx.fill();
  }
  game.ctx.fillStyle = "#7dff9b";
  game.ctx.beginPath(); game.ctx.arc(x + game.mapData.startPoint.x * sx, y + game.mapData.startPoint.y * sy, 3, 0, Math.PI * 2); game.ctx.fill();
  game.ctx.fillStyle = "#ff7de0";
  game.ctx.beginPath(); game.ctx.arc(x + game.mapData.endPoint.x * sx, y + game.mapData.endPoint.y * sy, 3, 0, Math.PI * 2); game.ctx.fill();
  game.ctx.fillStyle = "#ffffff";
  game.ctx.beginPath(); game.ctx.arc(x + game.ship.x * sx, y + game.ship.y * sy, 2.5, 0, Math.PI * 2); game.ctx.fill();
}

export function renderWormholeFlash(game) {
  if (!game.wormholeFlashFrames || game.wormholeFlashFrames <= 0) return;
  const alpha = game.wormholeFlashFrames / 14;
  game.ctx.fillStyle = `rgba(130, 180, 255, ${Math.min(0.35, alpha * 0.35)})`;
  game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  game.wormholeFlashFrames--;
}
