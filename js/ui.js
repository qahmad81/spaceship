export function updateObjectiveText(game) {
  if (!game.mapData || !game.objectiveText) return;
  const startLabel = game.mapData.startPoint?.label || "A";
  const endLabel = game.mapData.endPoint?.label || "B";
  game.objectiveText.textContent = `Objective: Travel from ${startLabel} to ${endLabel}`;
}

export function updateUI(game) {
  game.speedDisplay.textContent = (Math.round(game.ship.speed * 10) / 10).toString();
  document.getElementById("fuelDisplay").textContent = Math.max(0, Math.round(game.fuel)).toString();
  document.getElementById("projectileDisplay").textContent = game.currentProjectiles.toString();
}

export function showOverlay(game, content) {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = content;
  overlay.style.display = "flex";
}

export function hideOverlay() {
  document.getElementById("overlay").style.display = "none";
}

export function showStartScreen(game) {
  showOverlay(game, `
      <div class="dialog">
        <h2>Start Mission</h2>
        <p>Choose map and ship setup.</p>
        <label>Map:</label>
        <select id="mapSelect">
          <option value="map1.json">Map 1 (A to B)</option>
          <option value="map2.json">Map 2 (B to C)</option>
          <option value="map3.json">Map 3 (C to A)</option>
        </select>
        <label>Max speed:</label>
        <input type="range" id="maxSpeedSlider" min="5" max="20" value="8"><span id="maxSpeedValue">8</span>
        <label>Fuel:</label>
        <input type="range" id="fuelSlider" min="500" max="2000" value="1000" step="50"><span id="fuelValue">1000</span>
        <label>Ammo:</label>
        <input type="range" id="projectileSlider" min="1" max="30" value="12"><span id="projectileValue">12</span>
        <button onclick="game.startGameFromUI()">Launch</button>
      </div>`);
  document.getElementById("maxSpeedSlider").addEventListener("input", (e) => { document.getElementById("maxSpeedValue").textContent = e.target.value; });
  document.getElementById("fuelSlider").addEventListener("input", (e) => { document.getElementById("fuelValue").textContent = e.target.value; });
  document.getElementById("projectileSlider").addEventListener("input", (e) => { document.getElementById("projectileValue").textContent = e.target.value; });
}

export function showResultScreen(game, fuelRemaining, finalSpeed, timeTaken, destroyedTargets) {
  const content = `
      <div class="dialog">
        <h2>Mission Complete</h2>
        <p>Fuel left: ${Math.round(fuelRemaining)}</p>
        <p>Final speed: ${finalSpeed.toFixed(1)}</p>
        <p>Time: ${(timeTaken / 1000).toFixed(2)} s</p>
        <p>Destroyed targets: ${destroyedTargets.length ? destroyedTargets.join(", ") : "none"}</p>
        <button onclick="game.resetGame()">New Mission</button>
      </div>`;
  showOverlay(game, content);
  game.gameState = "won";
}

export function showCrashScreen(game, timeTaken) {
  showOverlay(game, `
      <div class="dialog">
        <h2>Ship Destroyed</h2>
        <p>Mission time: ${(timeTaken / 1000).toFixed(2)} s</p>
        <button onclick="game.resetGame()">Retry</button>
      </div>`);
  game.gameState = "lost";
}
