"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onOpen: () => void;
  label?: string;
};

/** Press-and-hold ~2s to open parent settings. */
export function ParentGateFlower({ onOpen, label = "Parent settings" }: Props) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useRef(0);

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setHolding(false);
    setProgress(0);
  };

  const begin = () => {
    clear();
    setHolding(true);
    start.current = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start.current) / 2000);
      setProgress(p);
      if (p >= 1) {
        clear();
        onOpen();
      }
    }, 50);
  };

  useEffect(() => () => clear(), []);

  return (
    <button
      type="button"
      className={`parent-flower ${holding ? "holding" : ""}`}
      aria-label={label}
      style={{ ["--hold" as string]: String(progress) }}
      onPointerDown={begin}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="parent-flower-petals" aria-hidden />
      <span className="parent-flower-center" aria-hidden />
    </button>
  );
}
