"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";
import { EventBus } from "./game/EventBus";
import { useBilingualVoice } from "../hooks/useBilingualVoice";
import { useAudio } from "../hooks/useAudio";
import { useSettings } from "../hooks/useSettings";
import { useProgress } from "../hooks/useProgress";
import type { Scene } from "phaser";
import "./phaserPoc.css";

/**
 * Isolated Phaser POC shell.
 * Deep-link (?review=) is resolved inside Phaser Preload after assets load —
 * React must NOT race scene.start during Preload.
 */
export default function PhaserPocPage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [sceneKey, setSceneKey] = useState("Boot");
  const [loadError, setLoadError] = useState<string | null>(null);
  const { settings, update } = useSettings();
  const progress = useProgress();
  const voice = useBilingualVoice({
    speechOn: settings.speechOn,
    speechVolume: settings.speechVolume,
    enVoiceURI: settings.enVoiceURI,
    esVoiceURI: settings.esVoiceURI,
    languageMode: settings.languageMode ?? "both",
  });
  const audio = useAudio(
    {
      musicOn: settings.musicOn,
      musicVolume: settings.musicVolume,
      speechOn: settings.speechOn,
    },
    voice.speaking,
  );

  const onScene = useCallback((scene: Scene) => {
    setSceneKey(scene.scene.key);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("phaser-poc-lock");
    document.body.classList.add("phaser-poc-lock");
    return () => {
      document.documentElement.classList.remove("phaser-poc-lock");
      document.body.classList.remove("phaser-poc-lock");
      voice.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onSpeak = (payload: { en: string; es: string }) => {
      voice.cancel();
      voice.speak(payload.en, payload.es);
    };
    const onTap = () => {
      audio.ensure();
      audio.tap();
    };
    const onAnimal = (id: string) => {
      audio.ensure();
      const map: Record<string, "flutter" | "hop" | "chirp" | "crawl" | "buzz" | "ribbit" | "meow" | "bark"> = {
        butterfly: "flutter",
        bunny: "hop",
        bird: "chirp",
        ladybug: "crawl",
        bee: "buzz",
        frog: "ribbit",
        cat: "meow",
        puppy: "bark",
      };
      if (map[id]) audio.animal(map[id]);
    };
    const onCorrect = (payload: { activity: string }) => {
      audio.ensure();
      audio.correct();
      if (payload.activity === "findFriend" || payload.activity === "feed") {
        progress.completeActivity(payload.activity as "findFriend" | "feed");
      }
    };
    const onSurprise = (id: string) => {
      audio.ensure();
      audio.sparkle();
      progress.addSurprise(id);
    };
    const onParent = () => {
      update({ speechOn: !settings.speechOn });
      voice.speak(
        settings.speechOn ? "Speech off." : "Speech on.",
        settings.speechOn ? "Voz apagada." : "Voz encendida.",
      );
    };
    const onLoadErr = (payload: { key?: string; path?: string; failed?: { key: string; path: string }[] }) => {
      if (payload.failed?.length) {
        setLoadError(payload.failed.map((f) => `${f.key}: ${f.path}`).join(" | "));
      } else if (payload.key) {
        setLoadError(`${payload.key} → ${payload.path ?? "?"}`);
      }
    };
    const onReady = () => setLoadError(null);

    EventBus.on("poc-speak", onSpeak as (...a: unknown[]) => void);
    EventBus.on("poc-tap", onTap);
    EventBus.on("poc-animal", onAnimal as (...a: unknown[]) => void);
    EventBus.on("poc-correct", onCorrect as (...a: unknown[]) => void);
    EventBus.on("poc-surprise", onSurprise as (...a: unknown[]) => void);
    EventBus.on("poc-parent-open", onParent);
    EventBus.on("poc-load-error", onLoadErr as (...a: unknown[]) => void);
    EventBus.on("poc-assets-ready", onReady);
    EventBus.on("poc-scene", setSceneKey as (...a: unknown[]) => void);

    return () => {
      EventBus.off("poc-speak", onSpeak as (...a: unknown[]) => void);
      EventBus.off("poc-tap", onTap);
      EventBus.off("poc-animal", onAnimal as (...a: unknown[]) => void);
      EventBus.off("poc-correct", onCorrect as (...a: unknown[]) => void);
      EventBus.off("poc-surprise", onSurprise as (...a: unknown[]) => void);
      EventBus.off("poc-parent-open", onParent);
      EventBus.off("poc-load-error", onLoadErr as (...a: unknown[]) => void);
      EventBus.off("poc-assets-ready", onReady);
      EventBus.off("poc-scene", setSceneKey as (...a: unknown[]) => void);
    };
  }, [voice, audio, progress, settings.speechOn, update]);

  return (
    <main className="phaser-poc-root" data-poc-scene={sceneKey}>
      <PhaserGame ref={phaserRef} currentActiveScene={onScene} />
      {loadError && (
        <p className="phaser-poc-error" role="alert">
          Load error: {loadError}
        </p>
      )}
      <p className="phaser-poc-badge">Phaser POC · not the full game</p>
    </main>
  );
}
