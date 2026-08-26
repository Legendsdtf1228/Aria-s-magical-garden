import Phaser from "../phaserCompat";
import { BaseGardenScene } from "./BaseGardenScene";
import {
  BUNNY_PATH,
  COTTAGE_POTS,
  COUNTING_PADS,
  FROG_PAD,
  GAZEBO_PROPS,
  HUB_ZONES,
  MIN_ACTIVITY_PROP_PX,
  MIN_TOUCH_CSS_PX,
  SHAPE_PROPS,
  toPx,
  type HubActivity,
  type HubZone,
  type Norm,
} from "../layouts";
import { EventBus } from "../EventBus";
import { ensureActivityAssets } from "./BootPreload";

/**
 * GardenHub — four natural zones. Idle hub = hit areas only; props appear when zone opens.
 */
export class GardenHubScene extends BaseGardenScene {
  bunny!: Phaser.GameObjects.Image;
  frog!: Phaser.GameObjects.Image;
  openZoneId: HubZone["id"] | null = null;
  private choiceLayer!: Phaser.GameObjects.Container;
  private hitZones: Phaser.GameObjects.Zone[] = [];
  private choiceTargets: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = [];
  private pulseTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("GardenHub");
  }

  create() {
    const preset = this.game.registry.get("pocOpenZone") as HubZone["id"] | null;
    this.openZoneId = preset ?? null;
    this.bindSafeResize(() => this.rebuild());
    this.rebuild();
    this.emitReady();
    if (this.openZoneId) {
      const z = HUB_ZONES[this.aspect].find((x) => x.id === this.openZoneId);
      if (z) this.announceZone(z);
    } else {
      this.speak("Welcome to the garden.", "Bienvenida al jardín.");
    }
  }

  rebuild() {
    this.children.removeAll(true);
    this.tweens.killAll();
    this.pulseTimer?.remove(false);
    this.hitZones = [];
    this.choiceTargets = [];
    this.placeBackground("hub-landscape", "hub-portrait");
    this.addPaintedChrome({ showReplay: false });
    this.addCenteredTitle();

    this.choiceLayer = this.add.container(0, 0).setDepth(30);

    // Plain lily pad under frog (approved — do not change)
    const frogPos = toPx(FROG_PAD[this.aspect], this.worldW, this.worldH);
    const padW = this.worldW * 0.07;
    const padH = this.worldH * 0.028;
    this.add
      .ellipse(frogPos.x, frogPos.y - 4, padW, padH, 0x3d7a38, 0.95)
      .setStrokeStyle(2, 0x2a5528)
      .setDepth(3);

    this.frog = this.addCharacter("char-frog", FROG_PAD[this.aspect] as Norm, 0.1);
    this.frog.setDepth(4);
    this.idleBob(this.frog);

    const path = BUNNY_PATH[this.aspect];
    const start = toPx(path[0], this.worldW, this.worldH);
    this.bunny = this.add.image(start.x, start.y, "char-bunny").setOrigin(0.5, 1).setDepth(6);
    const targetH = this.worldH * 0.12 * (path[0].scale ?? 1);
    this.bunny.setDisplaySize((this.bunny.width / this.bunny.height) * targetH, targetH);
    this.playBunnyHop(path);

    for (const zone of HUB_ZONES[this.aspect]) {
      this.buildZone(zone);
    }

    if (this.openZoneId) {
      const z = HUB_ZONES[this.aspect].find((x) => x.id === this.openZoneId);
      if (z) this.showZoneChoices(z);
      const bgHit = this.add
        .zone(this.worldW / 2, this.worldH / 2, this.worldW, this.worldH)
        .setDepth(18)
        .setInteractive();
      bgHit.on("pointerdown", () => this.closeZone());
    }
  }

  buildZone(zone: HubZone) {
    if (this.openZoneId) return;
    const cx = (zone.hit.x + zone.hit.w / 2) * this.worldW;
    const cy = (zone.hit.y + zone.hit.h / 2) * this.worldH;
    // Subtle invitation only — no activity props on idle hub
    const soft = this.add
      .circle(cx, cy, Math.max(zone.hit.w, zone.hit.h) * this.worldW * 0.18, 0xfff6d0, 0.07)
      .setDepth(4);
    this.tweens.add({
      targets: soft,
      alpha: { from: 0.04, to: 0.11 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const hit = this.add
      .zone(cx, cy, zone.hit.w * this.worldW, zone.hit.h * this.worldH)
      .setDepth(20)
      .setInteractive();
    this.hitZones.push(hit);
    hit.on("pointerdown", () => this.openZone(zone));
  }

  openZone(zone: HubZone) {
    EventBus.emit("poc-tap");
    this.openZoneId = zone.id;
    this.game.registry.set("pocOpenZone", zone.id);
    this.rebuild();
    this.announceZone(zone);
  }

  announceZone(zone: HubZone) {
    this.speak(zone.en, zone.es);
    this.time.delayedCall(1600, () => {
      if (this.openZoneId !== zone.id) return;
      this.speak("Choose a game.", "Elige un juego.");
    });
  }

  closeZone() {
    this.openZoneId = null;
    this.game.registry.set("pocOpenZone", null);
    this.rebuild();
  }

  showZoneChoices(zone: HubZone) {
    const cx = (zone.hit.x + zone.hit.w / 2) * this.worldW;
    const cy = (zone.hit.y + zone.hit.h / 2) * this.worldH;
    const glow = this.add
      .circle(cx, cy, Math.max(zone.hit.w, zone.hit.h) * this.worldW * 0.3, 0xfff3c0, 0.08)
      .setDepth(25);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.14 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    for (const act of zone.activities) {
      this.addActivityChoice(act);
    }
    this.startSequentialPulse();
  }

  addActivityChoice(act: HubActivity) {
    let target: Phaser.GameObjects.Image | Phaser.GameObjects.Container;

    switch (act.id) {
      case "counting":
        target = this.addCountingChoice(act);
        break;
      case "shapes":
        target = this.addShapesChoice(act);
        break;
      case "colors":
        target = this.addCottagePotsChoice(act);
        break;
      case "gardenCare":
        target = this.addSinglePropChoice(act, "prop-watering-can");
        break;
      case "findFriend":
        target = this.addFindFriendChoice(act);
        break;
      case "animalSounds":
        target = this.addGazeboChimesChoice(act);
        break;
      case "music":
        target = this.addGazeboMusicChoice(act);
        break;
      case "feed":
        target = this.addSinglePropChoice(act, "prop-picnic-basket");
        break;
      default:
        target = this.addSignpostChoice(act);
        break;
    }

    this.choiceTargets.push(target);
    this.bindChoiceTap(target, act);
  }

  addCountingChoice(act: HubActivity) {
    const pads = COUNTING_PADS[this.aspect];
    const imgs: Phaser.GameObjects.Container[] = [];
    const padH = this.worldH * act.heightFrac;

    for (const pad of pads) {
      const p = toPx(pad.pos, this.worldW, this.worldH);
      const group = this.add.container(p.x, p.y).setDepth(31);
      const lily = this.add.image(0, 0, "prop-lily-pad").setOrigin(0.5, 0.5);
      lily.setDisplaySize(padH * 1.55, padH);
      const label = this.add
        .text(0, -padH * 0.08, String(pad.num), {
          fontFamily: "Georgia, serif",
          fontSize: `${Math.round(padH * 0.55)}px`,
          color: "#1a4a18",
          fontStyle: "bold",
          stroke: "#e8f8d8",
          strokeThickness: Math.max(3, Math.round(padH * 0.06)),
        })
        .setOrigin(0.5);
      group.add([lily, label]);
      this.choiceLayer.add(group);
      imgs.push(group);
    }

    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    const lead = imgs[1];
    lead.setSize(hit * 2.2, hit);
    lead.setInteractive(new Phaser.Geom.Rectangle(-hit, -hit / 2, hit * 2.2, hit), Phaser.Geom.Rectangle.Contains);
    return lead;
  }

  addShapesChoice(_act: HubActivity) {
    const shapes = SHAPE_PROPS[this.aspect];
    const imgs: Phaser.GameObjects.Image[] = [];
    for (const s of shapes) {
      const img = this.placeProp(s.key, s.pos, 0.09, 31);
      this.choiceLayer.add(img);
      imgs.push(img);
    }
    const lead = imgs[1];
    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    lead.setInteractive(
      new Phaser.Geom.Rectangle(-hit * 1.5, -hit, hit * 3, hit),
      Phaser.Geom.Rectangle.Contains,
    );
    return lead;
  }

  addCottagePotsChoice(_act: HubActivity) {
    const pots = COTTAGE_POTS[this.aspect];
    const imgs: Phaser.GameObjects.Image[] = [];
    for (const pot of pots) {
      const img = this.placeProp(pot.key, pot.pos, 0.085, 31);
      this.choiceLayer.add(img);
      imgs.push(img);
    }
    const lead = imgs[1];
    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    lead.setInteractive(new Phaser.Geom.Rectangle(-hit, -hit, hit * 2, hit), Phaser.Geom.Rectangle.Contains);
    return lead;
  }

  addFindFriendChoice(act: HubActivity) {
    const house = this.placeProp("prop-birdhouse", act.pos, act.heightFrac, 31);
    const glass = this.placeProp(
      "prop-magnifier",
      { x: act.pos.x + 0.06, y: act.pos.y - 0.02 },
      act.heightFrac * 0.75,
      32,
    );
    glass.disableInteractive();
    this.choiceLayer.add(house);
    this.choiceLayer.add(glass);
    const hit = Math.max(MIN_TOUCH_CSS_PX, house.displayWidth + glass.displayWidth * 0.4, MIN_ACTIVITY_PROP_PX);
    house.setInteractive(
      new Phaser.Geom.Rectangle(-hit / 2, -hit, hit, hit),
      Phaser.Geom.Rectangle.Contains,
    );
    return house;
  }

  addGazeboChimesChoice(_act: HubActivity) {
    const g = GAZEBO_PROPS[this.aspect];
    const img = this.placeProp("prop-chimes", g.chimes, g.heightFrac, 31);
    this.choiceLayer.add(img);
    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    img.setInteractive(new Phaser.Geom.Rectangle(-hit / 2, -hit, hit, hit), Phaser.Geom.Rectangle.Contains);
    return img;
  }

  addGazeboMusicChoice(_act: HubActivity) {
    const g = GAZEBO_PROPS[this.aspect];
    const drum = this.placeProp("prop-drum", g.drum, g.heightFrac * 0.85, 31);
    const harp = this.placeProp("prop-harp", g.harp, g.heightFrac * 1.05, 32);
    const xyl = this.placeProp("prop-xylophone", g.xylophone, g.heightFrac * 0.8, 33);
    this.choiceLayer.add(drum);
    this.choiceLayer.add(harp);
    this.choiceLayer.add(xyl);
    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    harp.setInteractive(new Phaser.Geom.Rectangle(-hit, -hit, hit * 2, hit), Phaser.Geom.Rectangle.Contains);
    return harp;
  }

  addSinglePropChoice(act: HubActivity, key: string) {
    const img = this.placeProp(key, act.pos, act.heightFrac, 31);
    this.choiceLayer.add(img);
    const hit = Math.max(MIN_TOUCH_CSS_PX, MIN_ACTIVITY_PROP_PX);
    img.setInteractive(new Phaser.Geom.Rectangle(-hit / 2, -hit, hit, hit), Phaser.Geom.Rectangle.Contains);
    return img;
  }

  addSignpostChoice(act: HubActivity) {
    const p = toPx(act.pos, this.worldW, this.worldH);
    const post = this.add.container(p.x, p.y).setDepth(31);
    const stake = this.add.rectangle(0, -22, 12, 48, 0x7a5230);
    const boardW = Math.max(120, MIN_ACTIVITY_PROP_PX);
    const board = this.add.rectangle(0, -56, boardW, 42, 0xc4a06a).setStrokeStyle(3, 0x5a3818);
    const label = this.add
      .text(0, -56, act.en, {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "12px" : "14px",
        color: "#2a1808",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: boardW - 12 },
      })
      .setOrigin(0.5);
    post.add([stake, board, label]);
    const hit = Math.max(MIN_TOUCH_CSS_PX, boardW);
    post.setSize(hit, hit);
    post.setInteractive(new Phaser.Geom.Rectangle(-hit / 2, -hit, hit, hit), Phaser.Geom.Rectangle.Contains);
    this.choiceLayer.add(post);
    return post;
  }

  bindChoiceTap(target: Phaser.GameObjects.Image | Phaser.GameObjects.Container, act: HubActivity) {
    target.on("pointerdown", () => {
      EventBus.emit("poc-tap");
      this.speak(act.en, act.es);
      if (target instanceof Phaser.GameObjects.Image) this.hopCelebrate(target);
      if (!act.scene) return;
      this.time.delayedCall(380, () => {
        ensureActivityAssets(this, act.scene!, () => {
          this.game.registry.set("pocOpenZone", null);
          this.scene.start(act.scene!);
        });
      });
    });
  }

  startSequentialPulse() {
    if (!this.choiceTargets.length) return;
    let i = 0;
    const pulseOne = () => {
      if (!this.openZoneId || !this.choiceTargets.length) return;
      const t = this.choiceTargets[i % this.choiceTargets.length];
      i += 1;
      const baseScaleX = t.scaleX;
      const baseScaleY = t.scaleY;
      this.tweens.add({
        targets: t,
        scaleX: baseScaleX * 1.1,
        scaleY: baseScaleY * 1.1,
        duration: 420,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => {
          t.setScale(baseScaleX, baseScaleY);
        },
      });
    };
    pulseOne();
    this.pulseTimer = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: pulseOne,
    });
  }

  placeProp(key: string, norm: Norm, heightFrac: number, depth: number) {
    const p = toPx(norm, this.worldW, this.worldH);
    const img = this.add.image(p.x, p.y, key).setOrigin(0.5, 1).setDepth(depth);
    let targetH = this.worldH * heightFrac * (norm.scale ?? 1);
    // Keep activity props readable but avoid oversized pasted look
    if (this.aspect === "landscape") {
      targetH = Math.max(targetH, 72);
      targetH = Math.min(targetH, this.worldH * 0.14);
    } else {
      targetH = Math.max(targetH, 56);
      targetH = Math.min(targetH, this.worldH * 0.1);
    }
    if (img.height > 0) {
      img.setDisplaySize((img.width / img.height) * targetH, targetH);
    }
    this.ensureMinTouch(img);
    return img;
  }

  idleBob(img: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: img,
      y: img.y - 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  addCenteredTitle() {
    const x = this.worldW * 0.5;
    const y = this.aspect === "portrait" ? this.worldH * 0.052 : this.worldH * 0.04;
    const maxW = this.worldW * (this.aspect === "portrait" ? 0.56 : 0.46);
    this.add
      .text(x, y, "Aria's Magical Garden", {
        fontFamily: "Georgia, serif",
        fontSize: this.aspect === "portrait" ? "17px" : "26px",
        color: "#2a1808",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: maxW },
        stroke: "#f3e2b8",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(85);
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
