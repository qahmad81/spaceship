import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { UIScene } from "./scenes/UIScene";
import { WorldScene } from "./scenes/WorldScene";
import { gameState } from "./state";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [BootScene, WorldScene, UIScene],
  physics: {
    default: "arcade",
  },
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

(window as any).gameState = gameState;
