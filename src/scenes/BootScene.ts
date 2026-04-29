import Phaser from "phaser";
import { loadDefaultProfile, loadWorldData } from "../data-loader";
import { loadProfileFromStorage, resetProfile } from "../systems/persistence-system";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("ship_starter", "/world/ships/ship_starter.png");
    this.load.image("ship_hauler", "/world/ships/ship_hauler.png");
    this.load.image("ship_interceptor", "/world/ships/ship_interceptor.png");
    this.load.image("station_trade_hub", "/world/icons/station_trade_hub.png");
    this.load.image("station_fuel_depot", "/world/icons/station_fuel_depot.png");
    this.load.image("station_armory", "/world/icons/station_armory.png");
    this.load.image("station_shipyard", "/world/icons/station_shipyard.png");
    this.load.image("sun", "/assets/sun.png");
    this.load.image("planet_large", "/assets/planet_large.png");
    this.load.image("planet_medium", "/assets/planet_medium.png");
    this.load.image("planet_small", "/assets/planet_small.png");
    this.load.image("asteroid", "/assets/rock.png");
    this.load.image("station", "/assets/space_station1.png");
    this.load.image("gate", "/assets/wormhole.png");
    this.load.image("projectile", "/assets/celestial_body.png");
  }

  async create() {
    await loadWorldData();
    this.createThrustTexture();
    const savedProfile = loadProfileFromStorage();
    if (savedProfile) {
      resetProfile(savedProfile);
    } else {
      await loadDefaultProfile();
    }
    this.scene.start("WorldScene");
    this.scene.start("UIScene");
  }

  private createThrustTexture() {
    if (this.textures.exists("thrust_particle")) {
      return;
    }

    const gfx = this.add.graphics();
    gfx.clear();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillEllipse(6, 58, 8, 18);
    gfx.fillStyle(0xffc66d, 1);
    gfx.fillEllipse(6, 58, 4, 12);
    gfx.fillStyle(0xff8a3d, 1);
    gfx.fillCircle(6, 52, 3);
    gfx.generateTexture("thrust_particle", 64, 64);
    gfx.destroy();
  }
}
