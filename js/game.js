import { loadImages } from "./assets.js";
import { fetchMap } from "./map-utils.js";
import { applyGravity, checkCollisions, checkWinCondition, updateCamera, updateShip } from "./physics.js";
import { checkProjectileCollisions, fireProjectile, updateProjectiles } from "./combat.js";
import { render } from "./render.js";
import { hideOverlay, showCrashScreen, showResultScreen, showStartScreen, updateObjectiveText, updateUI } from "./ui.js";

export class IslandNavigator {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.speedDisplay = document.getElementById("speed");
    this.messageDisplay = document.getElementById("gameMessage");
    this.objectiveText = document.getElementById("objectiveText");
    this.images = {};
    this.mapData = null;
    this.gameState = "loading";
    this.isTransitioning = false;
    this.gameStartTime = 0;
    this.wormholeFlashFrames = 0;
    this.fuel = 1000;
    this.particles = [];
    this.projectiles = [];
    this.targets = [];
    this.destroyedTargets = [];
    this.projectileSpeed = 13;
    this.projectileSize = 5;
    this.maxProjectiles = 12;
    this.currentProjectiles = 12;
    this.fireCooldown = 10;
    this.fireTimer = 0;
    this.animationFrameId = null;
    this.ship = { x: 0, y: 0, angle: 0, velocity: { x: 0, y: 0 }, speed: 0, acceleration: 0.26, friction: 0.992, rotationSpeed: 0.075, size: 52, maxSpeed: 8 };
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1 };
    this.keys = { up: false, down: false, left: false, right: false, space: false };
    this.init();
  }

  async init() {
    this.images = await loadImages();
    this.setupEventListeners();
    showStartScreen(this);
  }

  async loadMap(mapFileName) {
    this.mapData = await fetchMap(mapFileName);
    this.targets = (this.mapData.targets || []).map((t) => ({ ...t, destroyed: false }));
    updateObjectiveText(this);
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "ArrowUp") this.keys.up = true;
      if (e.code === "ArrowDown") this.keys.down = true;
      if (e.code === "ArrowLeft") this.keys.left = true;
      if (e.code === "ArrowRight") this.keys.right = true;
      if (e.code === "Space") this.keys.space = true;
      if (e.code === "KeyR" && this.gameState !== "playing") this.resetGame();
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyR"].includes(e.code)) e.preventDefault();
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp") this.keys.up = false;
      if (e.code === "ArrowDown") this.keys.down = false;
      if (e.code === "ArrowLeft") this.keys.left = false;
      if (e.code === "ArrowRight") this.keys.right = false;
      if (e.code === "Space") this.keys.space = false;
    });
  }

  async startGame(mapFileName, maxSpeed, fuel, maxProjectiles) {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    await this.loadMap(mapFileName);
    this.ship.x = this.mapData.startPoint.x;
    this.ship.y = this.mapData.startPoint.y;
    this.ship.angle = 0;
    this.ship.velocity = { x: 0, y: 0 };
    this.ship.speed = 0;
    this.ship.maxSpeed = maxSpeed;
    this.fuel = fuel;
    this.maxProjectiles = maxProjectiles;
    this.currentProjectiles = maxProjectiles;
    this.projectiles = [];
    this.destroyedTargets = [];
    this.gameStartTime = Date.now();
    this.camera.x = this.ship.x - this.canvas.width / 2;
    this.camera.y = this.ship.y - this.canvas.height / 2;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;
    this.gameState = "playing";
    hideOverlay();
    this.gameLoop();
  }

  async enterWormhole(wormhole) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    const speed = this.ship.maxSpeed;
    const fuel = this.fuel;
    const projectiles = this.currentProjectiles;
    await this.startGame(wormhole.toMap, speed, fuel, projectiles);
    this.wormholeFlashFrames = 14;
    if (wormhole.toLabel === this.mapData.startPoint.label) {
      this.ship.x = this.mapData.startPoint.x;
      this.ship.y = this.mapData.startPoint.y;
    } else if (wormhole.toLabel === this.mapData.endPoint.label) {
      this.ship.x = this.mapData.endPoint.x;
      this.ship.y = this.mapData.endPoint.y;
    }
    setTimeout(() => { this.isTransitioning = false; }, 350);
  }

  resetGame() { showStartScreen(this); }

  update() {
    if (this.gameState !== "playing") return;
    updateShip(this);
    updateProjectiles(this);
    updateCamera(this);
    this.updateParticles();
    applyGravity(this);
    checkCollisions(this);
    checkProjectileCollisions(this);
    this.checkWormholes();
    checkWinCondition(this);
    updateUI(this);
    if (this.keys.up) {
      this.fuel -= 0.12;
      if (this.fuel <= 0) this.gameOver("Out of fuel");
    }
    if (this.keys.space && this.fireTimer <= 0 && this.currentProjectiles > 0) {
      fireProjectile(this);
      this.currentProjectiles--;
      this.fireTimer = this.fireCooldown;
    }
    if (this.fireTimer > 0) this.fireTimer--;
  }

  checkWormholes() {
    if (!this.mapData?.wormholes?.length || this.isTransitioning) return;
    for (const w of this.mapData.wormholes) {
      if (Math.hypot(this.ship.x - w.x, this.ship.y - w.y) < w.radius + this.ship.size / 2) {
        this.enterWormhole(w);
        return;
      }
    }
  }

  gameOver(message) {
    this.gameState = "lost";
    this.messageDisplay.textContent = message;
    showCrashScreen(this, Date.now() - this.gameStartTime);
  }

  render() { render(this); }

  createThrustParticles() {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: this.ship.x - Math.cos(this.ship.angle) * this.ship.size / 2,
        y: this.ship.y - Math.sin(this.ship.angle) * this.ship.size / 2,
        vx: -Math.cos(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
        vy: -Math.sin(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
        life: 25 + Math.random() * 10,
        maxLife: 35,
        size: 2 + Math.random() * 2,
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  startGameFromUI() {
    this.startGame(
      document.getElementById("mapSelect").value,
      parseInt(document.getElementById("maxSpeedSlider").value, 10),
      parseInt(document.getElementById("fuelSlider").value, 10),
      parseInt(document.getElementById("projectileSlider").value, 10),
    );
  }

  showResultScreen(fuelRemaining, finalSpeed, timeTaken, destroyedTargets) {
    showResultScreen(this, fuelRemaining, finalSpeed, timeTaken, destroyedTargets);
  }

  showCrashScreen(timeTaken) {
    showCrashScreen(this, timeTaken);
  }

  gameLoop() {
    if (this.gameState !== "playing") return;
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}
