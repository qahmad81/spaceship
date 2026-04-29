import Phaser from "phaser";
import { loadDefaultProfile } from "../data-loader";
import { gameState } from "../state";
import { tickEconomy } from "../systems/economy-system";
import { applyBodyGravity } from "../systems/gravity-system";
import { clearSavedProfile, saveProfileToStorage } from "../systems/persistence-system";
import { tryJumpGate } from "../systems/world-transition-system";
import { closeMarket, hideGameOver, showGameOver, toggleMarket, updateHud } from "../ui";

export class WorldScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Sprite;
  private projectiles: Phaser.GameObjects.Arc[] = [];
  private thrustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private velocity = new Phaser.Math.Vector2(0, 0);
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private stationProximity: string | null = null;
  private lastAutosave = 0;
  private stationLabels: Phaser.GameObjects.Text[] = [];
  private isResettingNewGame = false;
  private gameOver = false;

  constructor() {
    super("WorldScene");
  }

  create() {
    this.input.keyboard!.removeAllListeners();
    this.keys = this.input.keyboard!.addKeys("UP,DOWN,LEFT,RIGHT,SPACE,E,R,G,N") as Record<string, Phaser.Input.Keyboard.Key>;
    (window as any).worldScene = this;
    this.gameOver = false;
    hideGameOver();
    this.buildMap();
    updateHud();
  }

  private buildMap() {
    this.projectiles.forEach((projectile) => projectile.destroy());
    this.projectiles = [];
    this.thrustEmitter?.stop();
    this.thrustEmitter = null;
    this.velocity = new Phaser.Math.Vector2(0, 0);
    this.stationProximity = null;
    gameState.currentStationId = null;
    this.gameOver = false;
    hideGameOver();
    this.cameras.main.setBackgroundColor("#000000");
    this.children.removeAll();
    this.stationLabels = [];
    const map = gameState.currentMap;

    const bodyTexture = map.primaryBody.bodyClass === "sun" ? "sun" :
      map.primaryBody.bodyClass === "planet_large" ? "planet_large" :
      map.primaryBody.bodyClass === "planet_medium" ? "planet_medium" :
      map.primaryBody.bodyClass === "planet_small" ? "planet_small" : "asteroid";
    this.add.image(map.primaryBody.x, map.primaryBody.y, bodyTexture).setDisplaySize(map.primaryBody.radius * 2 * bodyDisplayScale(map.primaryBody.bodyClass), map.primaryBody.radius * 2 * bodyDisplayScale(map.primaryBody.bodyClass));
    map.asteroidBelts.forEach((belt) => belt.forEach((a) => {
      this.add.image(a.x, a.y, "asteroid").setDisplaySize(a.radius * 2.1, a.radius * 2.1);
    }));
    map.stations.forEach((s) => {
      const station = gameState.stations.get(s.stationId);
      const spriteKey = stationTextureForType(station?.type);
      const container = this.add.container(s.x, s.y);
      const halo = this.add.circle(0, 0, 52, 0x8ab4ff, 0.12).setStrokeStyle(1, 0x9dc5ff, 0.45);
      const beacon = this.add.image(0, 0, spriteKey).setDisplaySize(66, 66);
      const label = this.add.text(-54, 42, `${station?.type ?? "station"} • ${s.stationId}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#dce8ff",
        backgroundColor: "rgba(5,10,18,0.55)",
        padding: { x: 4, y: 2 },
      });
      label.setOrigin(0, 0.5);
      container.add([halo, beacon, label]);
      this.stationLabels.push(label);
      this.tweens.add({
        targets: halo,
        scaleX: 1.18,
        scaleY: 1.18,
        alpha: 0.28,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    map.gates.forEach((g) => {
      this.add.image(g.x, g.y, "gate").setDisplaySize(g.radius * 2, g.radius * 2);
    });

    this.ship = this.add.sprite(gameState.profile.position.x, gameState.profile.position.y, shipDefToTexture(gameState.currentShip.spriteKey)).setDisplaySize(54, 54);
    this.ship.setDepth(10);
    this.thrustEmitter = this.add.particles(0, 0, "thrust_particle", {
      on: false,
      speed: { min: 15, max: 60 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 140, max: 220 },
      quantity: 2,
      frequency: 16,
      tint: 0xffa64d,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.thrustEmitter.setDepth(9);
    this.cameras.main.startFollow(this.ship);
    this.cameras.main.setBounds(0, 0, map.size.width, map.size.height);
    this.physics.world.setBounds(0, 0, map.size.width, map.size.height);
    closeMarket();
  }

  update() {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.N)) {
        void this.startNewGame();
      }
      updateHud();
      return;
    }

    if (gameState.marketOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
        closeMarket();
        this.stationProximity = null;
        updateHud();
        return;
      }
      this.applyMarketDockingHold();
      this.updateThrustEffect(false);
      updateHud();
      return;
    }

    const shipDef = gameState.currentShip;
    if (this.keys.LEFT.isDown) this.ship.rotation -= shipDef.rotationSpeed;
    if (this.keys.RIGHT.isDown) this.ship.rotation += shipDef.rotationSpeed;
    if (this.keys.UP.isDown && gameState.profile.fuel > 0 && !gameState.marketOpen) {
      this.velocity.x += Math.cos(this.ship.rotation) * shipDef.acceleration;
      this.velocity.y += Math.sin(this.ship.rotation) * shipDef.acceleration;
      gameState.profile.fuel = Math.max(0, gameState.profile.fuel - shipDef.fuelBurnRate);
    }
    if (this.keys.DOWN.isDown && !gameState.marketOpen) {
      this.velocity.x *= 0.985;
      this.velocity.y *= 0.985;
    }

    applyBodyGravity(gameState.currentMap.primaryBody, this.ship, this.velocity);
    this.applyProximityAttraction();
    this.applyBoundaryResistance();
    this.updateThrustEffect(this.keys.UP.isDown && gameState.profile.fuel > 0 && !gameState.marketOpen);
    this.velocity.scale(0.996);
    if (this.velocity.length() > shipDef.maxSpeed) this.velocity.setLength(shipDef.maxSpeed);

    this.ship.x += this.velocity.x;
    this.ship.y += this.velocity.y;
    this.ship.x = Phaser.Math.Clamp(this.ship.x, 36, gameState.currentMap.size.width - 36);
    this.ship.y = Phaser.Math.Clamp(this.ship.y, 36, gameState.currentMap.size.height - 36);
    gameState.profile.position = { x: this.ship.x, y: this.ship.y };

    const crash = this.checkCollisionWithWorld();
    if (crash) {
      this.triggerGameOver(crash);
      updateHud();
      return;
    }

    this.handleProjectiles();
    this.handleStationDocking();
    this.handleGateJump();
    if (Phaser.Input.Keyboard.JustDown(this.keys.N)) {
      void this.startNewGame();
    }
    tickEconomy();
    this.autosaveIfNeeded();
    updateHud();
  }

  private handleProjectiles() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.firePrimaryWeapon();
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i] as any;
      p.x += p.v.x;
      p.y += p.v.y;
      applyBodyGravity(gameState.currentMap.primaryBody, p, p.v);
      p.life -= 1;
      if (p.life <= 0) {
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  firePrimaryWeapon() {
    if (gameState.profile.ammo <= 0 || gameState.marketOpen) return false;
    gameState.profile.ammo -= 1;
    const p = this.add.circle(this.ship.x, this.ship.y, 3, 0x00ffff);
    const v = new Phaser.Math.Vector2(Math.cos(this.ship.rotation) * 10, Math.sin(this.ship.rotation) * 10).add(this.velocity.clone());
    (p as any).v = v;
    (p as any).life = 120;
    this.projectiles.push(p);
    return true;
  }

  private handleStationDocking() {
    const station = gameState.currentMap.stations.find((s) => Phaser.Math.Distance.Between(this.ship.x, this.ship.y, s.x, s.y) <= s.dockingRadius);
    this.stationProximity = station?.stationId ?? null;
    if (!this.stationProximity) {
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      toggleMarket(this.stationProximity);
    }
  }

  private handleGateJump() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.G)) {
      this.jumpThroughGate();
    }
  }

  jumpThroughGate() {
    if (gameState.marketOpen) return false;
    const jumped = tryJumpGate(this.ship);
    if (jumped) {
      this.buildMap();
    }
    return jumped;
  }

  setShipTexture() {
    this.ship.setTexture(shipDefToTexture(gameState.currentShip.spriteKey));
  }

  private async startNewGame() {
    if (this.isResettingNewGame) return;
    this.isResettingNewGame = true;
    clearSavedProfile();
    await loadDefaultProfile();
    gameState.marketOpen = false;
    gameState.currentStationId = null;
    this.lastAutosave = 0;
    this.buildMap();
    updateHud();
    saveProfileToStorage();
    this.lastAutosave = Date.now();
    this.isResettingNewGame = false;
  }

  private autosaveIfNeeded() {
    const now = Date.now();
    if (now - this.lastAutosave < 5000) return;
    this.lastAutosave = now;
    saveProfileToStorage();
  }

  private triggerGameOver(reason: string) {
    this.gameOver = true;
    this.velocity.set(0, 0);
    this.thrustEmitter?.stop();
    gameState.marketOpen = false;
    closeMarket();
    showGameOver(reason);
  }

  private checkCollisionWithWorld() {
    const map = gameState.currentMap;
    const shipRadius = 27;
    const primaryRadius = map.primaryBody.radius * bodyDisplayScale(map.primaryBody.bodyClass) + shipRadius * 0.6;
    if (Phaser.Math.Distance.Between(this.ship.x, this.ship.y, map.primaryBody.x, map.primaryBody.y) <= primaryRadius) {
      return bodyDeathMessage(map.primaryBody.bodyClass);
    }

    for (const belt of map.asteroidBelts) {
      for (const asteroid of belt) {
        const asteroidRadius = asteroid.radius * 1.05 + shipRadius * 0.45;
        if (Phaser.Math.Distance.Between(this.ship.x, this.ship.y, asteroid.x, asteroid.y) <= asteroidRadius) {
          return "You smashed into an asteroid field.";
        }
      }
    }

    return null;
  }

  private applyProximityAttraction() {
    if (gameState.marketOpen) return;
    const stationTarget = gameState.currentMap.stations
      .map((station) => ({
        kind: "station" as const,
        id: station.stationId,
        x: station.x,
        y: station.y,
        radius: station.dockingRadius,
        range: station.dockingRadius + 260,
      }))
      .find((target) => Phaser.Math.Distance.Between(this.ship.x, this.ship.y, target.x, target.y) <= target.range);

    const gateTarget = gameState.currentMap.gates
      .filter(() => Date.now() >= gameState.gateTransitionCooldownUntil)
      .map((gate) => ({
        kind: "gate" as const,
        id: gate.id,
        x: gate.x,
        y: gate.y,
        radius: gate.radius,
        range: gate.radius + 280,
      }))
      .find((target) => Phaser.Math.Distance.Between(this.ship.x, this.ship.y, target.x, target.y) <= target.range);

    const target = chooseCloserTarget(this.ship, stationTarget, gateTarget);
    if (!target) return;

    const dx = target.x - this.ship.x;
    const dy = target.y - this.ship.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const strength = Phaser.Math.Clamp((target.range - distance) / target.range, 0, 1);
    const pull = target.kind === "gate" ? 0.02 + strength * 0.06 : 0.015 + strength * 0.05;
    this.velocity.x += (dx / distance) * pull;
    this.velocity.y += (dy / distance) * pull;

    if (target.kind === "gate" && distance <= target.radius + 14) {
      this.jumpThroughGate();
    }
  }

  private applyBoundaryResistance() {
    if (gameState.marketOpen) return;
    const map = gameState.currentMap;
    const margin = 180;
    const strength = 0.12;

    if (this.ship.x < margin) {
      this.velocity.x += ((margin - this.ship.x) / margin) * strength;
    } else if (this.ship.x > map.size.width - margin) {
      this.velocity.x -= ((this.ship.x - (map.size.width - margin)) / margin) * strength;
    }

    if (this.ship.y < margin) {
      this.velocity.y += ((margin - this.ship.y) / margin) * strength;
    } else if (this.ship.y > map.size.height - margin) {
      this.velocity.y -= ((this.ship.y - (map.size.height - margin)) / margin) * strength;
    }
  }

  private updateThrustEffect(active: boolean) {
    if (!this.thrustEmitter) return;
    const rearOffset = 30;
    const rearX = this.ship.x - Math.cos(this.ship.rotation) * rearOffset;
    const rearY = this.ship.y - Math.sin(this.ship.rotation) * rearOffset;
    this.thrustEmitter.setPosition(rearX, rearY);
    this.thrustEmitter.setAngle(Phaser.Math.RadToDeg(this.ship.rotation) + 180);
    this.thrustEmitter.setQuantity(active ? 2 : 0);
    this.thrustEmitter.on = active;
  }

  private applyMarketDockingHold() {
    const station = gameState.currentMap.stations.find((s) => s.stationId === gameState.currentStationId);
    if (!station) return;

    const dx = station.x - this.ship.x;
    const dy = station.y - this.ship.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const pull = Phaser.Math.Clamp(distance * 0.12, 0.5, 6);

    this.ship.x += (dx / distance) * pull;
    this.ship.y += (dy / distance) * pull;
    this.velocity.scale(0.2);

    if (distance <= 6) {
      this.ship.setPosition(station.x, station.y);
      this.velocity.set(0, 0);
    }

    this.ship.x = Phaser.Math.Clamp(this.ship.x, 36, gameState.currentMap.size.width - 36);
    this.ship.y = Phaser.Math.Clamp(this.ship.y, 36, gameState.currentMap.size.height - 36);
    gameState.profile.position = { x: this.ship.x, y: this.ship.y };
  }
}

function shipDefToTexture(spriteKey: string) {
  return spriteKey || "ship_starter";
}

function stationTextureForType(type?: string) {
  switch (type) {
    case "shipyard":
      return "station_shipyard";
    case "fuel_depot":
      return "station_fuel_depot";
    case "armory":
      return "station_armory";
    default:
      return "station_trade_hub";
  }
}

function bodyDisplayScale(bodyClass: string) {
  switch (bodyClass) {
    case "sun":
      return 2.65;
    case "planet_large":
      return 2.35;
    case "planet_medium":
      return 2.1;
    case "planet_small":
      return 1.95;
    default:
      return 1.75;
  }
}

function chooseCloserTarget(
  ship: Phaser.GameObjects.Sprite,
  stationTarget: { kind: "station"; id: string; x: number; y: number; radius: number; range: number } | undefined,
  gateTarget: { kind: "gate"; id: string; x: number; y: number; radius: number; range: number } | undefined,
) {
  if (!stationTarget) return gateTarget;
  if (!gateTarget) return stationTarget;
  const stationDistance = Phaser.Math.Distance.Between(ship.x, ship.y, stationTarget.x, stationTarget.y);
  const gateDistance = Phaser.Math.Distance.Between(ship.x, ship.y, gateTarget.x, gateTarget.y);
  return stationDistance <= gateDistance ? stationTarget : gateTarget;
}

function bodyDeathMessage(bodyClass: string) {
  switch (bodyClass) {
    case "sun":
      return "You were burned by the sun.";
    case "planet_large":
    case "planet_medium":
    case "planet_small":
      return "You crashed into a planet.";
    default:
      return "You crashed into a celestial body.";
  }
}
