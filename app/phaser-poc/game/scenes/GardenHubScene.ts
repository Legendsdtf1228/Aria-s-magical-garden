import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import {
  BUNNY_PATH,
  FROG_PAD,
  HUB_LANDMARKS,
  LANDMARK_HEIGHT_FRAC,
  toPx,
  type Norm,
} from "../layouts";
import { EventBus } from "../EventBus";

/**
 * GardenHubScene — painted landmarks visibly indicate activities.
 * Bunny hops the path; frog sits on a lily-pad anchor.
 */
export class GardenHubScene extends BaseGardenScene {
  bunny!: Phaser.GameObjects.Image;

  constructor() {
    super("GardenHub");
  }

  create() {
    this.scale.on("resize", () => this.rebuild());
    this.rebuild();
    this.emitReady();
    this.speak("Welcome to the garden.", "Bienvenida al jardín.");
  }

  rebuild() {
    this.children.removeAll(true);
    this.placeBackground("hub-landscape", "hub-portrait");

    // Title as wooden garden sign (not a menu grid)
    this.addWoodenSign("Aria's Magical Garden", "El Jardín Mágico de Aria");

    const marks = HUB_LANDMARKS[this.aspect];
    for (const m of marks) {
      const p = toPx(m.pos, this.worldW, this.worldH);
      const key = `lm-${m.id}`;
      const img = this.add.image(p.x, p.y, key).setOrigin(0.5, 1);
      const targetH = this.worldH * LANDMARK_HEIGHT_FRAC;
      img.setDisplaySize((img.width / img.height) * targetH, targetH);
      this.ensureMinTouch(img);
      // Soft glow pulse so toddlers see it is tappable
      this.tweens.add({
        targets: img,
        alpha: { from: 0.92, to: 1 },
        scaleX: img.scaleX * 1.04,
        scaleY: img.scaleY * 1.04,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      img.on("pointerdown", () => {
        EventBus.emit("poc-tap");
        this.speak(m.en, m.es);
        this.time.delayedCall(500, () => this.scene.start(m.scene));
      });
    }

    // Frog on lily pad
    this.addCharacter("char-frog", FROG_PAD[this.aspect] as Norm, 0.14);

    // Bunny hops along path
    const path = BUNNY_PATH[this.aspect];
    const start = toPx(path[0], this.worldW, this.worldH);
    this.bunny = this.add.image(start.x, start.y, "char-bunny").setOrigin(0.5, 1);
    const targetH = this.worldH * 0.2 * (path[0].scale ?? 1);
    this.bunny.setDisplaySize((this.bunny.width / this.bunny.height) * targetH, targetH);
    this.playBunnyHop(path);
  }

  playBunnyHop(path: Norm[]) {
    const pts = path.map((n) => toPx(n, this.worldW, this.worldH));
    const chain: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
    for (let i = 1; i < pts.length; i++) {
      const next = pts[i];
      const prev = pts[i - 1];
      chain.push({
        targets: this.bunny,
        x: next.x,
        y: next.y - this.worldH * 0.03,
        duration: 320,
        ease: "Quad.easeOut",
        yoyo: false,
        onStart: () => {
          /* hop up mid */
        },
      });
      chain.push({
        targets: this.bunny,
        y: next.y,
        duration: 220,
        ease: "Bounce.easeOut",
      });
      void prev;
    }
    this.tweens.chain({
      tweens: chain,
      loop: -1,
      loopDelay: 600,
    });
  }
}
