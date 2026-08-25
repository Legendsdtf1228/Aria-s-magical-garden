import Phaser from "../phaserCompat";
import { EventBus } from "../EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Tiny placeholder so Boot never stalls; real art loads in Preload.
  }

  create() {
    this.scene.start("Preload");
  }
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.rectangle(w / 2, h / 2, w * 0.4, 18, 0xe8c988).setOrigin(0.5);
    this.load.on("progress", (v: number) => {
      bar.width = w * 0.4 * v;
    });

    // Scenes
    this.load.image("hub-landscape", "/art/scenes/garden-map-landscape.webp");
    this.load.image("hub-portrait", "/art/scenes/garden-map-portrait.webp");
    this.load.image("meadow-landscape", "/art/scenes/animal-meadow-landscape.webp");
    this.load.image("meadow-portrait", "/art/scenes/animal-meadow-portrait.webp");
    this.load.image("picnic-landscape", "/art/scenes/picnic-meadow-landscape.webp");
    this.load.image("picnic-portrait", "/art/scenes/picnic-meadow-portrait.webp");
    this.load.image("freeplay-landscape", "/art/scenes/freeplay-path-landscape.webp");
    this.load.image("freeplay-portrait", "/art/scenes/freeplay-path-portrait.webp");

    // Cast
    for (const id of ["butterfly", "bunny", "bird", "ladybug", "bee", "frog", "cat", "puppy"]) {
      this.load.image(`char-${id}`, `/art/characters/painted-garden-v1/${id}-idle.webp`);
    }

    // Landmarks + food
    this.load.image("lm-findFriend", "/art/landmarks/landmark-findFriend.webp");
    this.load.image("lm-feed", "/art/landmarks/landmark-feed.webp");
    this.load.image("lm-freePlay", "/art/landmarks/landmark-freePlay.webp");
    this.load.image("food-carrot", "/art/objects/food-carrot.webp");
    this.load.image("food-flower", "/art/objects/food-flower.webp");
    this.load.image("food-seeds", "/art/objects/food-seeds.webp");
    this.load.image("food-bone", "/art/objects/food-bone.webp");
    this.load.image("food-fish", "/art/objects/food-fish.webp");
    this.load.image("food-leaf", "/art/objects/food-leaf.webp");
    this.load.image("food-fly", "/art/objects/food-fly.webp");
    this.load.image("food-berry", "/art/objects/food-berry.webp");
  }

  create() {
    EventBus.emit("poc-assets-ready");
    this.scene.start("GardenHub");
  }
}
