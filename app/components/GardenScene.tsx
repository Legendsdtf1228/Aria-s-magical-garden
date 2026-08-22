"use client";

import type { ReactNode } from "react";

type Props = {
  scene?: "flower" | "woodland" | "meadow" | "pond" | "picnic" | "stage" | "hub" | "welcome";
  children: ReactNode;
  className?: string;
};

export function GardenScene({ scene = "hub", children, className = "" }: Props) {
  return (
    <main className={`scene scene-${scene} ${className}`}>
      <div className="sky-layer" aria-hidden>
        <div className="sun" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <div className="cloud cloud-c" />
        <span className="drift-bug bug-1">🦋</span>
        <span className="drift-bug bug-2">🐝</span>
      </div>
      <div className="hill hill-back" aria-hidden />
      <div className="hill hill-mid" aria-hidden />
      <div className="path" aria-hidden />
      <div className="hill hill-front" aria-hidden />
      <div className="flower-row" aria-hidden>
        🌼 🌷 🌸 🌺
      </div>
      <div className="scene-content">{children}</div>
    </main>
  );
}
