import type { ActivityId, GardenProgress } from "../types/game";
import {
  DEFAULT_PROGRESS as CORE_DEFAULT,
  PROGRESS_STORAGE_KEY,
  loadProgress as loadProgressCore,
  markActivityComplete as markCore,
  normalizeProgress as normalizeCore,
  saveProgress as saveProgressCore,
  unlockSurprise as unlockCore,
} from "./progressCore.mjs";

export { PROGRESS_STORAGE_KEY };

export const DEFAULT_PROGRESS: GardenProgress = {
  version: CORE_DEFAULT.version,
  completedActivities: [],
  surprises: [],
};

/** Migrate / normalize progress without wiping older installs. */
export function normalizeProgress(raw: unknown): GardenProgress {
  return normalizeCore(raw) as GardenProgress;
}

export function loadProgress(
  getItem: (k: string) => string | null = (k) =>
    typeof localStorage !== "undefined" ? localStorage.getItem(k) : null,
): GardenProgress {
  return loadProgressCore(getItem) as GardenProgress;
}

export function saveProgress(
  progress: GardenProgress,
  setItem: (k: string, v: string) => void = (k, v) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
  },
) {
  saveProgressCore(progress, setItem);
}

export function markActivityComplete(progress: GardenProgress, id: ActivityId): GardenProgress {
  return markCore(progress, id) as GardenProgress;
}

export function unlockSurprise(progress: GardenProgress, id: string): GardenProgress {
  return unlockCore(progress, id) as GardenProgress;
}
