import { IslandNavigator } from "./js/game.js";

let game;
window.addEventListener("load", () => {
  game = new IslandNavigator();
  window.game = game;
});
