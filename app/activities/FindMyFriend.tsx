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

/**
 * Find My Friend — painted meadow, large full-body animals, no white cards / emoji / SVG.
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
    setChoices(pickChoices(GARDEN_ANIMALS, target, 3));
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
      <div className="painted-prompt-sign" role="status">
        <p className="painted-prompt-line">Find the {target.en}</p>
        <p className="painted-prompt-line es">Encuentra el {target.es}</p>
      </div>
      <section className="painted-choice-row" aria-label="Friends">
        {choices.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`painted-choice-animal ${wiggleId === a.id ? "is-wiggle" : ""} ${celebrateId === a.id ? "is-celebrate" : ""}`}
            onClick={() => pick(a.id)}
            aria-label={`${a.en}, ${a.es}`}
          >
            <CharacterSprite
              id={characterArtId(a.id)}
              size={Math.round(typeof window !== "undefined" ? Math.min(220, window.innerHeight * 0.24) : 180)}
              pose={celebrateId === a.id ? "celebrate" : "idle"}
              title={`${a.en} ${a.es}`}
            />
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
