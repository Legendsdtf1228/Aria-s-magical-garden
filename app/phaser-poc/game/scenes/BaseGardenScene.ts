import Phaser from "../phaserCompat";
import {
  CHAR_HEIGHT_FRAC,
  detectAspect,
  LAYOUT,
  MIN_TOUCH_CSS_PX,
  toPx,
  type Norm,
  type PocAspect,
  UI_SAFE,
} from "../layouts";
import { EventBus } from "../EventBus";

/** Shared helpers for toddler Phaser scenes. */
export abstract class BaseGardenScene extends Phaser.Scene {
  aspect: PocAspect = "landscape";
  worldW = LAYOUT.landscape.w;
  worldH = LAYOUT.landscape.h;
  bg!: Phaser.GameObjects.Image;
  busy = false;
  private rebuildQueued = false;
  private chromeBuilt = false;

  constructor(key: string) {
    super(key);
  }

  ensureAspect() {
    const pw = this.scale.width || window.innerWidth;
    const ph = this.scale.height || window.innerHeight;
    this.aspect = detectAspect(pw, ph);
    // Use live canvas size (RESIZE) so we fill the viewport with no gutters
    this.worldW = pw;
    this.worldH = ph;
  }

  placeBackground(keyLandscape: string, keyPortrait: string) {
    this.ensureAspect();
    const key = this.aspect === "portrait" ? keyPortrait : keyLandscape;
    if (this.bg) this.bg.destroy();
    this.bg = this.add.image(this.worldW / 2, this.worldH / 2, key);
    // Cover the game view — intentional portrait/landscape murals; no green gutters
    const sx = this.worldW / this.bg.width;
    const sy = this.worldH / this.bg.height;
    const s = Math.max(sx, sy);
    this.bg.setScale(s).setOrigin(0.5).setDepth(0);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.centerOn(this.worldW / 2, this.worldH / 2);
    this.cameras.main.setBackgroundColor(0x1a2a18);
  }

  /** Debounced rebuild on resize — prevents infinite setGameSize loops. */
  bindSafeResize(rebuild: () => void) {
    this.scale.off("resize");
    this.scale.on("resize", () => {
      if (!this.scene.isActive()) return;
      if (this.rebuildQueued) return;
      this.rebuildQueued = true;
      this.time.delayedCall(50, () => {
        this.rebuildQueued = false;
        if (!this.scene.isActive()) return;
        rebuild();
      });
    });
  }

  /** Feet / bottom-center anchor character. */
  addCharacter(texture: string, norm: Norm, heightFrac = CHAR_HEIGHT_FRAC) {
    const p = toPx(norm, this.worldW, this.worldH);
    const img = this.add.image(p.x, p.y, texture).setOrigin(0.5, 1);
    const targetH = this.worldH * heightFrac * (norm.scale ?? 1);
    img.setDisplaySize((img.width / img.height) * targetH, targetH);
    this.ensureMinTouch(img);
    this.idleSway(img);
    return img;
  }

  ensureMinTouch(obj: Phaser.GameObjects.GameObject & { setInteractive: Function }) {
    const anyObj = obj as Phaser.GameObjects.Image;
    const b =
      typeof anyObj.getBounds === "function"
        ? anyObj.getBounds()
        : new Phaser.Geom.Rectangle(0, 0, MIN_TOUCH_CSS_PX, MIN_TOUCH_CSS_PX);
    const min = MIN_TOUCH_CSS_PX;
    const w = Math.max(b.width, min);
    const h = Math.max(b.height, min);
    anyObj.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  idleSway(img: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: img,
      scaleX: img.scaleX * 1.02,
      scaleY: img.scaleY * 0.98,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  hopCelebrate(img: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: img,
      y: img.y - this.worldH * 0.04,
      duration: 220,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
    });
  }

  gentleWiggle(img: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: img,
      angle: { from: -6, to: 6 },
      duration: 90,
      yoyo: true,
      repeat: 2,
      onComplete: () => img.setAngle(0),
    });
  }

  /** Wooden garden plaque — used for prompts (not floating website chrome). */
  addWoodenSign(en: string, es: string) {
    const safe = UI_SAFE[this.aspect];
    const y = this.worldH * (safe.promptY + 0.02);
    const g = this.add.container(this.worldW / 2, y);
    const w = Math.min(this.worldW * 0.7, this.aspect === "portrait" ? 320 : 480);
    const h = this.aspect === "portrait" ? 64 : 72;
    const board = this.add.rectangle(0, 0, w, h, 0xc4a06a).setStrokeStyle(5, 0x6a4420);
    const t1 = this.add
      .text(0, -12, en, {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "17px" : "22px",
        color: "#2a1a08",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 20 },
      })
      .setOrigin(0.5);
    const t2 = this.add
      .text(0, 14, es, {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "14px" : "17px",
        color: "#4a3010",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 20 },
      })
      .setOrigin(0.5);
    g.add([board, t1, t2]);
    g.setDepth(50);
    return g;
  }

  /**
   * Phaser-native safe-area chrome (Home / Replay / parent flower).
   * Replaces HTML website buttons.
   */
  addSafeChrome(opts?: { showReplay?: boolean }) {
    const pad = Math.max(12, this.worldH * 0.02);
    const top = pad + (this.scale.displaySize ? 0 : 0);
    const btnH = 48;
    const btnW = 96;

    const mkBtn = (x: number, y: number, label: string, onClick: () => void) => {
      const c = this.add.container(x, y).setDepth(80);
      const r = this.add.rectangle(0, 0, btnW, btnH, 0xd4b07a).setStrokeStyle(3, 0x6a4420);
      const t = this.add
        .text(0, 0, label, {
          fontFamily: "Georgia, serif",
          fontSize: "16px",
          color: "#2a1a08",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      c.add([r, t]);
      r.setInteractive({ useHandCursor: true });
      // Expand visual button hit with a larger invisible zone
      const zone = this.add
        .zone(x, y, Math.max(btnW, MIN_TOUCH_CSS_PX), Math.max(btnH, MIN_TOUCH_CSS_PX))
        .setInteractive({ useHandCursor: true });
      zone.on("pointerdown", onClick);
      r.on("pointerdown", onClick);
      return c;
    };

    mkBtn(pad + btnW / 2, top + btnH / 2, "Home", () => {
      EventBus.emit("poc-tap");
      this.goHome();
    });

    if (opts?.showReplay !== false) {
      mkBtn(pad + btnW / 2 + btnW + 12, top + btnH / 2, "Replay", () => {
        EventBus.emit("poc-tap");
        EventBus.emit("poc-replay-request");
        if (typeof (this as { rebuild?: () => void }).rebuild === "function") {
          (this as { rebuild: () => void }).rebuild();
        } else {
          this.scene.restart();
        }
      });
    }

    // Parent flower — right safe area
    const flower = this.add.container(this.worldW - pad - 36, top + 28).setDepth(80);
    const petal = this.add.circle(0, 0, 28, 0xf2a0b8).setStrokeStyle(3, 0xc06080);
    const center = this.add.circle(0, 0, 12, 0xffe08a);
    flower.add([petal, center]);
    petal.setInteractive(
      new Phaser.Geom.Circle(0, 0, 48),
      Phaser.Geom.Circle.Contains,
    );
    petal.on("pointerdown", () => {
      EventBus.emit("poc-tap");
      EventBus.emit("poc-parent-open");
    });

    this.chromeBuilt = true;
  }

  speak(en: string, es: string) {
    EventBus.emit("poc-speak", { en, es });
  }

  goHome() {
    this.busy = false;
    this.scene.start("GardenHub");
  }

  emitReady() {
    EventBus.emit("current-scene-ready", this);
    EventBus.emit("poc-scene", this.scene.key);
  }
}
