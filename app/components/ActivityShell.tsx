"use client";

import type { ReactNode } from "react";
import type { ActivityId, FriendId } from "../types/game";
import { ACTIVITIES } from "../data/catalog";
import { ParentGateFlower } from "./ParentGate";
import { GardenScene } from "./GardenScene";
import type { SceneId } from "../game/assets";

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

const ACTIVITY_SCENE: Partial<Record<ActivityId, SceneId>> = {
  colors: "garden-map-landscape",
  findFriend: "garden-map-landscape",
  counting: "counting-pond",
  feed: "garden-map-landscape",
  animalSounds: "garden-map-landscape",
  gardenCare: "garden-map-landscape",
  freePlay: "garden-map-landscape",
  shapes: "garden-map-landscape",
  music: "garden-map-landscape",
  animals: "garden-map-landscape",
};

/**
 * V5 toddler activity chrome — painted environment only.
 * REMOVED: LivingFriends SVG, FloatingFriends SVG, flat hills GardenScene.
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
  const meta = ACTIVITIES.find((a) => a.id === activityId)!;
  const scene = sceneId ?? ACTIVITY_SCENE[activityId] ?? "garden-map-landscape";
  return (
    <GardenScene
      sceneId={scene}
      className={`activity-shell immersive-activity painted-activity ${busy ? "busy" : ""}`}
    >
      <header className="activity-header toddler-header painted-header">
        <button type="button" className="icon-btn home-fab" onClick={onHomeRequest} aria-label="Home">
          Home
        </button>
        {starsNeeded > 0 ? (
          <div className="stars" aria-label={`${stars} of ${starsNeeded} stars`}>
            {Array.from({ length: starsNeeded }, (_, i) => (
              <span key={i} className={i < stars ? "on" : ""}>
                ★
              </span>
            ))}
          </div>
        ) : (
          <span className="header-spacer" />
        )}
        <div className="header-actions">
          {onRepeat && (
            <button type="button" className="icon-btn replay-fab" onClick={onRepeat} aria-label="Replay">
              Replay
            </button>
          )}
          {onOpenSettings && <ParentGateFlower onOpen={onOpenSettings} />}
        </div>
      </header>

      <div className="activity-stage painted-stage">{children}</div>
      <span className="sr-only">{meta.en}</span>
    </GardenScene>
  );
}
