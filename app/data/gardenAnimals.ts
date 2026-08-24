import type { FriendId } from "../types/game";

/** Garden cast — same IDs as collectible friends for localStorage compatibility. */
export type GardenAnimalId = FriendId;

export type AnimalPose = "idle" | "move" | "tap" | "celebrate" | "eat";

export type SpanishGender = "m" | "f";

export type GardenAnimalDef = {
  id: GardenAnimalId;
  en: string;
  es: string;
  /** Grammatical gender for Spanish articles (el/la, al/a la). */
  gender: SpanishGender;
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
    gender: "f",
    sound: "flutter",
    food: { en: "Flower nectar", es: "Néctar", kind: "flower" },
    signature: "flies and lands on flowers",
  },
  {
    id: "bunny",
    en: "Bunny",
    es: "Conejito",
    gender: "m",
    sound: "hop",
    food: { en: "Carrot", es: "Zanahoria", kind: "carrot" },
    signature: "hops and wiggles ears",
  },
  {
    id: "bird",
    en: "Bird",
    es: "Pajarito",
    gender: "m",
    sound: "chirp",
    food: { en: "Seeds", es: "Semillas", kind: "seeds" },
    signature: "flies, lands, and sings",
  },
  {
    id: "ladybug",
    en: "Ladybug",
    es: "Mariquita",
    gender: "f",
    sound: "crawl",
    food: { en: "Leaf snack", es: "Hoja", kind: "leaf" },
    signature: "crawls across leaves",
  },
  {
    id: "bee",
    en: "Bee",
    es: "Abejita",
    gender: "f",
    sound: "buzz",
    food: { en: "Flower", es: "Flor", kind: "flower" },
    signature: "buzzes between flowers",
  },
  {
    id: "frog",
    en: "Frog",
    es: "Rana",
    gender: "f",
    sound: "ribbit",
    food: { en: "Fly", es: "Mosca", kind: "fly" },
    signature: "hops and catches a fly",
  },
  {
    id: "cat",
    en: "Cat",
    es: "Gatito",
    gender: "m",
    sound: "meow",
    food: { en: "Fish", es: "Pescado", kind: "fish" },
    signature: "stretches and plays with yarn",
  },
  {
    id: "puppy",
    en: "Puppy",
    es: "Perrito",
    gender: "m",
    sound: "bark",
    food: { en: "Treat", es: "Premio", kind: "bone" },
    signature: "wags and plays with a ball",
  },
];

/** Definite article for toddler Spanish prompts. */
export function spanishElLa(gender: SpanishGender) {
  return gender === "f" ? "la" : "el";
}

/** "al" / "a la" for feed prompts. */
export function spanishAlALa(gender: SpanishGender) {
  return gender === "f" ? "a la" : "al";
}

export function gardenAnimalById(id: string) {
  return GARDEN_ANIMALS.find((a) => a.id === id);
}
