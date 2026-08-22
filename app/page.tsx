"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimalFriendsActivity } from "./activities/AnimalFriends";
import { AnimalSoundsActivity } from "./activities/AnimalSounds";
import { ColorGardenActivity } from "./activities/ColorGarden";
import { CountingPondActivity } from "./activities/CountingPond";
import { FeedTheFriendsActivity } from "./activities/FeedTheFriends";
import { FindMyFriendActivity } from "./activities/FindMyFriend";
import { FreePlayGardenActivity } from "./activities/FreePlayGarden";
import { GardenCareActivity } from "./activities/GardenCare";
import { MusicMovementActivity } from "./activities/MusicMovement";
import { ShapeMeadowActivity } from "./activities/ShapeMeadow";
import { GardenMap } from "./components/GardenMap";
import { ParentSettingsPanel } from "./components/ParentSettings";
import { WelcomeGarden } from "./components/WelcomeGarden";
import { GARDEN_ANIMALS } from "./data/gardenAnimals";
import { transitionMs } from "./data/gardenMapCore.mjs";
import { useAudio } from "./hooks/useAudio";
import { useBilingualVoice } from "./hooks/useBilingualVoice";
import { useCollection } from "./hooks/useCollection";
import { useProgress } from "./hooks/useProgress";
import { useSettings } from "./hooks/useSettings";
import type { ActivityId, FriendId, Screen } from "./types/game";

const ACTIVITY_MAP = {
  colors: ColorGardenActivity,
  animals: AnimalFriendsActivity,
  shapes: ShapeMeadowActivity,
  counting: CountingPondActivity,
  feed: FeedTheFriendsActivity,
  music: MusicMovementActivity,
  findFriend: FindMyFriendActivity,
  animalSounds: AnimalSoundsActivity,
  gardenCare: GardenCareActivity,
  freePlay: FreePlayGardenActivity,
} as const;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<ActivityId | null>(null);
  const [settingsReturn, setSettingsReturn] = useState<Screen>("hub");

  // Production review capture: ?review=welcome|hub|findFriend|colors|counting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("review");
    if (!q) return;
    if (q === "welcome") {
      setScreen("welcome");
      setActivity(null);
      return;
    }
    if (q === "hub") {
      setScreen("hub");
      setActivity(null);
      return;
    }
    if (q === "findFriend" || q === "colors" || q === "counting") {
      setActivity(q);
      setScreen("activity");
    }
  }, []);
  const { settings, update } = useSettings();
  const collection = useCollection();
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
    setTransitioningTo(null);
    setScreen("hub");
    audio.ensure();
    audio.startAmbience();
  };

  const hearFriend = (id: FriendId) => {
    const a = GARDEN_ANIMALS.find((x) => x.id === id);
    if (!a) return;
    audio.ensure();
    audio.animal(a.sound);
    // “Bunny — Conejito” / “Frog — Rana” (EN then ES)
    voice.speak(`${a.en}.`, `${a.es}.`);
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
      onActivityComplete: (id: string) => progress.completeActivity(id as ActivityId),
      onUnlockSurprise: progress.addSurprise,
      onOpenSettings: () => {
        setSettingsReturn("activity");
        setScreen("settings");
      },
      languageMode: settings.languageMode ?? "both",
    }),
    [collection, settings.speechOn, settings.languageMode, voice, audio, update, progress],
  );

  const startActivity = (id: ActivityId) => {
    audio.ensure();
    audio.startAmbience();
    setTransitioningTo(id);
    const delay = transitionMs(prefersReducedMotion());
    window.setTimeout(() => {
      setActivity(id);
      setScreen("activity");
      setTransitioningTo(null);
    }, delay);
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
        onClose={() => setScreen(settingsReturn)}
      />
    );
  }

  if (screen === "activity" && activity) {
    const Activity = ACTIVITY_MAP[activity];
    return (
      <div className="scene-enter">
        <Activity {...common} />
        {leaveConfirm && (
          <div className="leave-overlay garden-leave" role="dialog" aria-label="Leave activity">
            <div className="leave-bubble">
              <p>Home? • ¿Inicio?</p>
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
                <button type="button" className="play secondary" onClick={() => setLeaveConfirm(false)}>
                  Keep playing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "hub") {
    return (
      <GardenMap
        collected={collection.collected}
        transitioningTo={transitioningTo}
        onSelect={startActivity}
        onOpenSettings={() => {
          setSettingsReturn("hub");
          setScreen("settings");
        }}
        onHearFriend={hearFriend}
        onSpeakLocation={(en, es) => {
          voice.cancel();
          voice.speak(en, es);
        }}
      />
    );
  }

  return (
    <WelcomeGarden
      collected={collection.collected}
      onOpenSettings={() => {
        setSettingsReturn("welcome");
        setScreen("settings");
      }}
      onHearFriend={hearFriend}
      onPlay={() => {
        audio.ensure();
        audio.startAmbience();
        voice.speak(
          "Welcome to your magical garden, Aria!",
          "¡Bienvenida a tu jardín mágico, Aria!",
          "welcome",
        );
        setScreen("hub");
      }}
    />
  );
}
