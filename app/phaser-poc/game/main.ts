import { AUTO, Game, Scale } from "./phaserCompat";
import { BootScene, PreloadScene } from "./scenes/BootPreload";
import { GardenHubScene } from "./scenes/GardenHubScene";
import { FindFriendScene } from "./scenes/FindFriendScene";
import { FeedFriendsScene } from "./scenes/FeedFriendsScene";
import { FreePlayScene } from "./scenes/FreePlayScene";
import { LAYOUT } from "./layouts";

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

  const portrait =
    typeof window !== "undefined" && window.innerHeight > window.innerWidth * 1.05;
  const size = portrait ? LAYOUT.portrait : LAYOUT.landscape;

  const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: size.w,
    height: size.h,
    parent,
    backgroundColor: "#1a2a18",
    scale: {
      mode: Scale.FIT,
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

  return new Game(config);
}
