"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTER_ART, assertCharacterSet, characterArtId } from "../game/assets";
import {
  easeInOut,
  frameSizePx,
  hopLift,
  lerpPoint,
  routeFor,
  type SceneAspect,
} from "../game/friendRoutes";
import type { FriendId } from "../types/game";
import { CharacterSprite } from "./game/SceneKit";

type Props = {
  aspect: SceneAspect;
  frameH: number;
  onTap: (id: FriendId) => void;
  /** Review: "home" | "landing" */
  freezePose?: "home" | "landing";
};

/**
 * Frog sits on a lily pad — blink/breathe idle; tap → croak + hop to neighbor + ripple.
 */
export function LivingFrog({ aspect, frameH, onTap, freezePose }: Props) {
  const route = routeFor(aspect).frogLilyPads;
  const pads = route.pads;
  const [padIndex, setPadIndex] = useState(route.homeIndex);
  const [phase, setPhase] = useState<"idle" | "air" | "land">("idle");
  const [t, setT] = useState(0);
  const [fromIdx, setFromIdx] = useState(route.homeIndex);
  const [toIdx, setToIdx] = useState(route.homeIndex);
  const [ripple, setRipple] = useState(false);
  const [look, setLook] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    assertCharacterSet(CHARACTER_ART[characterArtId("frog")], "LivingFrog");
  }, []);

  useEffect(() => {
    if (freezePose === "home") {
      setPadIndex(route.homeIndex);
      setPhase("idle");
      setT(0);
      return;
    }
    if (freezePose === "landing") {
      const home = route.homeIndex;
      const next = (home + 1) % pads.length;
      setFromIdx(home);
      setToIdx(next);
      setPadIndex(next);
      setPhase("land");
      setT(1);
      setRipple(true);
      return;
    }

    // Idle look-around + breathe handled by CSS; occasional look class
    const id = window.setInterval(() => {
      setLook((n) => (n + 1) % 3);
    }, 3200);
    return () => clearInterval(id);
  }, [freezePose, pads.length, route.homeIndex]);

  useEffect(() => {
    if (freezePose || phase !== "air") return;
    const start = performance.now();
    const dur = 520;
    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / dur);
      setT(u);
      if (u >= 1) {
        setPhase("land");
        setPadIndex(toIdx);
        setRipple(true);
        window.setTimeout(() => setRipple(false), 700);
        window.setTimeout(() => setPhase("idle"), 240);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, toIdx, freezePose]);

  const tap = useCallback(() => {
    if (phase === "air" || freezePose) return;
    const next = (padIndex + 1) % pads.length;
    setFromIdx(padIndex);
    setToIdx(next);
    setT(0);
    setPhase("air");
    onTap("frog");
  }, [phase, padIndex, pads.length, onTap, freezePose]);

  const from = pads[fromIdx];
  const to = pads[toIdx];
  const grounded =
    phase === "air" ? lerpPoint(from, to, easeInOut(t)) : pads[padIndex];
  const lift = phase === "air" ? hopLift(t, 0.055) : 0;
  const scale = grounded.scale ?? 1;
  const size = frameSizePx(frameH, route.baseSize, scale);

  return (
    <button
      type="button"
      className={`living-friend living-frog phase-${phase} look-${look} ${ripple ? "has-ripple" : ""}`}
      style={{
        left: `${grounded.x * 100}%`,
        top: `${(grounded.y - lift) * 100}%`,
        width: size,
        height: size,
        zIndex: Math.round(12 + grounded.y * 40),
      }}
      aria-label="Frog"
      data-route="frogLilyPads"
      data-zone={route.zone}
      onClick={tap}
    >
      <span className="contact-shadow water-reflection" aria-hidden />
      {ripple && (
        <span className="pond-fx" aria-hidden>
          <span className="ripple r1" />
          <span className="ripple r2" />
          <span className="splash" />
        </span>
      )}
      <span className="living-body">
        <CharacterSprite id="frog-idle" size={size} pose={phase === "land" ? "tap" : "idle"} title="Frog" />
      </span>
    </button>
  );
}
