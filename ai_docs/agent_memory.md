# Agent Memory

## Decisions
- Communication with user/agents is Arabic.
- Application-facing strings and technical docs are English.
- `main.js` is intentionally slim and delegates to `js/` modules.
- Legacy map fields (`islands`, `rocks`) are normalized into space-style entities by `js/map-utils.js`.
- Wormhole-based navigation between maps is enabled through `wormholes` arrays in map JSON files.

## Conventions
- Keep rendering image-first (avoid primitive placeholder shapes unless fallback is needed).
- Preserve black space background for gameplay readability.
- Keep gameplay tuning values centralized in `js/game.js` constructor.
