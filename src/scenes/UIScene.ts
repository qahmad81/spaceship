import Phaser from "phaser";
import { closeMarket } from "../ui";

export class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    this.input.keyboard?.on("keydown-E", () => {
      if (document.getElementById("market-panel")?.classList.contains("hidden")) return;
      closeMarket();
    });
  }
}
