# Project Structure

- `src/main.ts`: Phaser game bootstrap.
- `src/scenes/`: `BootScene`, `WorldScene`, `UIScene` with world station beacons and market interactions.
- `src/systems/`: gameplay systems (`gravity`, `economy`, `world-transition`).
- `src/state.ts`: shared world/player runtime state.
- `src/data-loader.ts`: loads world JSON contracts.
- `src/ui.ts`: DOM HUD + market panel bindings.
- `src/systems/persistence-system.ts`: profile load/save through `localStorage`.
- `public/world/maps/*.json`: open-world maps (12 maps) + gates.
- `public/world/stations/*.json`: per-station market/service config.
- `public/world/data/goods.json`: tradable goods catalog.
- `public/world/data/ships.json`: ship stats and capacities.
- `public/world/ships/*.png`: generated ship variants used by the shipyard and world sprite.
- `public/world/save/profile.json`: default profile shape.
- `public/world/icons/*.png`: generated commodity and station badges.
- `scripts/validate-world.mjs`: topology + schema consistency smoke validation.
- `scripts/smoke-game.mjs`: browser smoke test for market, gate travel, and shipyard upgrade flow.
- `assets/*.png`: current runtime textures (ship, stations, planets, gate, asteroid).
