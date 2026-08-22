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
  /** Freeze at waypoint: 0 start, 1 middle, 2 end */
  freezeWaypoint?: number;
};

type Phase = "pause" | "crouch" | "air" | "land" | "ears" | "held";

/**
 * Full-body bunny on the garden path — hops along bunnyGardenPath.
 * Feet anchored to path; contact shadow; never floats off the path.
 */
export function LivingBunny({ aspect, frameH, onTap, freezeWaypoint }: Props) {
  const route = routeFor(aspect).bunnyGardenPath;
  const pts = route.waypoints;
  const [iFrom, setIFrom] = useState(0);
  const [iTo, setITo] = useState(1);
  const [phase, setPhase] = useState<Phase>("pause");
  const [t, setT] = useState(0);
  const [held, setHeld] = useState(false);

  const phaseRef = useRef<Phase>("pause");
  const tRef = useRef(0);
  const iFromRef = useRef(0);
  const iToRef = useRef(1);
  const dirRef = useRef(1);
  const heldRef = useRef(false);
  const phaseUntil = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    assertCharacterSet(CHARACTER_ART[characterArtId("bunny")], "LivingBunny");
  }, []);

  useEffect(() => {
    if (freezeWaypoint == null) return;
    const last = pts.length - 1;
    const idx = Math.min(Math.max(0, freezeWaypoint), last);
    if (idx >= last) {
      setIFrom(last - 1);
      setITo(last);
      setT(1);
    } else if (idx === 0) {
      setIFrom(0);
      setITo(1);
      setT(0);
    } else {
      setIFrom(idx - 1);
      setITo(idx);
      setT(1);
    }
    setPhase("pause");
  }, [freezeWaypoint, pts.length]);

  useEffect(() => {
    if (freezeWaypoint != null) return;

    phaseRef.current = "pause";
    phaseUntil.current = performance.now() + 1000;

    const tick = (now: number) => {
      if (heldRef.current) {
        raf.current = requestAnimationFrame(tick);
        return;
      }

      let p = phaseRef.current;

      if (p === "pause" && now >= phaseUntil.current) {
        p = "crouch";
        phaseUntil.current = now + 170;
        phaseRef.current = p;
        setPhase(p);
      } else if (p === "crouch" && now >= phaseUntil.current) {
        p = "air";
        tRef.current = 0;
        setT(0);
        phaseRef.current = p;
        setPhase(p);
      } else if (p === "air") {
        const tr = Math.min(1, tRef.current + 0.03);
        tRef.current = tr;
        setT(tr);
        if (tr >= 1) {
          // Arrive at iTo; pick next hop along path (ping-pong)
          let nextFrom = iToRef.current;
          let dir = dirRef.current;
          let nextTo = nextFrom + dir;
          if (nextTo > pts.length - 1) {
            dir = -1;
            nextTo = nextFrom + dir;
          } else if (nextTo < 0) {
            dir = 1;
            nextTo = nextFrom + dir;
          }
          dirRef.current = dir;
          iFromRef.current = nextFrom;
          iToRef.current = nextTo;
          setIFrom(nextFrom);
          setITo(nextTo);
          tRef.current = 0;
          setT(0);
          p = "land";
          phaseUntil.current = now + 150;
          phaseRef.current = p;
          setPhase(p);
        }
      } else if (p === "land" && now >= phaseUntil.current) {
        p = "ears";
        phaseUntil.current = now + 300;
        phaseRef.current = p;
        setPhase(p);
      } else if (p === "ears" && now >= phaseUntil.current) {
        p = "pause";
        phaseUntil.current = now + 1100 + Math.random() * 900;
        phaseRef.current = p;
        setPhase(p);
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [freezeWaypoint, pts.length]);

  const from = pts[iFrom];
  const to = pts[iTo];
  const grounded = lerpPoint(from, to, easeInOut(t));
  const lift = phase === "air" ? hopLift(t, 0.042) : phase === "crouch" ? -0.005 : 0;
  const scale = grounded.scale ?? 1;
  const size = frameSizePx(frameH, route.baseSize, scale);
  const squash =
    phase === "crouch" ? "scale(1.06, 0.86)" : phase === "land" ? "scale(1.08, 0.9)" : undefined;

  const tap = useCallback(() => {
    heldRef.current = true;
    setHeld(true);
    setPhase("held");
    phaseRef.current = "held";
    onTap("bunny");
    window.setTimeout(() => {
      heldRef.current = false;
      setHeld(false);
      phaseRef.current = "pause";
      setPhase("pause");
      phaseUntil.current = performance.now() + 700;
    }, 1600);
  }, [onTap]);

  return (
    <button
      type="button"
      className={`living-friend living-bunny phase-${phase} ${held ? "is-held" : ""}`}
      style={{
        left: `${grounded.x * 100}%`,
        top: `${(grounded.y - lift) * 100}%`,
        width: size,
        height: size,
        zIndex: Math.round(10 + grounded.y * 40),
      }}
      aria-label="Bunny"
      data-route="bunnyGardenPath"
      data-zone={route.zone}
      onClick={tap}
    >
      <span className="contact-shadow" aria-hidden />
      <span className="living-body" style={squash ? { transform: squash } : undefined}>
        <CharacterSprite id="bunny-idle" size={size} pose={held ? "tap" : "idle"} title="Bunny" />
      </span>
    </button>
  );
}
