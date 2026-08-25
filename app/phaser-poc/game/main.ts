import { AUTO, Game, Scale } from "./phaserCompat";
import { BootScene, PreloadScene } from "./scenes/BootPreload";
import { GardenHubScene } from "./scenes/GardenHubScene";
import { FindFriendScene } from "./scenes/FindFriendScene";
import { FeedFriendsScene } from "./scenes/FeedFriendsScene";
import { FreePlayScene } from "./scenes/FreePlayScene";
import { LAYOUT, detectAspect } from "./layouts";

/**
 * Official Phaser + React template pattern:
 * https://github.com/phaserjs/template-react-ts
 */
export default function StartGame(parent: string) {
  const parentEl =
    typeof document !== "undefined" ? document.getElementById(parent) : null;
  if (parentEl) {
    parentEl.style.width = "100%";
    parentEl.style.height = "100%";
  }

  const review =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("review")
      : null;
  const portrait =
    typeof window !== "undefined" &&
    detectAspect(window.innerWidth, window.innerHeight) === "portrait";
  const size = portrait ? LAYOUT.portrait : LAYOUT.landscape;

  const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: size.w,
    height: size.h,
    parent,
    backgroundColor: "#1a2a18",
    scale: {
      // Fill parent — no dark letterbox gutters. Layout data still switches by aspect.
      mode: Scale.RESIZE,
      autoCenter: Scale.CENTER_BOTH,
      width: size.w,
      height: size.h,
      expandParent: false,
    },
    input: {
      activePointers: 3,
    },
    scene: [BootScene, PreloadScene, GardenHubScene, FindFriendScene, FeedFriendsScene, FreePlayScene],
    banner: false,
  };

  const game = new Game(config);
  game.registry.set("pocStartScene", review);
  return game;
}
