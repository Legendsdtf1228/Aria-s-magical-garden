import { ChoiceScene, type ChoiceItem } from "./ChoiceScene";
import { EventBus } from "../EventBus";

/** Coordinated toddler cast — full-body, consistent scale. */
const CAST: ChoiceItem[] = [
  { id: "bunny", texture: "char-bunny", en: "Bunny", es: "conejito", gender: "m" },
  { id: "frog", texture: "char-frog", en: "Frog", es: "rana", gender: "f" },
  { id: "puppy", texture: "char-puppy", en: "Puppy", es: "perrito", gender: "m" },
  { id: "cat", texture: "char-cat", en: "Cat", es: "gatito", gender: "m" },
  { id: "butterfly", texture: "char-butterfly", en: "Butterfly", es: "mariposa", gender: "f" },
  { id: "bird", texture: "char-bird", en: "Bird", es: "pajarito", gender: "m" },
  { id: "bee", texture: "char-bee", en: "Bee", es: "abejita", gender: "f" },
  { id: "ladybug", texture: "char-ladybug", en: "Ladybug", es: "mariquita", gender: "f" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Find My Friend — first complete Phaser activity.
 * Meadow scene, exactly three coordinated animals, bilingual instruction,
 * tap reaction, wrong wiggle, correct celebration. No cards or CSS UI.
 */
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
