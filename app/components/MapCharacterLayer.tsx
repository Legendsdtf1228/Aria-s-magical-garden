"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHARACTER_ART,
  CHARACTER_SET_VERSION,
  assertCharacterSet,
  characterArtId,
} from "../game/assets";
import type { SceneAspect } from "../game/friendRoutes";
import type { FriendId } from "../types/game";
import { LivingBunny } from "./LivingBunny";
import { LivingFrog } from "./LivingFrog";
import { LivingHomeFriend } from "./LivingHomeFriend";

type Props = {
  collected: FriendId[];
  onHearFriend: (id: FriendId) => void;
  aspect?: SceneAspect;
};

const HOME_IDS: Exclude<FriendId, "bunny" | "frog">[] = [
  "butterfly",
  "bird",
  "ladybug",
  "bee",
  "cat",
  "puppy",
];

/**
 * Map character layer — painted-garden-v1 only.
 * Never SVG / emoji / cast-v*.
 */
export function MapCharacterLayer({ collected, onHearFriend, aspect = "landscape" }: Props) {
  const [frameH, setFrameH] = useState(720);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    for (const id of collected) {
      const art = CHARACTER_ART[characterArtId(id)];
      if (art) assertCharacterSet(art, `MapCharacterLayer/${id}`);
    }
  }, [collected]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFrameH(el.clientHeight || 720);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="map-character-layer"
      aria-label="Garden friends"
      data-character-set={CHARACTER_SET_VERSION}
      data-forbid-svg="GardenAnimal"
      data-forbid-emoji="true"
    >
      {HOME_IDS.map((id) =>
        collected.includes(id) ? (
          <LivingHomeFriend key={id} id={id} aspect={aspect} frameH={frameH} onTap={onHearFriend} />
        ) : null,
      )}
      {collected.includes("bunny") && (
        <LivingBunny aspect={aspect} frameH={frameH} onTap={onHearFriend} />
      )}
      {collected.includes("frog") && (
        <LivingFrog aspect={aspect} frameH={frameH} onTap={onHearFriend} />
      )}
    </div>
  );
}
