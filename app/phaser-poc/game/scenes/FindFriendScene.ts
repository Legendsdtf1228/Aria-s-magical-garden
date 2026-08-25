import { ChoiceScene, type ChoiceItem } from "./ChoiceScene";
import { EventBus } from "../EventBus";

const CAST: ChoiceItem[] = [
  { id: "butterfly", texture: "char-butterfly", en: "Butterfly", es: "Mariposa", gender: "f" },
  { id: "bunny", texture: "char-bunny", en: "Bunny", es: "Conejito", gender: "m" },
  { id: "bird", texture: "char-bird", en: "Bird", es: "Pajarito", gender: "m" },
  { id: "ladybug", texture: "char-ladybug", en: "Ladybug", es: "Mariquita", gender: "f" },
  { id: "bee", texture: "char-bee", en: "Bee", es: "Abejita", gender: "f" },
  { id: "frog", texture: "char-frog", en: "Frog", es: "Rana", gender: "f" },
  { id: "cat", texture: "char-cat", en: "Cat", es: "Gatito", gender: "m" },
  { id: "puppy", texture: "char-puppy", en: "Puppy", es: "Perrito", gender: "m" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Find My Friend — ChoiceScene proof. Exactly three painted animals. */
export class FindFriendScene extends ChoiceScene {
  constructor() {
    super("FindFriend");
  }

  backgroundKeys() {
    return { landscape: "meadow-landscape", portrait: "meadow-portrait" };
  }

  buildRound() {
    const target = shuffle(CAST)[0];
    const others = shuffle(CAST.filter((c) => c.id !== target.id)).slice(0, 2);
    return { target, choices: shuffle([target, ...others]) };
  }

  onCorrect(item: ChoiceItem) {
    EventBus.emit("poc-correct", { activity: "findFriend", id: item.id });
    EventBus.emit("poc-animal", item.id);
  }
}
