"use client";

import { useEffect, useRef, useState } from "react";
import type { FriendId } from "../types/game";
import { CHARACTER_SET_VERSION, PLAY_GATE_ART, SCENE_ART } from "../game/assets";
import type { SceneAspect } from "../game/friendRoutes";
import { ParentGateFlower } from "./ParentGate";
import { LivingBunny } from "./LivingBunny";
import { LivingFrog } from "./LivingFrog";
import { LivingHomeFriend } from "./LivingHomeFriend";

type Props = {
  collected: FriendId[];
  onPlay: () => void;
  onOpenSettings: () => void;
  onHearFriend: (id: FriendId) => void;
};

/** Welcome cast — bunny, frog, bird, butterfly, optional puppy. */
const WELCOME_HOME_FRIENDS: Exclude<FriendId, "bunny" | "frog">[] = [
  "butterfly",
  "bird",
  "puppy",
];

/**
 * Welcome — painted garden + painted-garden-v1 friends.
 * Forbidden: SVG, emoji, cast-v*, pink flower Play, WordArt title.
 */
export function WelcomeGarden({ onPlay, onOpenSettings, onHearFriend }: Props) {
  const [portrait, setPortrait] = useState(false);
  const [opening, setOpening] = useState(false);
  const [frameH, setFrameH] = useState(720);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const apply = () => setPortrait(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setFrameH(el.clientHeight || window.innerHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const aspect: SceneAspect = portrait ? "portrait" : "landscape";
  const bg = portrait
    ? SCENE_ART["welcome-garden-portrait"]
    : SCENE_ART["welcome-garden-landscape"];

  return (
    <main
      ref={rootRef}
      className={`welcome-layered ${portrait ? "is-portrait" : "is-landscape"} ${opening ? "gate-open" : ""}`}
      data-character-set={CHARACTER_SET_VERSION}
      data-forbid-svg="GardenAnimal"
      data-forbid-emoji="true"
      data-forbid-cast="cast-v1 cast-v2"
    >
      <div className="welcome-env" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg.src} alt="" className="welcome-env-img" draggable={false} />
      </div>

      <header className="welcome-ui">
        <div className="welcome-parent">
          <ParentGateFlower onOpen={onOpenSettings} />
        </div>
        <h1 className="welcome-title storybook">
          <span className="welcome-title-line">Aria&apos;s Magical Garden</span>
        </h1>
        <p className="welcome-tagline">Play and learn • Juega y aprende</p>
      </header>

      <div className="welcome-characters" aria-label="Garden friends">
        {WELCOME_HOME_FRIENDS.map((id) => (
          <LivingHomeFriend
            key={id}
            id={id}
            aspect={aspect}
            frameH={frameH}
            onTap={onHearFriend}
          />
        ))}
        <LivingBunny aspect={aspect} frameH={frameH} onTap={onHearFriend} />
        <LivingFrog aspect={aspect} frameH={frameH} onTap={onHearFriend} />
      </div>

      <button
        type="button"
        className="welcome-play-gate"
        aria-label="Play, Jugar"
        onClick={() => {
          setOpening(true);
          onPlay();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PLAY_GATE_ART} alt="" className="welcome-play-gate-art" draggable={false} />
        <span className="welcome-play-gate-hit" aria-hidden />
      </button>
    </main>
  );
}
