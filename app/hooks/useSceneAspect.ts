"use client";

import { useEffect, useState } from "react";
import type { SceneAspect } from "../game/friendRoutes";

/** Portrait phone layout used across activities + map. */
export function useSceneAspect(): SceneAspect {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const apply = () => setPortrait(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return portrait ? "portrait" : "landscape";
}
