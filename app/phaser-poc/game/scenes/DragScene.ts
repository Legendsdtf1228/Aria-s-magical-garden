import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import { FEED_FOODS, FEED_TARGETS, PROP_HEIGHT_FRAC, toPx, type Norm } from "../layouts";
import { EventBus } from "../EventBus";

export type DragFood = { kind: string; texture: string; en: string; es: string };
export type DragAnimal = {
  id: string;
  texture: string;
  en: string;
  es: string;
  gender: "m" | "f";
  foodKind: string;
};

/**
 * DragScene — painted draggable objects + large targets.
 * Gentle bounce-back, never a red failure mark.
 */
export abstract class DragScene extends BaseGardenScene {
  protected animals: DragAnimal[] = [];
  protected foods: DragFood[] = [];
  protected target!: DragAnimal;
  protected animalSprites: Phaser.GameObjects.Image[] = [];
  protected foodSprites: Phaser.GameObjects.Image[] = [];

  constructor(key: string) {
    super(key);
  }

  abstract backgroundKeys(): { landscape: string; portrait: string };
  abstract buildRound(): { target: DragAnimal; animals: DragAnimal[]; foods: DragFood[] };
  abstract onFed(animal: DragAnimal, food: DragFood): void;

  create() {
    this.bindSafeResize(() => this.rebuild());
    this.rebuild();
    this.emitReady();
  }

  rebuild() {
    this.children.removeAll(true);
    this.animalSprites = [];
    this.foodSprites = [];
    const bg = this.backgroundKeys();
    this.placeBackground(bg.landscape, bg.portrait);
    this.addSafeChrome();
    const round = this.buildRound();
    this.target = round.target;
    this.animals = round.animals.slice(0, 2);
    this.foods = round.foods.slice(0, 3);

    const prep =
      this.target.gender === "f"
        ? `Alimenta a la ${this.target.es}`
        : `Alimenta al ${this.target.es}`;
    this.addWoodenSign(`Feed the ${this.target.en}`, prep);
    this.speak(
      `Can you feed the ${this.target.en.toLowerCase()}?`,
      this.target.gender === "f"
        ? `¿Puedes alimentar a la ${this.target.es.toLowerCase()}?`
        : `¿Puedes alimentar al ${this.target.es.toLowerCase()}?`,
    );

    const animalSlots = FEED_TARGETS[this.aspect];
    this.animals.forEach((a, i) => {
      const img = this.addCharacter(a.texture, animalSlots[i] as Norm, 0.18);
      img.setData("animalId", a.id);
      this.animalSprites.push(img);
    });

    const foodSlots = FEED_FOODS[this.aspect];
    this.foods.forEach((f, i) => {
      const p = toPx(foodSlots[i] as Norm, this.worldW, this.worldH);
      const img = this.add.image(p.x, p.y, f.texture).setOrigin(0.5, 1);
      const targetH = this.worldH * PROP_HEIGHT_FRAC;
      img.setDisplaySize((img.width / img.height) * targetH, targetH);
      this.ensureMinTouch(img);
      img.setData("foodKind", f.kind);
      img.setData("homeX", p.x);
      img.setData("homeY", p.y);
      this.input.setDraggable(img);
      this.foodSprites.push(img);
    });

    this.input.off("drag");
    this.input.off("dragend");
    this.input.on(
      "drag",
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
        obj.x = x;
        obj.y = y;
      },
    );
    this.input.on("dragend", (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      this.tryDrop(obj);
    });

    this.foodSprites.forEach((img) => {
      img.on("pointerup", () => {
        if (this.busy) return;
        const kind = img.getData("foodKind") as string;
        if (kind === this.target.foodKind) {
          const animalImg = this.animalSprites.find((s) => s.getData("animalId") === this.target.id);
          if (animalImg) this.completeFeed(img, animalImg);
          else this.bounceHome(img);
        } else {
          this.bounceHome(img);
          this.speak("Let's try another one.", "Intentemos otra vez.");
        }
      });
    });
  }

  tryDrop(foodImg: Phaser.GameObjects.Image) {
    if (this.busy) return;
    const kind = foodImg.getData("foodKind") as string;
    const food = this.foods.find((f) => f.kind === kind)!;
    let hit: Phaser.GameObjects.Image | null = null;
    for (const a of this.animalSprites) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(foodImg.getBounds(), a.getBounds())) {
        hit = a;
        break;
      }
    }
    if (!hit) {
      this.bounceHome(foodImg);
      return;
    }
    const animalId = hit.getData("animalId") as string;
    const animal = this.animals.find((a) => a.id === animalId)!;
    if (animal.id !== this.target.id || food.kind !== this.target.foodKind) {
      this.bounceHome(foodImg);
      this.gentleWiggle(hit);
      this.speak("Let's try another one.", "Intentemos otra vez.");
      return;
    }
    this.completeFeed(foodImg, hit);
  }

  completeFeed(foodImg: Phaser.GameObjects.Image, animalImg: Phaser.GameObjects.Image) {
    this.busy = true;
    EventBus.emit("poc-tap");
    foodImg.setVisible(false);
    this.hopCelebrate(animalImg);
    const animal = this.target;
    const food = this.foods.find((f) => f.kind === animal.foodKind)!;
    this.speak(
      `Yum! The ${animal.en} loves ${food.en}.`,
      animal.gender === "f"
        ? `¡Ñam! A la ${animal.es.toLowerCase()} le encanta.`
        : `¡Ñam! Al ${animal.es.toLowerCase()} le encanta.`,
    );
    this.onFed(animal, food);
    this.time.delayedCall(1600, () => {
      this.busy = false;
      this.rebuild();
    });
  }

  bounceHome(img: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: img,
      x: img.getData("homeX"),
      y: img.getData("homeY"),
      duration: 280,
      ease: "Back.easeOut",
    });
  }
}
