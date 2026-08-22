"use client";

import { useEffect, useRef, useState } from "react";
import { FRIENDS } from "../data/friends";
import type { FriendId } from "../types/game";

type Floater = { key: number; id: FriendId; lane: number; duration: number };

type Props = {
  collected: FriendId[];
  paused: boolean;
  active: boolean;
  onCatch: (id: FriendId) => void;
};

export function FloatingFriends({ collected, paused, active, onCatch }: Props) {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const keyRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectedRef = useRef(collected);
  const pausedRef = useRef(paused);
  collectedRef.current = collected;
  pausedRef.current = paused;

  useEffect(() => {
    if (!active) {
      setFloaters([]);
      return;
    }
    const spawn = () => {
      if (pausedRef.current) {
        timer.current = setTimeout(spawn, 1200);
        return;
      }
      const pool = FRIENDS.filter((f) => !collectedRef.current.includes(f.id));
      if (!pool.length) {
        setFloaters([]);
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const key = ++keyRef.current;
      setFloaters((prev) => [
        ...prev.slice(-1),
        {
          key,
          id: pick.id,
          lane: Math.floor(Math.random() * 3),
          duration: 7 + Math.random() * 4,
        },
      ]);
      timer.current = setTimeout(spawn, 4500 + Math.random() * 3500);
    };
    timer.current = setTimeout(spawn, 2000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={`floater-layer ${paused ? "paused" : ""}`} aria-label="Catchable friends">
      {!paused &&
        floaters.map((f) => {
          const friend = FRIENDS.find((x) => x.id === f.id);
          if (!friend) return null;
          return (
            <button
              key={f.key}
              type="button"
              className={`floater lane-${f.lane}`}
              style={{ ["--dur" as string]: `${f.duration}s` }}
              onClick={() => {
                setFloaters((prev) => prev.filter((x) => x.key !== f.key));
                onCatch(f.id);
              }}
              aria-label={`Catch ${friend.en}, ${friend.es}`}
            >
              {friend.emoji}
            </button>
          );
        })}
    </div>
  );
}
