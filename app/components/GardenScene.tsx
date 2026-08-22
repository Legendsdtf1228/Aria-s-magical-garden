"use client";

import type { ReactNode } from "react";
import { SCENE_ART, type SceneId } from "../game/assets";

type Props = {
  /** Painted environment scene id — never flat hills */
  sceneId?: SceneId;
  children: ReactNode;
  className?: string;
};

/**
 * V5 painted activity backdrop.
 * FORBIDDEN: flat hills, emoji bugs/flowers, sky-layer CSS hills.
 */
export function GardenScene({
  sceneId = "garden-map-landscape",
  children,
  className = "",
}: Props) {
  const art = SCENE_ART[sceneId] ?? SCENE_ART["garden-map-landscape"];
  return (
    <main className={`scene painted-scene ${className}`} data-forbid-hills="true" data-forbid-emoji="true">
      <div className="painted-scene-env" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt="" className="painted-scene-img" draggable={false} />
      </div>
      <div className="scene-content painted-scene-content">{children}</div>
    </main>
  );
}
