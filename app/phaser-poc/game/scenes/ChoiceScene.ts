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
 * Find Friend keeps defaults. Color Garden overrides slots / size / feedback.
 */
export abstract class ChoiceScene extends BaseGardenScene {
  protected target!: ChoiceItem;
  protected choices: ChoiceItem[] = [];
  protected sprites: Phaser.GameObjects.Image[] = [];
  protected roundReady = false;
  protected showTouchDebug = false;

  constructor(key: string) {
    super(key);
  }

  abstract backgroundKeys(): { landscape: string; portrait: string };
  abstract buildRound(): { target: ChoiceItem; choices: ChoiceItem[] };
  abstract onCorrect(item: ChoiceItem): void;

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
  /** Feet anchors — Find Friend meadow by default. */
  protected choiceSlots(): [Norm, Norm, Norm] {
    return CHOICE_SLOTS[this.aspect];
  }
  protected minTouchPx(): number {
    return 96;
  }
  /** Target visible height in CSS/game px; null = use heightFrac only. */
  protected choiceTargetHeightPx(): number | null {
    return null;
  }
  protected celebrationMs(): number {
    return 1600;
  }

  create() {
    this.roundReady = false;
    const params =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    this.showTouchDebug = params?.get("debugTouch") === "1";
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
    this.placeChoices();
  }

  protected placeChoices() {
    const slots = this.choiceSlots();
    const heightFrac = this.choiceHeightFrac();
    const targetPx = this.choiceTargetHeightPx();
    const touch = this.minTouchPx();

    this.choices.forEach((item, i) => {
      const slot = slots[i] as Norm;
      const p = { x: slot.x * this.worldW, y: slot.y * this.worldH };

      this.add
        .ellipse(p.x, p.y - 4, this.worldW * 0.11, this.worldH * 0.028, 0x1a2010, 0.38)
        .setDepth(4);

      const img = this.add.image(p.x, p.y, item.texture).setOrigin(0.5, 1).setDepth(5);
      let targetH =
        targetPx != null ? targetPx : this.worldH * heightFrac * (slot.scale ?? 1);
      // Equal visual weight: fit inside a square cell of targetH
      const cell = targetH;
      const sx = cell / img.width;
      const sy = cell / img.height;
      const s = Math.min(sx, sy);
      img.setDisplaySize(img.width * s, img.height * s);

      const hit = Math.max(touch, img.displayWidth * 1.05, img.displayHeight * 1.05);
      img.setInteractive(
        new Phaser.Geom.Rectangle(-hit / 2, -hit, hit, hit),
        Phaser.Geom.Rectangle.Contains,
      );
      img.setData("choiceId", item.id);
      img.setData("slotIndex", i);
      img.on("pointerdown", () => this.pick(item, img));
      this.sprites.push(img);

      if (this.showTouchDebug) {
        this.add
          .rectangle(p.x, p.y - hit / 2, hit, hit, 0x00ff88, 0.22)
          .setStrokeStyle(3, 0x00cc66, 0.9)
          .setDepth(40);
      }
    });
  }

  pick(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    if (this.busy) return;
    EventBus.emit("poc-tap");

    this.tweens.add({
      targets: img,
      scaleX: img.scaleX * 1.08,
      scaleY: img.scaleY * 1.08,
      duration: 90,
      yoyo: true,
    });

    if (item.id !== this.target.id) {
      this.playWrong(img);
      this.speak("Try another one.", "Intenta otra.");
      return;
    }

    this.busy = true;
    this.playCorrect(item, img);
    this.onCorrect(item);
    this.time.delayedCall(this.celebrationMs(), () => {
      this.busy = false;
      this.roundReady = false;
      this.rebuild();
    });
  }

  protected playWrong(img: Phaser.GameObjects.Image) {
    this.gentleWiggle(img);
  }

  protected playCorrect(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    this.hopCelebrate(img);
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
  }
}
