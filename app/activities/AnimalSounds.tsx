"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { SoftToast } from "../components/SoftToast";
import { GARDEN_ANIMALS, spanishElLa, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import { characterArtId } from "../game/assets";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

const GROVE_SLOTS = [
  { x: 0.2, y: 0.78 },
  { x: 0.5, y: 0.8 },
  { x: 0.8, y: 0.76 },
];

export function AnimalSoundsActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(GARDEN_ANIMALS));
  const [choices, setChoices] = useState(GARDEN_ANIMALS.slice(0, 3));
  const [busy, setBusy] = useState(false);
  const [poses, setPoses] = useState<Partial<Record<GardenAnimalId, AnimalPose>>>({});
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const playCue = useCallback(() => {
    props.audio.ensure();
    props.audio.animal(target.sound);
  }, [props.audio, target]);

  const prompt = useCallback(() => {
    playCue();
    setTimeout(() => {
      props.voice.speak("Who made that sound?", "¿Quién hizo ese sonido?");
    }, 450);
  }, [playCue, props.voice]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(GARDEN_ANIMALS, target, 3));
    setPoses({});
    lock.current = false;
    const t = setTimeout(prompt, 400);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id: GardenAnimalId) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    if (id !== target.id) {
      setWiggleId(id);
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.", "tryAgain");
      setTimeout(() => setWiggleId(null), 600);
      return;
    }
    lock.current = true;
    setBusy(true);
    setPoses({ [id]: "celebrate" });
    props.audio.animal(target.sound);
    props.voice.speak(
      `${target.en}.`,
      `${spanishElLa(target.gender) === "la" ? "La" : "El"} ${target.es.toLowerCase()}.`,
    );
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: `${target.en} • ${target.es}` });
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
      if (stars + 1 >= ROUNDS) props.onActivityComplete?.("animalSounds");
    }, 1800);
  };

  const onCatch = (id: Parameters<typeof props.onCatchFriend>[0]) => {
    if (!props.onCatchFriend(id)) return;
    const f = friendById(id);
    setCatchingId(id);
    props.audio.sparkle();
    if (f) props.voice.speak(`You caught a ${f.en}!`, `¡Atrapaste un ${f.es}!`);
    setTimeout(() => setCatchingId(null), 1200);
  };

  const spriteSize =
    typeof window !== "undefined"
      ? Math.round(Math.min(240, Math.max(140, window.innerHeight * 0.24)))
      : 180;

  if (complete) {
    return (
      <ActivityShell
        activityId="animalSounds"
        stars={stars}
        starsNeeded={ROUNDS}
        collected={props.collected}
        busy
        speechOn={props.speechOn}
        onToggleSpeech={props.onToggleSpeech}
        onOpenSettings={props.onOpenSettings}
        onHomeRequest={props.onHomeRequest}
        onCatchFriend={onCatch}
      >
        <ActivityComplete
          titleEn="What careful listening!"
          titleEs="¡Qué bien escuchas!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(GARDEN_ANIMALS));
            setStars(0);
            setRound(0);
            props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain");
          }}
          onHome={props.onHome}
        />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="animalSounds"
      stars={stars}
      starsNeeded={ROUNDS}
      collected={props.collected}
      catchingId={catchingId}
      busy={busy}
      speechOn={props.speechOn}
      onToggleSpeech={props.onToggleSpeech}
      onOpenSettings={props.onOpenSettings}
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onRepeat={prompt}
    >
      <div className="sound-grove-scene" data-sounds-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">Who made that sound?</p>
          <p className="painted-prompt-line es">¿Quién hizo ese sonido?</p>
        </div>

        <div className="meadow-choices" aria-label="Friends">
          {choices.slice(0, 3).map((a, i) => {
            const slot = GROVE_SLOTS[i] || GROVE_SLOTS[0];
            const win = poses[a.id] === "celebrate";
            return (
              <button
                key={a.id}
                type="button"
                className={`meadow-animal ${wiggleId === a.id ? "is-wiggle" : ""} ${win ? "is-celebrate" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                onClick={() => pick(a.id)}
                aria-label={`${a.en}, ${a.es}`}
              >
                <span className="meadow-animal-shadow" aria-hidden />
                <CharacterSprite
                  id={characterArtId(a.id)}
                  size={spriteSize}
                  pose={win ? "celebrate" : "idle"}
                  title={`${a.en} ${a.es}`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
