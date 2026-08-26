import { ChoiceScene, type ChoiceItem } from "./ChoiceScene";
import { PROP_HEIGHT_FRAC } from "../layouts";
import { EventBus } from "../EventBus";

/** Color props — transparent painted pots from /art/objects. */
const COLORS: ChoiceItem[] = [
  { id: "red", texture: "color-prop-red", en: "Red", es: "rojo", gender: "m" },
  { id: "blue", texture: "color-prop-blue", en: "Blue", es: "azul", gender: "m" },
  { id: "yellow", texture: "color-prop-yellow", en: "Yellow", es: "amarillo", gender: "m" },
  { id: "green", texture: "color-prop-green", en: "Green", es: "verde", gender: "m" },
  { id: "purple", texture: "color-prop-purple", en: "Purple", es: "morado", gender: "m" },
  { id: "orange", texture: "color-prop-orange", en: "Orange", es: "anaranjado", gender: "m" },
  { id: "pink", texture: "color-prop-pink", en: "Pink", es: "rosa", gender: "m" },
  { id: "brown", texture: "color-prop-brown", en: "Brown", es: "café", gender: "m" },
  { id: "black", texture: "color-prop-black", en: "Black", es: "negro", gender: "m" },
  { id: "white", texture: "color-prop-white", en: "White", es: "blanco", gender: "m" },
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
 * Color Garden — second complete Phaser activity.
 * Flower-patch mural, three transparent color props, bilingual prompt.
 * No cards or website UI.
 */
export class ColorGardenScene extends ChoiceScene {
  constructor() {
    super("ColorGarden");
  }

  backgroundKeys() {
    return { landscape: "color-landscape", portrait: "color-portrait" };
  }

  protected instructionEn(item: ChoiceItem): string {
    return `Find ${item.en.toLowerCase()}.`;
  }

  protected instructionEs(item: ChoiceItem): string {
    return `Encuentra el ${item.es.toLowerCase()}.`;
  }

  protected signEn(item: ChoiceItem): string {
    return `Find ${item.en}`;
  }

  protected signEs(item: ChoiceItem): string {
    return `Encuentra el ${item.es.toLowerCase()}.`;
  }

  protected choiceHeightFrac(): number {
    return PROP_HEIGHT_FRAC * 1.15;
  }

  buildRound() {
    const target = shuffle(COLORS)[0];
    const others = shuffle(COLORS.filter((c) => c.id !== target.id)).slice(0, 2);
    return { target, choices: shuffle([target, ...others]) };
  }

  onCorrect(item: ChoiceItem) {
    EventBus.emit("poc-correct", { activity: "colors", id: item.id });
  }
}
