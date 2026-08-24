"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GARDEN_LOCATIONS } from "../data/gardenMap";
import { nextMapScroll } from "../data/gardenMapCore.mjs";
import { MAP_LANDMARK_ART, SCENE_ART } from "../game/assets";
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
 * 1) Environment background
 * 2) Painted activity landmarks (visible tappable cues)
 * 3) Character sprites (collected friends)
 * 4) Hotspot buttons over landmarks
 * 5) Title + child/parent UI
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

  useEffect(
    () => () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    },
    [],
  );

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
          <div className="map-env-layer" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg.src} alt="" draggable={false} className="map-env-img" />
          </div>

          <div className="map-landmark-layer" aria-hidden>
            {GARDEN_LOCATIONS.map((loc) => {
              const src = MAP_LANDMARK_ART[loc.id];
              if (!src) return null;
              const lit = armed === loc.id || transitioningTo === loc.id;
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`lm-${loc.id}`}
                  src={src}
                  alt=""
                  draggable={false}
                  className={`map-landmark ${lit ? "is-armed" : ""}`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  width: `max(120px, ${loc.hit + 6}%)`,
                }}
                />
              );
            })}
          </div>

          <MapCharacterLayer
            collected={collected}
            onHearFriend={onHearFriend}
            aspect={portrait ? "portrait" : "landscape"}
          />

          <div className="map-hotspot-layer">
            {GARDEN_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className={`map-hotspot-visible ${armed === loc.id || transitioningTo === loc.id ? "is-armed" : ""}`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  width: `max(120px, ${loc.hit + 6}%)`,
                  height: `max(120px, ${loc.hit + 6}%)`,
                }}
                aria-label={`${loc.en}, ${loc.es}`}
                onClick={() => tapSpot(loc.id, loc.en, loc.es)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="map-ui-layer">
        <h1 className="map-ui-title">
          Aria&apos;s
          <span>Magical Garden</span>
        </h1>
        <div className="map-ui-parent">
          <ParentGateFlower onOpen={onOpenSettings} />
        </div>
        <div className="map-nav-gutter left" aria-hidden={false}>
          <TouchSafeButton className="map-ui-arrow left" aria-label="Look left" onClick={() => pan("left")}>
            <span className="map-arrow-glyph" aria-hidden>
              ◀
            </span>
          </TouchSafeButton>
        </div>
        <div className="map-nav-gutter right">
          <TouchSafeButton className="map-ui-arrow right" aria-label="Look right" onClick={() => pan("right")}>
            <span className="map-arrow-glyph" aria-hidden>
              ▶
            </span>
          </TouchSafeButton>
        </div>
      </div>
    </main>
  );
}
