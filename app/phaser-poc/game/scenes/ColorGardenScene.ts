import Phaser from "../phaserCompat";
import { ChoiceScene, type ChoiceItem } from "./ChoiceScene";
import { COLOR_BED_SLOTS, COLOR_CHOICE_SIZE, type Norm } from "../layouts";
import { EventBus } from "../EventBus";

/** Color props — transparent painted objects from /art/objects. */
const COLORS: ChoiceItem[] = [
  { id: "red", texture: "color-prop-red", en: "Red", es: "rojo", gender: "m" },
  { id: "blue", texture: "color-prop-blue", en: "Blue", es: "azul", gender: "m" },
  { id: "yellow", texture: "color-prop-yellow", en: "Yellow", es: "amarillo", gender: "m" },
  { id: "green", texture: "color-prop-green", en: "Green", es: "verde", gender: "m" },
  { id: "purple", texture: "color-prop-purple", en: "Purple", es: "morado", gender: "m" },
  { id: "orange", texture: "color-prop-orange", en: "Orange", es: "anaranjado", gender: "m" },
  { id: "pink", texture: "color-prop-pink", en: "Pink", es: "rosa", gender: "m" },
  { id: "brown", texture: "color-prop-brown", en: "Brown", es: "café", gender: "m" },
  { id: "black", texture: "color-prop-black", en: "Black", es: "negro", gender: "m" },
  { id: "white", texture: "color-prop-white", en: "White", es: "blanco", gender: "m" },
];

const BLOOM_HEX: Record<string, number> = {
  red: 0xff5c68,
  blue: 0x43a8ff,
  yellow: 0xffd84a,
  green: 0x53cf82,
  purple: 0xa779ec,
  orange: 0xff954f,
  pink: 0xff8fc8,
  brown: 0xc48a5a,
  black: 0x4a4554,
  white: 0xf5f2ea,
};

const FRIEND_KEYS = ["char-bunny", "char-frog", "char-puppy", "char-cat", "char-butterfly"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Color Garden — toddler play-area pass.
 * One large prop centered in each front soil bed; bloom + friend on correct.
 */
export class ColorGardenScene extends ChoiceScene {
  constructor() {
    super("ColorGarden");
  }

  backgroundKeys() {
    return { landscape: "color-landscape", portrait: "color-portrait" };
  }

  protected instructionEn(item: ChoiceItem): string {
    return `Find ${item.en.toLowerCase()}.`;
  }

  protected instructionEs(item: ChoiceItem): string {
    return `Encuentra el color ${item.es.toLowerCase()}.`;
  }

  protected signEn(item: ChoiceItem): string {
    return `Find ${item.en}`;
  }

  protected signEs(item: ChoiceItem): string {
    return `Encuentra el color ${item.es.toLowerCase()}.`;
  }

  protected choiceSlots(): [Norm, Norm, Norm] {
    return COLOR_BED_SLOTS[this.aspect];
  }

  protected minTouchPx(): number {
    return COLOR_CHOICE_SIZE[this.aspect].touch;
  }

  protected choiceTargetHeightPx(): number | null {
    const spec = COLOR_CHOICE_SIZE[this.aspect];
    const fromFrac = this.aspect === "landscape" ? this.worldH * 0.26 : this.worldH * 0.2;
    return Math.min(spec.max, Math.max(spec.min, Math.round(fromFrac)));
  }

  /** Equal visual weight: same display height for every prop; large soft soil shadow. */
  protected placeChoices() {
    const slots = this.choiceSlots();
    const targetH = this.choiceTargetHeightPx() ?? this.worldH * 0.22;
    const touch = this.minTouchPx();

    this.choices.forEach((item, i) => {
      const slot = slots[i];
      const p = { x: slot.x * this.worldW, y: slot.y * this.worldH };

      this.add
        .ellipse(p.x, p.y - 6, targetH * 0.85, targetH * 0.22, 0x1a2010, 0.4)
        .setDepth(4);

      const img = this.add.image(p.x, p.y, item.texture).setOrigin(0.5, 1).setDepth(5);
      const aspect = img.width / Math.max(1, img.height);
      img.setDisplaySize(targetH * aspect, targetH);

      const hit = Math.max(touch, img.displayWidth * 1.08, img.displayHeight * 1.08);
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

  protected celebrationMs(): number {
    return 2200;
  }

  buildRound() {
    const target = shuffle(COLORS)[0];
    const others = shuffle(COLORS.filter((c) => c.id !== target.id)).slice(0, 2);
    return { target, choices: shuffle([target, ...others]) };
  }

  onCorrect(item: ChoiceItem) {
    EventBus.emit("poc-correct", { activity: "colors", id: item.id });
  }

  protected playWrong(img: Phaser.GameObjects.Image) {
    // Noticeable gentle wiggle — no red X, no failure sting beyond soft voice
    const base = img.angle;
    this.tweens.add({
      targets: img,
      angle: { from: base - 14, to: base + 14 },
      duration: 110,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
      onComplete: () => img.setAngle(0),
    });
    this.tweens.add({
      targets: img,
      x: img.x + 8,
      duration: 100,
      yoyo: true,
      repeat: 3,
    });
  }

  protected playCorrect(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    const glow = this.add
      .circle(img.x, img.y - img.displayHeight * 0.45, img.displayWidth * 0.55, 0xfff6a8, 0.35)
      .setDepth(6);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.45, to: 0 },
      scale: { from: 0.8, to: 1.6 },
      duration: 900,
      onComplete: () => glow.destroy(),
    });

    this.hopCelebrate(img);
    this.bloomBed(item, img);
    this.celebrateFriend(img);
    this.spawnSparkles(img);

    this.speak(`Yes! ${item.en}.`, `¡Sí! El color ${item.es.toLowerCase()}.`);
  }

  private bloomBed(item: ChoiceItem, img: Phaser.GameObjects.Image) {
    const color = BLOOM_HEX[item.id] ?? 0xfff2a8;
    const bedX = img.x;
    const bedY = img.y - 8;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 18 + Math.random() * (img.displayWidth * 0.35);
      const petal = this.add
        .circle(bedX, bedY, 7 + Math.random() * 6, color, 0.95)
        .setDepth(7)
        .setScale(0.2);
      this.tweens.add({
        targets: petal,
        x: bedX + Math.cos(ang) * dist,
        y: bedY - 12 - Math.sin(ang) * dist * 0.55,
        scale: 1,
        duration: 420 + Math.random() * 200,
        ease: "Back.easeOut",
      });
      this.tweens.add({
        targets: petal,
        alpha: 0,
        delay: 1400,
        duration: 400,
        onComplete: () => petal.destroy(),
      });
    }
    // Soft matching flower mound rising in the bed
    const mound = this.add
      .ellipse(bedX, bedY - 6, img.displayWidth * 0.85, img.displayHeight * 0.22, color, 0.55)
      .setDepth(3)
      .setScale(0.3);
    this.tweens.add({
      targets: mound,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: mound,
      alpha: 0,
      delay: 1500,
      duration: 400,
      onComplete: () => mound.destroy(),
    });
  }

  private celebrateFriend(img: Phaser.GameObjects.Image) {
    const key = FRIEND_KEYS.find((k) => this.textures.exists(k)) ?? FRIEND_KEYS[0];
    if (!this.textures.exists(key)) return;
    const friend = this.add
      .image(img.x + img.displayWidth * 0.55, img.y, key)
      .setOrigin(0.5, 1)
      .setDepth(12)
      .setAlpha(0);
    const h = Math.min(this.worldH * 0.16, img.displayHeight * 0.95);
    friend.setDisplaySize((friend.width / friend.height) * h, h);
    this.tweens.add({
      targets: friend,
      alpha: 1,
      y: img.y - 10,
      duration: 280,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: friend,
      y: img.y - this.worldH * 0.05,
      duration: 280,
      yoyo: true,
      repeat: 2,
      delay: 200,
      ease: "Quad.easeOut",
    });
    this.tweens.add({
      targets: friend,
      alpha: 0,
      delay: 1700,
      duration: 300,
      onComplete: () => friend.destroy(),
    });
  }

  private spawnSparkles(img: Phaser.GameObjects.Image) {
    for (let i = 0; i < 12; i++) {
      const s = this.add
        .circle(
          img.x + (Math.random() - 0.5) * img.displayWidth * 1.2,
          img.y - img.displayHeight * (0.2 + Math.random() * 0.7),
          3 + Math.random() * 4,
          0xfff2a8,
          0.95,
        )
        .setDepth(20);
      this.tweens.add({
        targets: s,
        y: s.y - 40 - Math.random() * 30,
        alpha: 0,
        duration: 600 + Math.random() * 300,
        onComplete: () => s.destroy(),
      });
    }
  }
}
