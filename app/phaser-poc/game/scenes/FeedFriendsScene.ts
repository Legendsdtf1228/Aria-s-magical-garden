import { DragScene, type DragAnimal, type DragFood } from "./DragScene";
import { EventBus } from "../EventBus";

const ANIMALS: DragAnimal[] = [
  { id: "bunny", texture: "char-bunny", en: "Bunny", es: "Conejito", gender: "m", foodKind: "carrot" },
  { id: "puppy", texture: "char-puppy", en: "Puppy", es: "Perrito", gender: "m", foodKind: "bone" },
  { id: "cat", texture: "char-cat", en: "Cat", es: "Gatito", gender: "m", foodKind: "fish" },
  { id: "bird", texture: "char-bird", en: "Bird", es: "Pajarito", gender: "m", foodKind: "seeds" },
  { id: "bee", texture: "char-bee", en: "Bee", es: "Abejita", gender: "f", foodKind: "flower" },
  { id: "frog", texture: "char-frog", en: "Frog", es: "Rana", gender: "f", foodKind: "fly" },
  { id: "ladybug", texture: "char-ladybug", en: "Ladybug", es: "Mariquita", gender: "f", foodKind: "leaf" },
  { id: "butterfly", texture: "char-butterfly", en: "Butterfly", es: "Mariposa", gender: "f", foodKind: "flower" },
];

const FOODS: DragFood[] = [
  { kind: "carrot", texture: "food-carrot", en: "Carrot", es: "Zanahoria" },
  { kind: "bone", texture: "food-bone", en: "Treat", es: "Premio" },
  { kind: "fish", texture: "food-fish", en: "Fish", es: "Pescado" },
  { kind: "seeds", texture: "food-seeds", en: "Seeds", es: "Semillas" },
  { kind: "flower", texture: "food-flower", en: "Flower", es: "Flor" },
  { kind: "fly", texture: "food-fly", en: "Fly", es: "Mosca" },
  { kind: "leaf", texture: "food-leaf", en: "Leaf", es: "Hoja" },
  { kind: "berry", texture: "food-berry", en: "Berry", es: "Baya" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Feed the Friends — DragScene proof. */
export class FeedFriendsScene extends DragScene {
  constructor() {
    super("FeedFriends");
  }

  backgroundKeys() {
    return { landscape: "picnic-landscape", portrait: "picnic-portrait" };
  }

  buildRound() {
    const target = shuffle(ANIMALS)[0];
    const other = shuffle(ANIMALS.filter((a) => a.id !== target.id))[0];
    const wrong = shuffle(FOODS.filter((f) => f.kind !== target.foodKind)).slice(0, 2);
    const right = FOODS.find((f) => f.kind === target.foodKind)!;
    return {
      target,
      animals: shuffle([target, other]),
      foods: shuffle([right, ...wrong]),
    };
  }

  onFed(animal: DragAnimal, food: DragFood) {
    EventBus.emit("poc-correct", { activity: "feed", id: animal.id, food: food.kind });
    EventBus.emit("poc-animal", animal.id);
  }
}
