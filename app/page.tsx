"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimalFriendsActivity } from "./activities/AnimalFriends";
import { ColorGardenActivity } from "./activities/ColorGarden";
import { CountingPondActivity } from "./activities/CountingPond";
import { FeedTheFriendsActivity } from "./activities/FeedTheFriends";
import { MusicMovementActivity } from "./activities/MusicMovement";
import { ShapeMeadowActivity } from "./activities/ShapeMeadow";
import { GardenScene } from "./components/GardenScene";
import { MyGardenScreen } from "./components/MyGardenScreen";
import { ParentGateFlower } from "./components/ParentGate";
import { ParentSettingsPanel } from "./components/ParentSettings";
import { ACTIVITIES } from "./data/catalog";
import { useAudio } from "./hooks/useAudio";
import { useBilingualVoice } from "./hooks/useBilingualVoice";
import { useCollection } from "./hooks/useCollection";
import { useSettings } from "./hooks/useSettings";
import type { ActivityId, Screen } from "./types/game";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const { settings, update } = useSettings();
  const collection = useCollection();
  const voice = useBilingualVoice({
    speechOn: settings.speechOn,
    speechVolume: settings.speechVolume,
    enVoiceURI: settings.enVoiceURI,
    esVoiceURI: settings.esVoiceURI,
  });
  const audio = useAudio(
    {
      musicOn: settings.musicOn,
      musicVolume: settings.musicVolume,
      speechOn: settings.speechOn,
    },
    voice.speaking,
  );

  useEffect(() => {
    return () => {
      voice.cancel();
      audio.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHub = () => {
    voice.cancel();
    audio.stopAll();
    setLeaveConfirm(false);
    setActivity(null);
    setScreen("hub");
  };

  const common = useMemo(
    () => ({
      collected: collection.collected,
      speechOn: settings.speechOn,
      voice: {
        speak: voice.speak,
        speakParts: voice.speakParts,
        cancel: voice.cancel,
        speaking: voice.speaking,
      },
      audio: {
        tap: audio.tap,
        correct: audio.correct,
        sparkle: audio.sparkle,
        retry: audio.retry,
        animal: audio.animal,
        movementCue: audio.movementCue,
        ensure: audio.ensure,
      },
      onToggleSpeech: () => update({ speechOn: !settings.speechOn }),
      onHome: goHub,
      onHomeRequest: () => setLeaveConfirm(true),
      onAward: collection.awardCorrect,
      onCatchFriend: collection.catchFriend,
    }),
    [collection, settings.speechOn, voice, audio, update],
  );

  const startActivity = (id: ActivityId) => {
    audio.ensure();
    const meta = ACTIVITIES.find((a) => a.id === id)!;
    voice.speak(meta.en, meta.es);
    setActivity(id);
    setScreen("activity");
  };

  if (screen === "settings") {
    return (
      <ParentSettingsPanel
        settings={settings}
        enVoices={voice.enVoices}
        esVoices={voice.esVoices}
        selectedEn={voice.selectedEn}
        selectedEs={voice.selectedEs}
        naturalAvailable={voice.naturalAvailable}
        onChange={update}
        onPreviewEn={() =>
          voice.speak("Hi there! This is the English garden voice.", undefined, "previewEnglish")
        }
        onPreviewEs={() =>
          voice.speak("", "¡Hola! Esta es la voz del jardín en español.", "previewSpanish")
        }
        onResetCollection={collection.resetCollection}
        onClose={() => setScreen(activity ? "activity" : "hub")}
      />
    );
  }

  if (screen === "garden") {
    return (
      <MyGardenScreen
        collected={collection.collected}
        onHear={(en, es) => voice.speak(en, es)}
        onHome={goHub}
      />
    );
  }

  if (screen === "activity" && activity) {
    const Activity =
      activity === "colors"
        ? ColorGardenActivity
        : activity === "animals"
          ? AnimalFriendsActivity
          : activity === "shapes"
            ? ShapeMeadowActivity
            : activity === "counting"
              ? CountingPondActivity
              : activity === "feed"
                ? FeedTheFriendsActivity
                : MusicMovementActivity;

    return (
      <>
        <Activity {...common} />
        {leaveConfirm && (
          <div className="leave-overlay" role="dialog" aria-label="Leave activity">
            <section className="card">
              <p className="eyebrow">Go home?</p>
              <h2>Home • Inicio</h2>
              <p className="intro">Your garden friends are saved!</p>
              <div className="finish-actions">
                <button
                  type="button"
                  className="play"
                  onClick={() => {
                    setLeaveConfirm(false);
                    goHub();
                  }}
                >
                  Yes • Sí
                </button>
                <button
                  type="button"
                  className="play secondary"
                  onClick={() => setLeaveConfirm(false)}
                >
                  Keep playing
                </button>
              </div>
            </section>
          </div>
        )}
      </>
    );
  }

  if (screen === "hub") {
    return (
      <GardenScene scene="hub" className="hub-screen">
        <section className="card wide-card hub-card">
          <div className="hub-top">
            <p className="eyebrow">Pick a garden game</p>
            <ParentGateFlower onOpen={() => setScreen("settings")} />
          </div>
          <h1>
            Aria&apos;s<br />
            <span>Activity Garden</span>
          </h1>
          {collection.hydrated && collection.ownedCount > 0 && (
            <p className="collection-hint">
              {collection.ownedCount} friend{collection.ownedCount === 1 ? "" : "s"} in your
              garden! · ¡{collection.ownedCount} amigo
              {collection.ownedCount === 1 ? "" : "s"}!
            </p>
          )}
          <div className="activity-grid">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`activity-card scene-tint-${a.scene}`}
                onClick={() => startActivity(a.id)}
              >
                <span className="mode-emoji">{a.emoji}</span>
                <strong>{a.en}</strong>
                <small>{a.es}</small>
                <em>{a.blurbEn}</em>
              </button>
            ))}
          </div>
          <div className="hub-actions">
            <button type="button" className="play secondary" onClick={() => setScreen("garden")}>
              My Garden • Mi Jardín
            </button>
          </div>
          <p className="love">Made with love for Aria 💛</p>
        </section>
      </GardenScene>
    );
  }

  return (
    <GardenScene scene="welcome" className="welcome-screen">
      <section className="card">
        <div className="rainbow" aria-hidden>
          🌈
        </div>
        <p className="eyebrow">A bilingual garden adventure</p>
        <h1>
          Aria&apos;s<br />
          <span>Color Garden</span>
        </h1>
        <p className="intro">
          Colors, animals, shapes, counting, snacks, and dance — all in English and Spanish.
        </p>
        {collection.hydrated && collection.ownedCount > 0 && (
          <p className="collection-hint">
            Your friends are waiting! · ¡Tus amigos te esperan!
          </p>
        )}
        <button
          type="button"
          className="play"
          onClick={() => {
            audio.ensure();
            voice.speak(
              "Welcome to the color garden!",
              "¡Bienvenida al jardín de colores!",
              "welcome",
            );
            setScreen("hub");
          }}
        >
          Play • Jugar ▶
        </button>
        <p className="love">Made with love for Aria 💛</p>
        <div className="welcome-parent">
          <ParentGateFlower onOpen={() => setScreen("settings")} />
        </div>
      </section>
    </GardenScene>
  );
}
