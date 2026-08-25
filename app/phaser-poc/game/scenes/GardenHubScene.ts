import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import {
  BUNNY_PATH,
  FROG_PAD,
  HUB_LANDMARKS,
  toPx,
  type Norm,
} from "../layouts";
import { EventBus } from "../EventBus";

/**
 * GardenHubScene — painted landmarks invite tapping.
 * Bunny feet on path; frog on lily pad; consistent toddler cast scale.
 */
export class GardenHubScene extends BaseGardenScene {
  bunny!: Phaser.GameObjects.Image;

  constructor() {
    super("GardenHub");
  }

  create() {
    this.bindSafeResize(() => this.rebuild());
    this.rebuild();
    this.emitReady();
    this.speak("Welcome to the garden.", "Bienvenida al jardín.");
  }

  rebuild() {
    this.children.removeAll(true);
    this.placeBackground("hub-landscape", "hub-portrait");
    this.addSafeChrome({ showReplay: false });

    // Title integrated as a garden plaque near the cottage roof line (not a floating website bar)
    this.addTitlePlaque();

    const marks = HUB_LANDMARKS[this.aspect];
    for (const m of marks) {
      const p = toPx(m.pos, this.worldW, this.worldH);
      const key = `lm-${m.id}`;
      const img = this.add.image(p.x, p.y, key).setOrigin(0.5, 1).setDepth(5);
      // Large, readable landmarks — ~22% of scene height
      const targetH = this.worldH * 0.22;
      img.setDisplaySize((img.width / img.height) * targetH, targetH);
      this.ensureMinTouch(img);
      // Gentle breathe — no distorting scale pulse
      this.tweens.add({
        targets: img,
        y: p.y - 4,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      img.on("pointerdown", () => {
        EventBus.emit("poc-tap");
        this.speak(m.en, m.es);
        this.time.delayedCall(450, () => this.scene.start(m.scene));
      });
    }

    // Frog — toddler cast scale, feet on lily-pad anchor
    this.addCharacter("char-frog", FROG_PAD[this.aspect] as Norm, 0.1);

    // Bunny — smaller natural scale, feet on path, hop along path
    const path = BUNNY_PATH[this.aspect];
    const start = toPx(path[0], this.worldW, this.worldH);
    this.bunny = this.add.image(start.x, start.y, "char-bunny").setOrigin(0.5, 1).setDepth(6);
    const targetH = this.worldH * 0.12 * (path[0].scale ?? 1);
    this.bunny.setDisplaySize((this.bunny.width / this.bunny.height) * targetH, targetH);
    this.playBunnyHop(path);
  }

  addTitlePlaque() {
    const x = this.aspect === "portrait" ? this.worldW * 0.5 : this.worldW * 0.22;
    const y = this.aspect === "portrait" ? this.worldH * 0.16 : this.worldH * 0.18;
    const g = this.add.container(x, y).setDepth(40);
    const w = this.aspect === "portrait" ? Math.min(300, this.worldW * 0.85) : 280;
    const board = this.add.rectangle(0, 0, w, 58, 0xb8894a).setStrokeStyle(4, 0x5a3818);
    // Post stubs so it reads as a garden sign, not a website header
    const post = this.add.rectangle(0, 36, 14, 28, 0x7a5230);
    const t1 = this.add
      .text(0, -10, "Aria's Magical Garden", {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "15px" : "17px",
        color: "#2a1808",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 16 },
      })
      .setOrigin(0.5);
    const t2 = this.add
      .text(0, 12, "El Jardín Mágico", {
        fontFamily: "Georgia, serif",
        fontSize: "13px",
        color: "#4a3010",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    g.add([post, board, t1, t2]);
  }

  playBunnyHop(path: Norm[]) {
    const pts = path.map((n) => toPx(n, this.worldW, this.worldH));
    const chain: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
    for (let i = 1; i < pts.length; i++) {
      const next = pts[i];
      chain.push({
        targets: this.bunny,
        x: next.x,
        y: next.y - this.worldH * 0.025,
        duration: 340,
        ease: "Quad.easeOut",
      });
      chain.push({
        targets: this.bunny,
        y: next.y,
        duration: 240,
        ease: "Bounce.easeOut",
      });
    }
    this.tweens.chain({
      tweens: chain,
      loop: -1,
      loopDelay: 700,
    });
  }
}
