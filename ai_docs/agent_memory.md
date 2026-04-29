# Agent Memory

## Stable Decisions
- Engine is fully migrated to **Phaser + TypeScript + Vite**.
- The game loop is **open-world sandbox/tycoon**, not mission-gated.
- World uses JSON contracts under `public/world/` as source of truth.
- Gravity is class-based tuning, where `sun` is intentionally stronger than planets but still maneuverable, and the close-range pull is now tuned to feel more pronounced.
- Economy uses per-station prices and service specialization (fuel/ammo/trade differences).
- Player profile persistence uses `localStorage` with fallback to `public/world/save/profile.json`.
- `N` clears the saved profile and starts a fresh default game immediately.
- `WorldScene` exposes explicit helpers for firing a weapon and jumping gates so smoke tests can exercise gameplay deterministically.
- Stations open and close only with `E`, while gates auto-jump when you drift into their close attraction band.
- The playfield edges now apply inward resistance so the ship is nudged back inside the map instead of leaving bounds.
- Collisions with suns, planets, and asteroid fields end the current run.
- Commodity icons and station badges are loaded from `public/world/icons/` and shown in the market panel.
- Ship variants are loaded from `public/world/ships/` and can be purchased/equipped from the map12 shipyard.
- Economy has a bounded runtime drift/restock tick; deeper balancing is still a separate pass.
- `scripts/smoke-game.mjs` is the primary browser smoke for market buy, combat ammo drain, gate travel, shipyard upgrade, and new-game reset coverage.

## Conventions
- Keep gameplay systems outside scene presentation logic whenever possible.
- Use DOM overlay for dense market/HUD interaction.
- Any new map must keep gate links valid and bi-directional.
