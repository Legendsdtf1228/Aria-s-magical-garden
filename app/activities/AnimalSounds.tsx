"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenAnimal } from "../components/GardenAnimal";
import { SoftToast } from "../components/SoftToast";
import { GARDEN_ANIMALS, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

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

  if (complete) {
    return (
      <ActivityShell activityId="animalSounds" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="What careful listening!" titleEs="¡Qué bien escuchas!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(GARDEN_ANIMALS)); setStars(0); setRound(0); props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="animalSounds" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Who made that sound? • ¿Quién hizo ese sonido?</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#c08aff" }}>
          <span>Listen again</span><b>•</b><span>Escucha otra vez</span>
        </button>
      </section>
      <section className="choice-row animal-choices" aria-label="Friends">
        {choices.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`animal-btn ${wiggleId === a.id ? "bounce-back" : ""}`}
            onClick={() => pick(a.id)}
            aria-label={`${a.en}, ${a.es}`}
          >
            <GardenAnimal id={a.id} pose={poses[a.id] || "idle"} size={100} />
            <strong>{a.en}</strong>
            <small>{a.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
