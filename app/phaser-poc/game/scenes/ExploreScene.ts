import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import { CHOICE_SLOTS, type Norm } from "../layouts";
import { EventBus } from "../EventBus";

/**
 * ExploreScene — tap characters/scenery for short animations + bilingual reactions.
 */
export abstract class ExploreScene extends BaseGardenScene {
  constructor(key: string) {
    super(key);
  }

  abstract backgroundKeys(): { landscape: string; portrait: string };
  abstract setupWorld(): void;

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
    const bg = this.backgroundKeys();
    this.placeBackground(bg.landscape, bg.portrait);
    this.addWoodenSign("Play in the garden", "Juega en el jardín");
    this.setupWorld();
  }

  addTappableFriend(id: string, texture: string, en: string, es: string, slotIndex: number) {
    const slots = CHOICE_SLOTS[this.aspect];
    const img = this.addCharacter(texture, slots[slotIndex % 3] as Norm);
    img.on("pointerdown", () => {
      EventBus.emit("poc-tap");
      this.hopCelebrate(img);
      this.speak(`${en}.`, `${es}.`);
      EventBus.emit("poc-animal", id);
    });
    return img;
  }

  addSceneryTap(xFrac: number, yFrac: number, en: string, es: string, surprise?: string) {
    const zone = this.add
      .zone(this.worldW * xFrac, this.worldH * yFrac, 96, 96)
      .setOrigin(0.5)
      .setInteractive();
    zone.on("pointerdown", () => {
      EventBus.emit("poc-tap");
      this.speak(en, es);
      if (surprise) EventBus.emit("poc-surprise", surprise);
    });
    return zone;
  }
}
