import type { ActivityId, FriendId } from "../types/game";
import { FRIEND_ROUTES } from "../game/friendRoutes";

/** Activity hotspots — percentages of the illustrated frame (not the browser chrome). */
export type GardenLocation = {
  id: ActivityId;
  spot: string;
  en: string;
  es: string;
  /** Center X % within the art frame */
  x: number;
  /** Center Y % within the art frame */
  y: number;
  /** Hit area size as % of frame width */
  hit: number;
};

/**
 * Positions aligned to garden-map-landscape / portrait focal points:
 * cottage left, tree mid-left, picnic foreground, gazebo mid-right, pond right.
 */
export const GARDEN_LOCATIONS: GardenLocation[] = [
  { id: "colors", spot: "flower-beds", en: "Color Garden", es: "Jardín de Colores", x: 10, y: 58, hit: 11 },
  { id: "feed", spot: "picnic-blanket", en: "Feed the Friends", es: "Alimenta a los Amigos", x: 24, y: 72, hit: 12 },
  { id: "findFriend", spot: "open-meadow", en: "Find My Friend", es: "Busca a Mi Amigo", x: 42, y: 52, hit: 11 },
  { id: "animalSounds", spot: "large-tree", en: "Animal Sounds", es: "Sonidos de Animales", x: 34, y: 30, hit: 12 },
  { id: "gardenCare", spot: "garden-beds", en: "Garden Care", es: "Cuidar el Jardín", x: 48, y: 64, hit: 11 },
  { id: "freePlay", spot: "path-meadow", en: "Free Play Garden", es: "Jardín Libre", x: 56, y: 48, hit: 11 },
  { id: "shapes", spot: "bridge-stones", en: "Shape Meadow", es: "Prado de Formas", x: 52, y: 76, hit: 11 },
  { id: "counting", spot: "pond", en: "Counting Pond", es: "Estanque de Contar", x: 80, y: 62, hit: 13 },
  { id: "music", spot: "gazebo", en: "Music and Movement", es: "Música y Movimiento", x: 70, y: 36, hit: 12 },
  { id: "animals", spot: "cottage-path", en: "Animal Friends", es: "Amigos Animales", x: 16, y: 48, hit: 11 },
];

function homeFromRoutes(id: FriendId): { left: string; top: string; size: number; zone: string } {
  const L = FRIEND_ROUTES.landscape;
  if (id === "bunny") {
    const p = L.bunnyGardenPath.waypoints[0];
    return { left: `${p.x * 100}%`, top: `${p.y * 100}%`, size: 110, zone: L.bunnyGardenPath.zone };
  }
  if (id === "frog") {
    const p = L.frogLilyPads.pads[L.frogLilyPads.homeIndex];
    return { left: `${p.x * 100}%`, top: `${p.y * 100}%`, size: 100, zone: L.frogLilyPads.zone };
  }
  const map = {
    butterfly: L.butterflyFlowerLoop,
    bird: L.birdBranchRoute,
    ladybug: L.ladybugLeafPath,
    bee: L.beeFlowerRoute,
    cat: L.catCottageArea,
    puppy: L.puppyMeadowArea,
  } as const;
  const r = map[id];
  if ("home" in r) {
    return { left: `${r.home.x * 100}%`, top: `${r.home.y * 100}%`, size: 104, zone: r.zone };
  }
  const p = r.waypoints[0];
  return { left: `${p.x * 100}%`, top: `${p.y * 100}%`, size: 90, zone: r.zone };
}

/** Collected-friend homes — derived from named FRIEND_ROUTES (never baked into background). */
export const FRIEND_HOMES: Record<
  FriendId,
  { left: string; top: string; size: number; zone: string }
> = {
  butterfly: homeFromRoutes("butterfly"),
  bunny: homeFromRoutes("bunny"),
  bird: homeFromRoutes("bird"),
  ladybug: homeFromRoutes("ladybug"),
  bee: homeFromRoutes("bee"),
  frog: homeFromRoutes("frog"),
  cat: homeFromRoutes("cat"),
  puppy: homeFromRoutes("puppy"),
};

export function locationByActivity(id: ActivityId) {
  return GARDEN_LOCATIONS.find((l) => l.id === id);
}
