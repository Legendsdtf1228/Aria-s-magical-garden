"use client";

import { useEffect } from "react";
import { CHARACTER_ART, assertCharacterSet, characterArtId } from "../game/assets";
import { frameSizePx, routeFor, type FriendRouteId, type SceneAspect } from "../game/friendRoutes";
import type { FriendId } from "../types/game";
import { CharacterSprite } from "./game/SceneKit";

const ROUTE_BY_FRIEND: Record<
  Exclude<FriendId, "bunny" | "frog">,
  FriendRouteId
> = {
  butterfly: "butterflyFlowerLoop",
  bird: "birdBranchRoute",
  ladybug: "ladybugLeafPath",
  bee: "beeFlowerRoute",
  cat: "catCottageArea",
  puppy: "puppyMeadowArea",
};

type Props = {
  id: Exclude<FriendId, "bunny" | "frog">;
  aspect: SceneAspect;
  frameH: number;
  onTap: (id: FriendId) => void;
};

/** Static / light-motion home for friends other than bunny & frog. */
export function LivingHomeFriend({ id, aspect, frameH, onTap }: Props) {
  const routes = routeFor(aspect);
  const routeId = ROUTE_BY_FRIEND[id];
  const route = routes[routeId];

  useEffect(() => {
    assertCharacterSet(CHARACTER_ART[characterArtId(id)], `LivingHomeFriend/${id}`);
  }, [id]);

  let x = 0.5;
  let y = 0.5;
  let scale = 1;
  let baseSize = 0.1;
  let zone = "home";

  if ("home" in route) {
    x = route.home.x;
    y = route.home.y;
    scale = route.home.scale ?? 1;
    baseSize = route.baseSize;
    zone = route.zone;
  } else if ("waypoints" in route) {
    const p = route.waypoints[0];
    x = p.x;
    y = p.y;
    scale = p.scale ?? 1;
    baseSize = route.baseSize;
    zone = route.zone;
  }

  const size = frameSizePx(frameH, baseSize, scale);
  const motionClass =
    id === "butterfly" || id === "bee"
      ? "float-soft"
      : id === "bird"
        ? "perch-soft"
        : id === "ladybug"
          ? "crawl-soft"
          : id === "puppy"
            ? "play-soft"
            : "rest-soft";

  return (
    <button
      type="button"
      className={`living-friend living-home ${motionClass}`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size,
        height: size,
        zIndex: Math.round(10 + y * 40),
      }}
      aria-label={id}
      data-route={routeId}
      data-zone={zone}
      onClick={() => onTap(id)}
    >
      <span className={`contact-shadow ${id === "bird" || id === "butterfly" || id === "bee" ? "soft-air" : ""}`} aria-hidden />
      <span className="living-body">
        <CharacterSprite id={characterArtId(id)} size={size} pose="idle" title={id} />
      </span>
    </button>
  );
}
