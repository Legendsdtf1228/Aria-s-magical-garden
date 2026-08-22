import type { Friend } from "../types/game";

export const FRIENDS: Friend[] = [
  { id: "butterfly", en: "Butterfly", es: "Mariposa", emoji: "🦋" },
  { id: "bunny", en: "Bunny", es: "Conejito", emoji: "🐰" },
  { id: "bird", en: "Bird", es: "Pajarito", emoji: "🐦" },
  { id: "ladybug", en: "Ladybug", es: "Mariquita", emoji: "🐞" },
  { id: "bee", en: "Bee", es: "Abejita", emoji: "🐝" },
  { id: "frog", en: "Frog", es: "Rana", emoji: "🐸" },
  { id: "cat", en: "Cat", es: "Gatito", emoji: "🐱" },
  { id: "puppy", en: "Puppy", es: "Perrito", emoji: "🐶" },
];

export const FRIEND_IDS = FRIENDS.map((f) => f.id);

export function friendById(id: string) {
  return FRIENDS.find((f) => f.id === id);
}
