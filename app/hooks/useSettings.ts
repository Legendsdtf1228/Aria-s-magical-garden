"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParentSettings } from "../types/game";
import { SETTINGS_STORAGE_KEY } from "../types/game";

export const DEFAULT_SETTINGS: ParentSettings = {
  speechOn: true,
  musicOn: true,
  speechVolume: 1,
  musicVolume: 0.55,
  enVoiceURI: null,
  esVoiceURI: null,
};

function loadSettings(): ParentSettings {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ParentSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<ParentSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<ParentSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update, ready };
}
