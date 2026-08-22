"use client";

import type { ReactNode } from "react";
import type { RewardResult } from "../data/collectionTypes";

type Props = {
  titleEn: string;
  titleEs: string;
  stars: number;
  reward?: RewardResult | null;
  onAgain: () => void;
  onHome: () => void;
  /** @deprecated Friends now live in the scenery */
  gardenStrip?: ReactNode;
};

export function ActivityComplete({
  titleEn,
  titleEs,
  stars,
  reward,
  onAgain,
  onHome,
}: Props) {
  return (
    <section className="complete-banner" role="status">
      <div className="confetti" aria-hidden>
        ⭐ 🌈 ⭐
      </div>
      <h2>
        Great job,<br />
        <span>Aria!</span>
      </h2>
      <p>
        {titleEn}
        <br />
        <small>{titleEs}</small>
      </p>
      <div className="bigstars">{"★".repeat(Math.min(stars, 8))}</div>
      {reward?.kind === "friend" && (
        <p className="new-friend-note">
          {reward.en} • {reward.es}
        </p>
      )}
      <div className="finish-actions">
        <button type="button" className="play" onClick={onAgain}>
          Again • Otra vez
        </button>
        <button type="button" className="play secondary" onClick={onHome}>
          Home • Inicio
        </button>
      </div>
    </section>
  );
}
