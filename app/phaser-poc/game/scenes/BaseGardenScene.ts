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

  /** Feet / bottom-center anchor character with contact shadow. */
  addCharacter(texture: string, norm: Norm, heightFrac = CHAR_HEIGHT_FRAC) {
    const p = toPx(norm, this.worldW, this.worldH);
    const img = this.add.image(p.x, p.y, texture).setOrigin(0.5, 1);
    let targetH = this.worldH * heightFrac * (norm.scale ?? 1);
    // Keep wide-wing insects fully on-screen
    if (texture.includes("butterfly") || texture.includes("bee")) {
      targetH *= 0.92;
    }
    img.setDisplaySize((img.width / img.height) * targetH, targetH);
    // If sprite is wider than slot allows, shrink to fit ~28% of width
    const maxW = this.worldW * 0.28;
    if (img.displayWidth > maxW) {
      const s = maxW / img.displayWidth;
      img.setDisplaySize(img.displayWidth * s, img.displayHeight * s);
    }
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
   * Painted garden chrome (Home / Replay / parent flower).
   * Falls back to wooden plaques if UI textures are missing.
   */
  addSafeChrome(opts?: { showReplay?: boolean }) {
    this.addPaintedChrome(opts);
  }

  addPaintedChrome(opts?: { showReplay?: boolean }) {
    const pad = Math.max(10, this.worldH * 0.015);
    const top = pad;
    const hit = Math.max(96, MIN_TOUCH_CSS_PX);
    const iconH = Math.min(64, hit * 0.72);

    const placeIcon = (key: string, x: number, y: number) => {
      let img: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (this.textures.exists(key)) {
        const i = this.add.image(x, y, key).setOrigin(0.5).setDepth(80);
        i.setDisplaySize((i.width / i.height) * iconH, iconH);
        i.setInteractive(
          new Phaser.Geom.Rectangle(-hit / 2, -hit / 2, hit, hit),
          Phaser.Geom.Rectangle.Contains,
        );
        img = i;
      } else {
        img = this.add
          .rectangle(x, y, hit, hit, 0xd4b07a)
          .setStrokeStyle(3, 0x6a4420)
          .setDepth(80)
          .setInteractive({ useHandCursor: true });
      }
      return img;
    };

    // Top-left / top-right safe areas — clear of centered title
    const home = placeIcon("ui-home", pad + hit / 2, top + hit / 2);
    home.on("pointerdown", () => {
      EventBus.emit("poc-tap");
      this.goHome();
    });

    if (opts?.showReplay !== false) {
      const replay = placeIcon("ui-replay", pad + hit * 1.55, top + hit / 2);
      replay.on("pointerdown", () => {
        EventBus.emit("poc-tap");
        EventBus.emit("poc-replay-request");
        if (typeof (this as { rebuild?: () => void }).rebuild === "function") {
          (this as { rebuild: () => void }).rebuild();
        } else {
          this.scene.restart();
        }
      });
    }

    const flower = placeIcon("ui-parent-flower", this.worldW - pad - hit / 2, top + hit / 2);
    let holdTimer: Phaser.Time.TimerEvent | undefined;
    flower.on("pointerdown", () => {
      holdTimer = this.time.delayedCall(650, () => {
        EventBus.emit("poc-tap");
        EventBus.emit("poc-parent-open");
      });
    });
    const cancelHold = () => holdTimer?.remove(false);
    flower.on("pointerup", cancelHold);
    flower.on("pointerout", cancelHold);

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
