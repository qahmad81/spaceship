# Project Structure

- `index.html`: App shell and canvas container.
- `style.css`: Main visual styling.
- `main.js`: Module entry point, bootstraps the game.
- `js/assets.js`: Image loading pipeline from `assets/`.
- `js/map-utils.js`: Map fetch + normalization from legacy shape data to space entities.
- `js/game.js`: Core orchestration and state container.
- `js/physics.js`: Movement, gravity, camera updates, world collisions, win condition.
- `js/combat.js`: Projectile creation, movement, and projectile-target collisions.
- `js/render.js`: World rendering, minimap rendering, station labels, particles, ship and projectiles.
- `js/ui.js`: HUD updates, objective text, overlays, start/result/crash dialogs.
- `maps/*.json`: Map definitions (stations, obstacles, gravity objects, wormholes).
- `assets/*.png`: Visual assets (ship, stations, planets, wormhole, obstacles).
- `scripts/smoke-test.mjs`: Automated map + wormhole integrity smoke test.
- `scripts/smoke-browser.mjs`: Browser smoke test (local static server + interactive headless Playwright flow).
- `package.json`: Node project metadata and test dependencies (`playwright`).
- `ai_docs/*.md`: Agent documentation system.
- `agent.md`: Agent onboarding and update policy.
