# Current Status

## Implemented
- Full runtime migration to Phaser + TypeScript + Vite.
- Open-world entry flow (no mission start screen; immediate world spawn).
- 12 connected maps with bidirectional gate links.
- Per-map single primary body (`sun`, `planet_*`, `asteroid_belt_core`) plus asteroid belts.
- Class-based gravity tuning integrated in world flight and projectile motion, with stronger pull around suns and planets.
- Docking + station market UI (buy/sell/refuel/reammo) opens and closes only with `E`.
- Player economy state: credits, cargo, fuel, ammo, ship capacities.
- Station-specialized pricing (fuel-depot and armory trade opportunities included).
- World data contracts implemented under `public/world/`.
- Automated world validation script for maps/gates/stations/goods consistency.
- Local profile persistence is now connected through `localStorage` with fallback to the default profile file.
- Generated commodity icons and station badges are now wired into the market UI.
- Economy has a bounded runtime drift + restock layer to keep trading from staying static.
- Three ship variants are now generated and purchasable/useable from the map12 shipyard.
- Automated gameplay smoke now covers market buy, combat ammo drain, longer gate routes, shipyard upgrade flow, and new-game reset.
- WorldScene now exposes explicit helpers for weapon firing and gate jumping so smoke checks can exercise gameplay flows deterministically.
- Stations now have world-layer visual beacons, type badges, and labels in the map view, and gates auto-attract from close range.
- Colliding with suns, planets, or asteroid fields now ends the game with a game-over overlay.
- Legacy profile saves are normalized on load so missing ship fields do not break startup.
- `N` now starts a fresh game by clearing the saved profile, restoring the default profile, and persisting the reset state immediately.

## Current Gaps
- Economy still needs a deeper balancing pass for price spread, stock regeneration, and anti-exploit clamps.
- World-layer station NPC/avatar treatment can still be expanded beyond the current beacon/label presentation.
