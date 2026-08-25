"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { EventBus } from "./game/EventBus";
import type { Game, Scene } from "phaser";

export type IRefPhaserGame = {
  game: Game | null;
  scene: Scene | null;
};

type Props = {
  currentActiveScene?: (scene: Scene) => void;
};

function waitForBox(el: HTMLElement, tries = 40): Promise<void> {
  return new Promise((resolve) => {
    const tick = (n: number) => {
      if (el.clientWidth > 8 && el.clientHeight > 8) {
        resolve();
        return;
      }
      if (n <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => tick(n - 1));
    };
    tick(tries);
  });
}

/** Official Phaser React bridge — game module loaded only in the browser. */
export const PhaserGame = forwardRef<IRefPhaserGame, Props>(function PhaserGame(
  { currentActiveScene },
  ref,
) {
  const game = useRef<Game | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    void (async () => {
      await waitForBox(host);
      if (cancelled || game.current !== null) return;
      try {
        const { default: StartGame } = await import("./game/main");
        if (cancelled) return;
        game.current = StartGame("phaser-poc-container");
        if (typeof ref === "function") {
          ref({ game: game.current, scene: null });
        } else if (ref) {
          ref.current = { game: game.current, scene: null };
        }
      } catch (err) {
        console.error("[PhaserPOC] failed to start game", err);
        host.dataset.phaserError = String(err);
      }
    })();

    return () => {
      cancelled = true;
      if (game.current) {
        game.current.destroy(true);
        game.current = null;
      }
    };
  }, [ref]);

  useEffect(() => {
    const onReady = (sceneInstance: Scene) => {
      currentActiveScene?.(sceneInstance);
      if (typeof ref === "function") {
        ref({ game: game.current, scene: sceneInstance });
      } else if (ref) {
        ref.current = { game: game.current, scene: sceneInstance };
      }
    };
    EventBus.on("current-scene-ready", onReady as (...args: unknown[]) => void);
    return () => {
      EventBus.removeListener("current-scene-ready", onReady as (...args: unknown[]) => void);
    };
  }, [currentActiveScene, ref]);

  return (
    <div
      id="phaser-poc-container"
      ref={hostRef}
      className="phaser-poc-canvas-host"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#1a2a18",
      }}
    />
  );
});
