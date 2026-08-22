"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GARDEN_LOCATIONS } from "../data/gardenMap";
import { nextMapScroll } from "../data/gardenMapCore.mjs";
import { SCENE_ART } from "../game/assets";
import type { ActivityId, FriendId } from "../types/game";
import { MapCharacterLayer } from "./MapCharacterLayer";
import { ParentGateFlower } from "./ParentGate";
import { TouchSafeButton } from "./game/SceneKit";

type Props = {
  collected: FriendId[];
  transitioningTo?: ActivityId | null;
  onSelect: (id: ActivityId) => void;
  onOpenSettings: () => void;
  onHearFriend: (id: FriendId) => void;
  onSpeakLocation: (en: string, es: string) => void;
  /** Explicit debug only — never auto-enabled by NODE_ENV */
  debugHotspots?: boolean;
};

/**
 * Layered garden map:
 * 1) Environment background (no animals / text / UI)
 * 2) Character sprites (collected friends only)
 * 3) Invisible semantic hotspots
 * 4) Title + child/parent UI in safe areas
 */
export function GardenMap({
  collected,
  transitioningTo,
  onSelect,
  onOpenSettings,
  onHearFriend,
  onSpeakLocation,
  debugHotspots = false,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState<ActivityId | null>(null);
  const [portrait, setPortrait] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const apply = () => setPortrait(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => () => {
    if (armTimer.current) clearTimeout(armTimer.current);
  }, []);

  const pan = useCallback((direction: "left" | "right") => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: nextMapScroll(el.scrollLeft, max, direction, Math.max(240, el.clientWidth * 0.5)),
      behavior: "smooth",
    });
  }, []);

  const tapSpot = (id: ActivityId, en: string, es: string) => {
    onSpeakLocation(en, es);
    if (armTimer.current) clearTimeout(armTimer.current);
    if (armed === id) {
      setArmed(null);
      onSelect(id);
      return;
    }
    setArmed(id);
    armTimer.current = setTimeout(() => {
      setArmed((cur) => {
        if (cur === id) {
          onSelect(id);
          return null;
        }
        return cur;
      });
    }, 600);
  };

  const bg = portrait ? SCENE_ART["garden-map-portrait"] : SCENE_ART["garden-map-landscape"];

  return (
    <main
      className={`garden-map-root ${portrait ? "is-portrait" : "is-landscape"} ${transitioningTo ? "is-zooming" : ""} ${debugHotspots ? "debug-hotspots" : ""}`}
    >
      <div className="garden-map-frame" ref={scroller}>
        <div className="garden-map-world">
          {/* LAYER 1 — environment only */}
          <div className="map-env-layer" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg.src} alt="" draggable={false} className="map-env-img" />
          </div>

          {/* LAYER 2 — characters (WebP only) */}
          <MapCharacterLayer
            collected={collected}
            onHearFriend={onHearFriend}
            aspect={portrait ? "portrait" : "landscape"}
          />

          {/* LAYER 3 — invisible hotspots */}
          <div className="map-hotspot-layer">
            {GARDEN_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className={`map-hotspot-invisible ${armed === loc.id || transitioningTo === loc.id ? "is-armed" : ""}`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  width: `max(88px, ${loc.hit}%)`,
                  height: `max(88px, ${loc.hit}%)`,
                }}
                aria-label={`${loc.en}, ${loc.es}`}
                onClick={() => tapSpot(loc.id, loc.en, loc.es)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* LAYER 4 — UI text + controls (not baked into art) */}
      <div className="map-ui-layer">
        <h1 className="map-ui-title">
          Aria&apos;s
          <span>Magical Garden</span>
        </h1>
        <div className="map-ui-parent">
          <ParentGateFlower onOpen={onOpenSettings} />
        </div>
        <TouchSafeButton
          className="map-ui-arrow left"
          aria-label="Look left"
          onClick={() => pan("left")}
        >
          ◀
        </TouchSafeButton>
        <TouchSafeButton
          className="map-ui-arrow right"
          aria-label="Look right"
          onClick={() => pan("right")}
        >
          ▶
        </TouchSafeButton>
      </div>
    </main>
  );
}
