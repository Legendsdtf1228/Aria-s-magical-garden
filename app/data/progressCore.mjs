/** Progress helpers shared by the app and Node tests (ESM). */

export const PROGRESS_STORAGE_KEY = "aria-color-garden-progress";

export const DEFAULT_PROGRESS = {
  version: 1,
  completedActivities: [],
  surprises: [],
};

export function normalizeProgress(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PROGRESS, completedActivities: [], surprises: [] };
  const completed = Array.isArray(raw.completedActivities)
    ? [...new Set(raw.completedActivities.filter((x) => typeof x === "string"))]
    : [];
  const surprises = Array.isArray(raw.surprises)
    ? [...new Set(raw.surprises.filter((x) => typeof x === "string"))]
    : [];
  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    completedActivities: completed,
    surprises,
  };
}

export function loadProgress(getItem = (k) => {
  if (typeof localStorage !== "undefined") return localStorage.getItem(k);
  return null;
}) {
  try {
    const raw = getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, completedActivities: [], surprises: [] };
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PROGRESS, completedActivities: [], surprises: [] };
  }
}

export function saveProgress(progress, setItem = (k, v) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
}) {
  try {
    setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
  } catch {
    /* ignore */
  }
}

export function markActivityComplete(progress, id) {
  if (progress.completedActivities.includes(id)) return progress;
  return {
    ...progress,
    completedActivities: [...progress.completedActivities, id],
  };
}

export function unlockSurprise(progress, id) {
  if (progress.surprises.includes(id)) return progress;
  return { ...progress, surprises: [...progress.surprises, id] };
}
