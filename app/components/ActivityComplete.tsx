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
  gardenStrip: ReactNode;
};

export function ActivityComplete({
  titleEn,
  titleEs,
  stars,
  reward,
  onAgain,
  onHome,
  gardenStrip,
}: Props) {
  return (
    <section className="card complete-card">
      <div className="confetti" aria-hidden>
        ⭐ 🌈 ⭐
      </div>
      <p className="eyebrow">{titleEn}</p>
      <h1>
        Great job,<br />
        <span>Aria!</span>
      </h1>
      <p className="intro">
        {titleEs} You earned {stars} stars
        {reward?.kind === "friend" ? ` and a new friend!` : ""}.
      </p>
      <div className="bigstars">{"★".repeat(Math.min(stars, 8))}</div>
      {gardenStrip}
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
