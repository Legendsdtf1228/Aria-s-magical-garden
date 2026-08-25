"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";
import { EventBus } from "./game/EventBus";
import { useBilingualVoice } from "../hooks/useBilingualVoice";
import { useAudio } from "../hooks/useAudio";
import { useSettings } from "../hooks/useSettings";
import { useProgress } from "../hooks/useProgress";
import { ParentGateFlower } from "../components/ParentGate";
import type { Scene } from "phaser";
import "./phaserPoc.css";

/**
 * Isolated Phaser POC shell.
 * React owns PWA/settings/progress/voice/audio; Phaser owns scenes & touch.
 * Entry: /phaser-poc — does not replace the main garden app.
 */
export default function PhaserPocPage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [sceneKey, setSceneKey] = useState("Boot");
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
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("review");
    const map: Record<string, string> = {
      hub: "GardenHub",
      findFriend: "FindFriend",
      feed: "FeedFriends",
      freePlay: "FreePlay",
    };
    if (!q || !map[q]) return;
    const jump = () => {
      const scene = phaserRef.current?.game?.scene;
      if (!scene) return;
      if (scene.isActive("Preload") || scene.isActive("Boot")) {
        setTimeout(jump, 200);
        return;
      }
      scene.start(map[q]);
    };
    const t = setTimeout(jump, 800);
    return () => clearTimeout(t);
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

    EventBus.on("poc-speak", onSpeak);
    EventBus.on("poc-tap", onTap);
    EventBus.on("poc-animal", onAnimal);
    EventBus.on("poc-correct", onCorrect);
    EventBus.on("poc-surprise", onSurprise);
    EventBus.on("poc-scene", setSceneKey);

    return () => {
      EventBus.off("poc-speak", onSpeak);
      EventBus.off("poc-tap", onTap);
      EventBus.off("poc-animal", onAnimal);
      EventBus.off("poc-correct", onCorrect);
      EventBus.off("poc-surprise", onSurprise);
      EventBus.off("poc-scene", setSceneKey);
    };
  }, [voice, audio, progress]);

  const goHub = () => {
    voice.cancel();
    const scene = phaserRef.current?.scene;
    if (scene) scene.scene.start("GardenHub");
  };

  const replay = () => {
    const scene = phaserRef.current?.scene as { rebuild?: () => void; scene: { restart: () => void } } | null;
    if (!scene) return;
    voice.cancel();
    if (typeof scene.rebuild === "function") scene.rebuild();
    else scene.scene.restart();
  };

  return (
    <main className="phaser-poc-root" data-poc-scene={sceneKey}>
      <div className="phaser-poc-chrome" aria-label="Controls">
        <button type="button" className="poc-chrome-btn" onClick={goHub}>
          Home
        </button>
        <button type="button" className="poc-chrome-btn" onClick={replay}>
          Replay
        </button>
        <div className="poc-chrome-parent">
          <ParentGateFlower
            onOpen={() => {
              // Light settings: toggle speech via existing prefs without leaving POC
              update({ speechOn: !settings.speechOn });
              voice.speak(
                settings.speechOn ? "Speech off." : "Speech on.",
                settings.speechOn ? "Voz apagada." : "Voz encendida.",
              );
            }}
          />
        </div>
      </div>
      <PhaserGame ref={phaserRef} currentActiveScene={onScene} />
      <p className="phaser-poc-badge">Phaser POC · not the full game</p>
    </main>
  );
}
