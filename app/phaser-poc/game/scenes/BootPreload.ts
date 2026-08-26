import Phaser from "../phaserCompat";
import { EventBus } from "../EventBus";
import { HUB_SHARED_ASSETS, ACTIVITY_ASSETS, resolveStartScene } from "../assetManifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    this.scene.start("Preload");
  }
}

/**
 * Cold preload: hub shared cast + landmarks + UI only.
 * Activity murals/food lazy-load when navigating (or when deep-linking an activity).
 */
export class PreloadScene extends Phaser.Scene {
  private failed: { key: string; path: string; status?: string }[] = [];
  private bar!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private done = false;
  private watchdog?: Phaser.Time.TimerEvent;

  constructor() {
    super("Preload");
  }

  init() {
    this.failed = [];
    this.done = false;
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(0x1a2a18);

    this.add
      .text(w / 2, h * 0.38, "Loading the garden…\nCargando el jardín…", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#f3e2b8",
        align: "center",
      })
      .setOrigin(0.5);

    this.bar = this.add.rectangle(w / 2, h * 0.5, 8, 22, 0xe8c988).setOrigin(0.5);
    this.label = this.add
      .text(w / 2, h * 0.56, "", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#c8b890",
        align: "center",
        wordWrap: { width: w * 0.8 },
      })
      .setOrigin(0.5);

    this.load.on("progress", (v: number) => {
      this.bar.width = Math.max(8, w * 0.5 * v);
    });
    this.load.on("filecomplete", (key: string) => {
      this.label.setText(key);
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      const path =
        (file as { url?: string; src?: string }).url ||
        (file as { src?: string }).src ||
        file.key;
      this.failed.push({ key: file.key, path: String(path), status: "loaderror" });
      this.label.setText(`Error: ${file.key}\n${path}`);
      console.error("[PhaserPOC] loaderror", file.key, path);
      EventBus.emit("poc-load-error", { key: file.key, path });
    });

    const start = resolveStartScene(this.game.registry.get("pocStartScene") as string | null);
    const queue = [...HUB_SHARED_ASSETS];
    // Deep-link into an activity: also queue that activity's art now
    if (start !== "GardenHub" && ACTIVITY_ASSETS[start]) {
      queue.push(...ACTIVITY_ASSETS[start]);
    }
    for (const a of queue) {
      if (!this.textures.exists(a.key)) this.load.image(a.key, a.path);
    }

    this.watchdog = this.time.delayedCall(20000, () => {
      if (this.done) return;
      if (!this.failed.length) {
        this.failed.push({
          key: "(timeout)",
          path: "Preload exceeded 20s",
          status: "timeout",
        });
      }
      this.showRetry();
    });
  }

  create() {
    if (this.failed.length) {
      this.showRetry();
      return;
    }
    const start = resolveStartScene(this.game.registry.get("pocStartScene") as string | null);
    const needed = [...HUB_SHARED_ASSETS];
    if (start !== "GardenHub" && ACTIVITY_ASSETS[start]) needed.push(...ACTIVITY_ASSETS[start]);
    for (const a of needed) {
      if (!this.textures.exists(a.key)) {
        this.failed.push({ key: a.key, path: a.path, status: "missing-texture" });
      }
    }
    if (this.failed.length) {
      this.showRetry();
      return;
    }
    this.finishOk(start);
  }

  private finishOk(start: string) {
    if (this.done) return;
    this.done = true;
    this.watchdog?.remove(false);
    EventBus.emit("poc-assets-ready", { start, failed: [] });
    this.scene.start(start);
  }

  private showRetry() {
    if (this.done) return;
    this.done = true;
    this.watchdog?.remove(false);
    this.children.removeAll(true);
    const w = this.scale.width;
    const h = this.scale.height;
    const detail = this.failed
      .slice(0, 4)
      .map((f) => `${f.key} → ${f.path}${f.status ? ` (${f.status})` : ""}`)
      .join("\n");

    this.add
      .text(
        w / 2,
        h * 0.32,
        "Oh no — the garden could not load.\nAy — el jardín no pudo cargar.",
        {
          fontFamily: "Georgia, serif",
          fontSize: "22px",
          color: "#f3e2b8",
          align: "center",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.48, detail || "Unknown error", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffb4a8",
        align: "center",
        wordWrap: { width: w * 0.85 },
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(w / 2, h * 0.68, 220, 64, 0xe8c988)
      .setStrokeStyle(4, 0x8a6230)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(w / 2, h * 0.68, "Try again · Intentar otra vez", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#3a2810",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    btn.on("pointerdown", () => {
      this.done = false;
      this.failed = [];
      this.scene.restart();
    });

    EventBus.emit("poc-load-error", { failed: this.failed });
  }
}

/** Lazy-load activity packs before starting that scene from the hub. */
export function ensureActivityAssets(
  scene: Phaser.Scene,
  activityKey: string,
  onReady: () => void,
) {
  const pack = ACTIVITY_ASSETS[activityKey];
  if (!pack?.length) {
    onReady();
    return;
  }
  const missing = pack.filter((a) => !scene.textures.exists(a.key));
  if (!missing.length) {
    onReady();
    return;
  }
  for (const a of missing) scene.load.image(a.key, a.path);
  scene.load.once("complete", () => onReady());
  scene.load.once("loaderror", (file: Phaser.Loader.File) => {
    console.error("[PhaserPOC] activity loaderror", file.key);
    EventBus.emit("poc-load-error", { key: file.key, path: file.key });
  });
  scene.load.start();
}
