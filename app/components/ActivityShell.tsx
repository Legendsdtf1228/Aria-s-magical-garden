"use client";

import type { ReactNode } from "react";
import type { ActivityId, FriendId } from "../types/game";
import { ACTIVITIES } from "../data/catalog";
import { GardenScene } from "./GardenScene";
import { PortraitSafeChrome } from "./PortraitSafeChrome";
import { useSceneAspect } from "../hooks/useSceneAspect";
import type { SceneId } from "../game/assets";
import "./portraitSafeChrome.css";
import "./paintedGarden.css";

type Props = {
  activityId: ActivityId;
  stars: number;
  starsNeeded: number;
  collected: FriendId[];
  catchingId?: string | null;
  busy: boolean;
  speechOn: boolean;
  onToggleSpeech?: () => void;
  onHomeRequest: () => void;
  onCatchFriend: (id: FriendId) => void;
  onHearFriend?: (id: FriendId) => void;
  onOpenSettings?: () => void;
  onRepeat?: () => void;
  sceneId?: SceneId;
  children: ReactNode;
};

const ACTIVITY_SCENES: Partial<
  Record<ActivityId, { landscape: SceneId; portrait: SceneId }>
> = {
  colors: {
    landscape: "color-flower-patch-landscape",
    portrait: "color-flower-patch-portrait",
  },
  findFriend: {
    landscape: "animal-meadow-landscape",
    portrait: "animal-meadow-portrait",
  },
  counting: {
    landscape: "counting-pond-landscape",
    portrait: "counting-pond-portrait",
  },
};

/**
 * V5 toddler activity chrome — dedicated painted scenes + shared safe controls.
 * Never reuses garden-map for Find / Color / Counting.
 */
export function ActivityShell({
  activityId,
  stars,
  starsNeeded,
  busy,
  onHomeRequest,
  onOpenSettings,
  onRepeat,
  sceneId,
  children,
}: Props) {
  const aspect = useSceneAspect();
  const meta = ACTIVITIES.find((a) => a.id === activityId)!;
  const pair = ACTIVITY_SCENES[activityId];
  const scene =
    sceneId ??
    (pair ? pair[aspect] : aspect === "portrait" ? "garden-map-portrait" : "garden-map-landscape");

  return (
    <GardenScene
      sceneId={scene}
      className={`activity-shell immersive-activity painted-activity uses-safe-chrome ${busy ? "busy" : ""}`}
    >
      <PortraitSafeChrome
        stars={stars}
        starsNeeded={starsNeeded}
        onHome={onHomeRequest}
        onReplay={onRepeat}
        onOpenSettings={onOpenSettings}
      />
      <div className="activity-stage painted-stage">{children}</div>
      <span className="sr-only">{meta.en}</span>
    </GardenScene>
  );
}
