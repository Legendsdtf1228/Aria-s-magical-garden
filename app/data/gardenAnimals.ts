import type { FriendId } from "../types/game";

/** Garden cast — same IDs as collectible friends for localStorage compatibility. */
export type GardenAnimalId = FriendId;

export type AnimalPose = "idle" | "move" | "tap" | "celebrate" | "eat";

export type GardenAnimalDef = {
  id: GardenAnimalId;
  en: string;
  es: string;
  /** Soft Web Audio cue key */
  sound: "flutter" | "hop" | "chirp" | "crawl" | "buzz" | "ribbit" | "meow" | "bark";
  food: { en: string; es: string; kind: "carrot" | "bone" | "fish" | "seeds" | "fly" | "flower" | "berry" | "leaf" };
  signature: string;
};

export const GARDEN_ANIMALS: GardenAnimalDef[] = [
  {
    id: "butterfly",
    en: "Butterfly",
    es: "Mariposa",
    sound: "flutter",
    food: { en: "Flower nectar", es: "Néctar", kind: "flower" },
    signature: "flies and lands on flowers",
  },
  {
    id: "bunny",
    en: "Bunny",
    es: "Conejito",
    sound: "hop",
    food: { en: "Carrot", es: "Zanahoria", kind: "carrot" },
    signature: "hops and wiggles ears",
  },
  {
    id: "bird",
    en: "Bird",
    es: "Pajarito",
    sound: "chirp",
    food: { en: "Seeds", es: "Semillas", kind: "seeds" },
    signature: "flies, lands, and sings",
  },
  {
    id: "ladybug",
    en: "Ladybug",
    es: "Mariquita",
    sound: "crawl",
    food: { en: "Leaf snack", es: "Hoja", kind: "leaf" },
    signature: "crawls across leaves",
  },
  {
    id: "bee",
    en: "Bee",
    es: "Abejita",
    sound: "buzz",
    food: { en: "Flower", es: "Flor", kind: "flower" },
    signature: "buzzes between flowers",
  },
  {
    id: "frog",
    en: "Frog",
    es: "Rana",
    sound: "ribbit",
    food: { en: "Fly", es: "Mosca", kind: "fly" },
    signature: "hops and catches a fly",
  },
  {
    id: "cat",
    en: "Cat",
    es: "Gatito",
    sound: "meow",
    food: { en: "Fish", es: "Pescado", kind: "fish" },
    signature: "stretches and plays with yarn",
  },
  {
    id: "puppy",
    en: "Puppy",
    es: "Perrito",
    sound: "bark",
    food: { en: "Treat", es: "Premio", kind: "bone" },
    signature: "wags and plays with a ball",
  },
];

export function gardenAnimalById(id: string) {
  return GARDEN_ANIMALS.find((a) => a.id === id);
}
