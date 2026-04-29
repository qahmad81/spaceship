# Current Status

## Implemented
- Main script split: large `main.js` replaced with modular `js/` architecture.
- Visual rendering switched to image assets for ship/stations/planets/asteroids/wormholes.
- Background is black in gameplay render.
- Ship is now a spaceship image (`shuttle.png`).
- Fuel depletion is active while accelerating.
- Shooting is active with ammo and cooldown.
- Map transition via wormholes is active using `wormhole.png`.
- Stations A/B/C represented with station images (`space_station1/2/3`).
- Obstacles rendered as planets/celestial bodies from assets.
- UI text has been normalized to clean English strings.
- Station labels (A/B/C) are rendered above key stations.
- Minimap is active with markers for wormholes, stations, obstacles, and ship.
- Gameplay tuning pass applied (fuel drain, fire cooldown, ship handling).
- Smoke test script exists and passes: `node scripts/smoke-test.mjs`.
- `js/game.js` has been modularized into focused runtime modules (`physics`, `combat`, `render`, `ui`).
- Browser smoke harness exists: `node scripts/smoke-browser.mjs` (static checks active now, interactive headless auto-enables when Playwright is installed).
- Wormhole transition flash effect is active.
- Target rendering now uses varied obstacle images.
- Playwright is installed locally and browser smoke now runs in full interactive mode.
- Obstacles/targets now support explicit and normalized `type` metadata (`rock` / `celestial_body`) via zone-aware normalization in `js/map-utils.js`.

## Notes
- Legacy maps are still supported through normalization logic.
- `package.json` is configured for ESM (`"type": "module"`) to match runtime modules.
- NPM test scripts are configured and passing:
  - `npm run smoke:maps`
  - `npm run smoke:browser`
  - `npm test`
