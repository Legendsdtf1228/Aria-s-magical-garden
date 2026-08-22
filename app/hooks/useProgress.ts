"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadProgress,
  markActivityComplete,
  saveProgress,
  unlockSurprise,
} from "../data/progress";
import type { ActivityId, GardenProgress } from "../types/game";

export function useProgress() {
  const [progress, setProgress] = useState<GardenProgress>({
    version: 1,
    completedActivities: [],
    surprises: [],
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  const completeActivity = useCallback((id: ActivityId) => {
    setProgress((prev) => {
      const next = markActivityComplete(prev, id);
      saveProgress(next);
      return next;
    });
  }, []);

  const addSurprise = useCallback((id: string) => {
    setProgress((prev) => {
      const next = unlockSurprise(prev, id);
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, ready, completeActivity, addSurprise };
}
