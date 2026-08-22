"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { SoftToast } from "../components/SoftToast";
import { ANIMALS } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import type { AnimalItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

export function AnimalFriendsActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(ANIMALS));
  const [choices, setChoices] = useState<AnimalItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ emoji: string; title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(`Can you find the ${target.en.toLowerCase()}?`, `¿Puedes encontrar el ${target.es.toLowerCase()}?`);
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(ANIMALS, target, 3));
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (a: AnimalItem) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    props.voice.speak(`${a.en}.`, `${a.es}.`);
    props.audio.animal(a.sound);
    if (a.id !== target.id) {
      setWiggleId(a.id);
      props.audio.retry();
      setTimeout(() => {
        props.voice.speak("Let's try another one.", "Intentemos otra vez.");
        setWiggleId(null);
      }, 700);
      return;
    }
    lock.current = true;
    setBusy(true);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ emoji: a.emoji, title: `${a.en} • ${a.es}` });
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
      <ActivityShell activityId="animals" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="You found so many animals!" titleEs="¡Muy bien!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(ANIMALS)); setStars(0); setRound(0); props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="animals" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Find the animal • Encuentra el animal</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#7ec8ff" }}>
          <span>{target.en}</span><b>•</b><span>{target.es}</span>
        </button>
      </section>
      <section className="choice-row animal-row" aria-label="Animals">
        {choices.map((a) => (
          <button key={a.id} type="button" className={`big-choice ${wiggleId === a.id ? "wiggle" : ""} ${busy && a.id === target.id ? "bounce" : ""}`} onClick={() => pick(a)} aria-label={`${a.en}, ${a.es}`}>
            <span className="big-emoji">{a.emoji}</span>
            <strong>{a.en}</strong>
            <small>{a.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} emoji={toast?.emoji} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
