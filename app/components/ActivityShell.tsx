"use client";

import type { ReactNode } from "react";
import type { ActivityId, FriendId } from "../types/game";
import { ACTIVITIES } from "../data/catalog";
import { FloatingFriends } from "./FloatingFriends";
import { GardenScene } from "./GardenScene";
import { GardenStrip } from "./GardenStrip";

type Props = {
  activityId: ActivityId;
  stars: number;
  starsNeeded: number;
  collected: FriendId[];
  catchingId?: string | null;
  busy: boolean;
  speechOn: boolean;
  onToggleSpeech: () => void;
  onHomeRequest: () => void;
  onCatchFriend: (id: FriendId) => void;
  onRepeat?: () => void;
  children: ReactNode;
};

export function ActivityShell({
  activityId,
  stars,
  starsNeeded,
  collected,
  catchingId,
  busy,
  speechOn,
  onToggleSpeech,
  onHomeRequest,
  onCatchFriend,
  onRepeat,
  children,
}: Props) {
  const meta = ACTIVITIES.find((a) => a.id === activityId)!;
  return (
    <GardenScene scene={meta.scene as "flower"} className={`activity-shell ${busy ? "busy" : ""}`}>
      <header className="activity-header">
        <div>
          <p className="mini">{meta.en.toUpperCase()}</p>
          <div className="stars" aria-label={`${stars} of ${starsNeeded} stars`}>
            {Array.from({ length: starsNeeded }, (_, i) => (
              <span key={i} className={i < stars ? "on" : ""}>
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="header-actions">
          {onRepeat && (
            <button type="button" className="icon-btn" onClick={onRepeat} aria-label="Repeat">
              🔊
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleSpeech}
            aria-label="Toggle speech"
          >
            {speechOn ? "🔈" : "🔇"}
          </button>
          <button type="button" className="icon-btn" onClick={onHomeRequest} aria-label="Home">
            🏠
          </button>
        </div>
      </header>
      <GardenStrip collected={collected} catchingId={catchingId} />
      {children}
      <FloatingFriends
        collected={collected}
        paused={busy}
        active
        onCatch={onCatchFriend}
      />
    </GardenScene>
  );
}
