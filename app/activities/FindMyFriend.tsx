"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { SoftToast } from "../components/SoftToast";
import { characterArtId } from "../game/assets";
import { GARDEN_ANIMALS, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

/** Three meadow ground slots — feet anchors. Exactly three answers. */
const MEADOW_SLOTS = [
  { x: 0.2, y: 0.78 },
  { x: 0.5, y: 0.8 },
  { x: 0.8, y: 0.76 },
];

/**
 * Find My Friend — dedicated Animal Meadow, exactly three full-body painted animals.
 * No decorative friends. No shared garden-map mural.
 */
export function FindMyFriendActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(GARDEN_ANIMALS));
  const [choices, setChoices] = useState(GARDEN_ANIMALS.slice(0, 3));
  const [busy, setBusy] = useState(false);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(
      `Find the ${target.en.toLowerCase()}.`,
      `Encuentra el ${target.es.toLowerCase()}.`,
    );
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    // Always exactly three distinct choices
    const next = pickChoices(GARDEN_ANIMALS, target, 3).slice(0, 3);
    setChoices(next);
    setCelebrateId(null);
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
      props.voice.speak("Try another one.", "Intenta otra.", "tryAgain");
      setTimeout(() => setWiggleId(null), 600);
      return;
    }
    lock.current = true;
    setBusy(true);
    setCelebrateId(id);
    props.audio.animal(target.sound);
    props.voice.speak(`${target.en}.`, `${target.es}.`);
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
      setCelebrateId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
      if (stars + 1 >= ROUNDS) props.onActivityComplete?.("findFriend");
    }, 1600);
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
        activityId="findFriend"
        stars={stars}
        starsNeeded={ROUNDS}
        collected={props.collected}
        catchingId={catchingId}
        busy
        speechOn={props.speechOn}
        onHomeRequest={props.onHomeRequest}
        onCatchFriend={onCatch}
        onOpenSettings={props.onOpenSettings}
      >
        <ActivityComplete
          titleEn="You found your friends!"
          titleEs="¡Encontraste a tus amigos!"
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
      activityId="findFriend"
      stars={stars}
      starsNeeded={ROUNDS}
      collected={props.collected}
      catchingId={catchingId}
      busy={busy}
      speechOn={props.speechOn}
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onOpenSettings={props.onOpenSettings}
      onRepeat={prompt}
    >
      <div className="animal-meadow" data-find-v5="meadow-three">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">Find the {target.en}</p>
          <p className="painted-prompt-line es">Encuentra el {target.es}</p>
        </div>

        <div className="meadow-choices" aria-label="Friends">
          {choices.slice(0, 3).map((a, i) => {
            const slot = MEADOW_SLOTS[i] || MEADOW_SLOTS[0];
            const isWin = celebrateId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                className={`meadow-animal ${wiggleId === a.id ? "is-wiggle" : ""} ${isWin ? "is-celebrate" : ""}`}
                style={{
                  left: `${isWin ? 50 : slot.x * 100}%`,
                  top: `${isWin ? 62 : slot.y * 100}%`,
                }}
                onClick={() => pick(a.id)}
                aria-label={`${a.en}, ${a.es}`}
              >
                <span className="meadow-animal-shadow" aria-hidden />
                <CharacterSprite
                  id={characterArtId(a.id)}
                  size={spriteSize}
                  pose={isWin ? "celebrate" : "idle"}
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
