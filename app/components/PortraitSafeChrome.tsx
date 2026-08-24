"use client";

import type { ReactNode } from "react";
import { ParentGateFlower } from "./ParentGate";

type Props = {
  stars?: number;
  starsNeeded?: number;
  onHome: () => void;
  onReplay?: () => void;
  onOpenSettings?: () => void;
  /** Optional center content instead of stars */
  center?: ReactNode;
};

/**
 * Shared portrait-safe chrome: Home | Stars | Replay | Parent
 * Fixed safe zones — never crop Replay to "Repla", never crowd parent into Replay.
 */
export function PortraitSafeChrome({
  stars = 0,
  starsNeeded = 0,
  onHome,
  onReplay,
  onOpenSettings,
  center,
}: Props) {
  return (
    <header className="portrait-safe-chrome" data-safe-chrome="v1">
      <div className="psc-zone psc-home">
        <button type="button" className="psc-btn psc-home-btn" onClick={onHome} aria-label="Home">
          Home
        </button>
      </div>

      <div className="psc-zone psc-center" aria-label={starsNeeded ? `${stars} of ${starsNeeded} stars` : undefined}>
        {center ??
          (starsNeeded > 0 ? (
            <div className="psc-stars">
              {Array.from({ length: starsNeeded }, (_, i) => (
                <span key={i} className={i < stars ? "on" : ""}>
                  ★
                </span>
              ))}
            </div>
          ) : (
            <span className="psc-spacer" />
          ))}
      </div>

      <div className="psc-zone psc-replay">
        {onReplay ? (
          <button type="button" className="psc-btn psc-replay-btn" onClick={onReplay} aria-label="Replay">
            Replay
          </button>
        ) : (
          <span className="psc-spacer" />
        )}
      </div>

      <div className="psc-zone psc-parent">
        {onOpenSettings ? <ParentGateFlower onOpen={onOpenSettings} /> : <span className="psc-spacer" />}
      </div>
    </header>
  );
}
