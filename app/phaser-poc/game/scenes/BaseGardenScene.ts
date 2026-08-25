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

  constructor(key: string) {
    super(key);
  }

  ensureAspect() {
    const parent = this.scale.parentSize;
    const pw = parent.width || window.innerWidth;
    const ph = parent.height || window.innerHeight;
    this.aspect = detectAspect(pw, ph);
    const L = LAYOUT[this.aspect];
    this.worldW = L.w;
    this.worldH = L.h;
    if (this.scale.width !== L.w || this.scale.height !== L.h) {
      this.scale.setGameSize(L.w, L.h);
    }
  }

  placeBackground(keyLandscape: string, keyPortrait: string) {
    this.ensureAspect();
    const key = this.aspect === "portrait" ? keyPortrait : keyLandscape;
    if (this.bg) this.bg.destroy();
    // FIT contain — letterbox if needed; never cover-crop
    this.bg = this.add.image(this.worldW / 2, this.worldH / 2, key);
    const sx = this.worldW / this.bg.width;
    const sy = this.worldH / this.bg.height;
    const s = Math.min(sx, sy);
    this.bg.setScale(s).setOrigin(0.5).setDepth(0);
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.centerOn(this.worldW / 2, this.worldH / 2);
    this.cameras.main.setBackgroundColor(0x1a2a18);
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
    const b = typeof anyObj.getBounds === "function" ? anyObj.getBounds() : new Phaser.Geom.Rectangle(0, 0, MIN_TOUCH_CSS_PX, MIN_TOUCH_CSS_PX);
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

  addWoodenSign(en: string, es: string) {
    const safe = UI_SAFE[this.aspect];
    const y = this.worldH * safe.promptY;
    const g = this.add.container(this.worldW / 2, y);
    const w = Math.min(this.worldW * 0.72, this.aspect === "portrait" ? 340 : 520);
    const h = this.aspect === "portrait" ? 70 : 78;
    const board = this.add.rectangle(0, 0, w, h, 0xe8c988).setStrokeStyle(4, 0x8a6230);
    const t1 = this.add
      .text(0, -14, en, {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "18px" : "24px",
        color: "#3a2810",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);
    const t2 = this.add
      .text(0, 16, es, {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "15px" : "18px",
        color: "#5a4020",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);
    g.add([board, t1, t2]);
    g.setDepth(50);
    return g;
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
