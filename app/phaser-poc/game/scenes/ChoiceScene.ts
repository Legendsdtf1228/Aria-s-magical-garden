import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import { CHOICE_SLOTS, type Norm } from "../layouts";
import { EventBus } from "../EventBus";

export type ChoiceItem = {
  id: string;
  texture: string;
  en: string;
  es: string;
  gender?: "m" | "f";
};

/**
 * ChoiceScene — one spoken instruction, exactly three large visual choices.
 * No website cards. Used for Find / Colors / Counting / Shapes / Sounds.
 */
export abstract class ChoiceScene extends BaseGardenScene {
  protected target!: ChoiceItem;
  protected choices: ChoiceItem[] = [];
  protected sprites: Phaser.GameObjects.Image[] = [];

  constructor(key: string) {
    super(key);
  }

  abstract backgroundKeys(): { landscape: string; portrait: string };
  abstract buildRound(): { target: ChoiceItem; choices: ChoiceItem[] };
  abstract onCorrect(item: ChoiceItem): void;

  create() {
    this.scale.on("resize", () => {
      if (!this.scene.isActive()) return;
      this.rebuild();
    });
    this.rebuild();
    this.emitReady();
  }

  rebuild() {
    this.children.removeAll(true);
    this.sprites = [];
    const bg = this.backgroundKeys();
    this.placeBackground(bg.landscape, bg.portrait);
    const round = this.buildRound();
    this.target = round.target;
    this.choices = round.choices.slice(0, 3);
    while (this.choices.length < 3) {
      this.choices.push(this.choices[0]);
    }

    const art = this.target.gender === "f" ? "la" : "el";
    this.addWoodenSign(`Find the ${this.target.en}`, `Encuentra ${art} ${this.target.es}`);
    this.speak(
      `Find the ${this.target.en.toLowerCase()}.`,
      `Encuentra ${art} ${this.target.es.toLowerCase()}.`,
    );

    const slots = CHOICE_SLOTS[this.aspect];
    this.choices.forEach((item, i) => {
      const img = this.addCharacter(item.texture, slots[i] as Norm);
      img.setData("choiceId", item.id);
      img.on("pointerdown", () => this.pick(item, img));
      this.sprites.push(img);
    });
  }

  pick(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    if (this.busy) return;
    EventBus.emit("poc-tap");
    if (item.id !== this.target.id) {
      this.gentleWiggle(img);
      this.speak("Try another one.", "Intenta otra.");
      return;
    }
    this.busy = true;
    this.hopCelebrate(img);
    this.speak(`${item.en}.`, `${item.es}.`);
    this.onCorrect(item);
    this.time.delayedCall(1400, () => {
      this.busy = false;
      this.rebuild();
    });
  }
}
