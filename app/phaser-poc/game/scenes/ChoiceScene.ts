import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import { CHAR_HEIGHT_FRAC, CHOICE_SLOTS, type Norm } from "../layouts";
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
 * No website cards. Find Friend is the first complete Phaser activity.
 */
export abstract class ChoiceScene extends BaseGardenScene {
  protected target!: ChoiceItem;
  protected choices: ChoiceItem[] = [];
  protected sprites: Phaser.GameObjects.Image[] = [];
  protected roundReady = false;

  constructor(key: string) {
    super(key);
  }

  abstract backgroundKeys(): { landscape: string; portrait: string };
  abstract buildRound(): { target: ChoiceItem; choices: ChoiceItem[] };
  abstract onCorrect(item: ChoiceItem): void;

  /** Spoken / signed prompts — Find Friend default; Color Garden overrides. */
  protected instructionEn(item: ChoiceItem): string {
    return `Find the ${item.en.toLowerCase()}.`;
  }
  protected instructionEs(item: ChoiceItem): string {
    const art = item.gender === "f" ? "la" : "el";
    return `Encuentra ${art} ${item.es.toLowerCase()}.`;
  }
  protected signEn(item: ChoiceItem): string {
    return `Find the ${item.en}`;
  }
  protected signEs(item: ChoiceItem): string {
    const art = item.gender === "f" ? "la" : "el";
    return `Encuentra ${art} ${item.es.toLowerCase()}.`;
  }
  protected choiceHeightFrac(): number {
    return CHAR_HEIGHT_FRAC;
  }

  create() {
    this.roundReady = false;
    this.bindSafeResize(() => this.rebuild());
    this.rebuild();
    this.emitReady();
  }

  rebuild() {
    this.children.removeAll(true);
    this.sprites = [];
    const bg = this.backgroundKeys();
    this.placeBackground(bg.landscape, bg.portrait);
    this.addSafeChrome();

    if (!this.roundReady) {
      const round = this.buildRound();
      this.target = round.target;
      this.choices = round.choices.slice(0, 3);
      while (this.choices.length < 3) this.choices.push(this.choices[0]);
      this.roundReady = true;
      this.speak(this.instructionEn(this.target), this.instructionEs(this.target));
    }

    this.addWoodenSign(this.signEn(this.target), this.signEs(this.target));

    const slots = CHOICE_SLOTS[this.aspect];
    const heightFrac = this.choiceHeightFrac();
    this.choices.forEach((item, i) => {
      const slot = slots[i] as Norm;
      const p = {
        x: slot.x * this.worldW,
        y: slot.y * this.worldH,
      };
      // Contact shadow under feet
      this.add
        .ellipse(p.x, p.y - 2, this.worldW * 0.08, this.worldH * 0.022, 0x1a2010, 0.35)
        .setDepth(4);

      const img = this.addCharacter(item.texture, slot, heightFrac);
      img.setDepth(5);
      img.setData("choiceId", item.id);
      img.on("pointerdown", () => this.pick(item, img));
      this.sprites.push(img);
    });
  }

  pick(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    if (this.busy) return;
    EventBus.emit("poc-tap");
    // Immediate tap reaction
    this.tweens.add({
      targets: img,
      scaleX: img.scaleX * 1.08,
      scaleY: img.scaleY * 1.08,
      duration: 90,
      yoyo: true,
    });

    if (item.id !== this.target.id) {
      this.gentleWiggle(img);
      this.tweens.add({
        targets: img,
        alpha: 0.55,
        duration: 120,
        yoyo: true,
        hold: 80,
      });
      this.speak("Try another one.", "Intenta otra.");
      return;
    }

    this.busy = true;
    this.hopCelebrate(img);
    // Happy sparkles
    for (let i = 0; i < 6; i++) {
      const s = this.add
        .circle(
          img.x + (Math.random() - 0.5) * img.displayWidth,
          img.y - img.displayHeight * (0.3 + Math.random() * 0.5),
          3 + Math.random() * 3,
          0xfff2a8,
          0.9,
        )
        .setDepth(20);
      this.tweens.add({
        targets: s,
        y: s.y - 30,
        alpha: 0,
        duration: 500,
        onComplete: () => s.destroy(),
      });
    }
    this.speak(`Yes! ${item.en}.`, `¡Sí! ${item.es.toLowerCase()}.`);
    this.onCorrect(item);
    this.time.delayedCall(1600, () => {
      this.busy = false;
      this.roundReady = false;
      this.rebuild();
    });
  }
}
