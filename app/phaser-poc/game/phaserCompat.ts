/**
 * Phaser ESM/CJS interop for Vite.
 * Official template uses default import; some bundlers need the fallback.
 */
import * as PhaserNS from "phaser";

const Phaser =
  (PhaserNS as unknown as { default?: typeof PhaserNS }).default ??
  (PhaserNS as unknown as typeof import("phaser"));

export default Phaser;
export const AUTO = Phaser.AUTO;
export const Game = Phaser.Game;
export const Scale = Phaser.Scale;
export const Scene = Phaser.Scene;
