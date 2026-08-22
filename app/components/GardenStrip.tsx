"use client";

import { FRIENDS } from "../data/friends";
import type { FriendId } from "../types/game";

type Props = {
  collected: FriendId[];
  catchingId?: string | null;
  compact?: boolean;
};

export function GardenStrip({ collected, catchingId, compact }: Props) {
  return (
    <section
      className={`garden-strip ${compact ? "compact" : ""}`}
      aria-label={`Garden friends, ${collected.length} of ${FRIENDS.length}`}
    >
      <p className="garden-label">Aria&apos;s Garden • El jardín de Aria</p>
      <div className="garden-row">
        {FRIENDS.map((f) => {
          const owned = collected.includes(f.id);
          return (
            <div
              key={f.id}
              className={`garden-slot ${owned ? "owned" : "empty"} ${catchingId === f.id ? "just-caught" : ""}`}
              title={`${f.en} / ${f.es}`}
            >
              <span className="garden-emoji">{owned ? f.emoji : "○"}</span>
              {owned && <span className="garden-name">{f.en}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
