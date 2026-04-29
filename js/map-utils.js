const STATION_IMAGE_BY_LABEL = {
  A: "space_station1",
  B: "space_station2",
  C: "space_station3",
};

function obstacleTypeByZone(x, mapWidth) {
  const ratio = x / mapWidth;
  if (ratio < 0.33) return "rock";
  if (ratio < 0.66) return "celestial_body";
  return "rock";
}

export function normalizeMap(mapData) {
  const normalized = structuredClone(mapData);

  if (!normalized.startPoint.type) {
    normalized.startPoint.type = STATION_IMAGE_BY_LABEL[normalized.startPoint.label] || "space_station1";
  }
  if (!normalized.endPoint.type) {
    normalized.endPoint.type = STATION_IMAGE_BY_LABEL[normalized.endPoint.label] || "space_station2";
  }

  if (normalized.islands && !normalized.planets) {
    normalized.planets = normalized.islands.map((island) => {
      const radius = Math.max(island.width, island.height) / 2;
      const typeBySize = radius > 65 ? "planet_large" : radius > 50 ? "planet_medium" : "planet_small";
      return {
        x: island.x + island.width / 2,
        y: island.y + island.height / 2,
        radius,
        type: typeBySize,
      };
    });
  }

  if (normalized.rocks && !normalized.celestialBodies) {
    normalized.celestialBodies = normalized.rocks.map((rock) => ({
      ...rock,
      type: rock.type || obstacleTypeByZone(rock.x, normalized.mapSize.width),
    }));
  }

  if (!normalized.wormholes) {
    normalized.wormholes = [];
  }

  if (normalized.celestialBodies) {
    normalized.celestialBodies = normalized.celestialBodies.map((body) => ({
      ...body,
      type: body.type || obstacleTypeByZone(body.x, normalized.mapSize.width),
    }));
  }

  if (normalized.targets) {
    normalized.targets = normalized.targets.map((target) => ({
      ...target,
      type: target.type || obstacleTypeByZone(target.x, normalized.mapSize.width),
    }));
  }

  return normalized;
}

export async function fetchMap(mapFileName) {
  const response = await fetch(`maps/${mapFileName}`);
  const rawMap = await response.json();
  return normalizeMap(rawMap);
}
