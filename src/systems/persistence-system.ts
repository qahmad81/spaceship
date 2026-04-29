import { gameState } from "../state";
import type { PlayerProfile } from "../types";

const STORAGE_KEY = "open-world-space-tycoon-profile-v1";

function normalizeProfile(profile: Partial<PlayerProfile>): PlayerProfile {
  return {
    credits: profile.credits ?? 3000,
    cargo: { ...(profile.cargo ?? {}) },
    fuel: profile.fuel ?? 200,
    ammo: profile.ammo ?? 30,
    ownedShips: [...(profile.ownedShips ?? ["starter_shuttle"])],
    currentShip: profile.currentShip ?? "starter_shuttle",
    currentMap: profile.currentMap ?? "map01",
    position: {
      x: profile.position?.x ?? 400,
      y: profile.position?.y ?? 300,
    },
  };
}

export function loadProfileFromStorage(): PlayerProfile | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export function saveProfileToStorage() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProfile(gameState.profile)));
}

export function clearSavedProfile() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function resetProfile(profile: PlayerProfile) {
  gameState.profile = normalizeProfile(profile);
}
