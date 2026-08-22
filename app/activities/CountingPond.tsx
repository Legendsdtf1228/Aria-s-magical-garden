"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenStrip } from "../components/GardenStrip";
import { SoftToast } from "../components/SoftToast";
import { COUNT_OBJECTS, NUMBERS } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import type { NumberItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 5;
const EN_COUNT = ["one", "two", "three", "four", "five"];
const ES_COUNT = ["uno", "dos", "tres", "cuatro", "cinco"];

export function CountingPondActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(NUMBERS));
  const [choices, setChoices] = useState<NumberItem[]>([]);
  const [objEmoji, setObjEmoji] = useState<string>("🐸");
  const [highlight, setHighlight] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [splash, setSplash] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; emoji: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(`How many ${objEmoji === "🐸" ? "frogs" : "friends"}?`, "¿Cuántas hay?");
  }, [props.voice, objEmoji]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(NUMBERS, target, 3));
    setObjEmoji(COUNT_OBJECTS[round % COUNT_OBJECTS.length]);
    setHighlight(-1);
    lock.current = false;
    const t = setTimeout(() => {
      props.voice.speak(
        `How many? Count with me.`,
        `¿Cuántas? Contemos juntos.`,
      );
    }, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const countAloud = async () => {
    const n = target.value;
    for (let i = 0; i < n; i++) {
      setHighlight(i);
      props.voice.speak(EN_COUNT[i], undefined);
      await new Promise((r) => setTimeout(r, 700));
    }
    for (let i = 0; i < n; i++) {
      setHighlight(i);
      props.voice.speak("", ES_COUNT[i]);
      await new Promise((r) => setTimeout(r, 700));
    }
    setHighlight(-1);
  };

  const pick = async (n: NumberItem) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    if (n.id !== target.id) {
      setWiggleId(n.id);
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.");
      setTimeout(() => setWiggleId(null), 500);
      return;
    }
    lock.current = true;
    setBusy(true);
    await countAloud();
    setSplash(true);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ emoji: "💧", title: `${n.digit} • ${n.en} • ${n.es}` });
    props.voice.speak(`Great job! ${n.en}.`, `${n.es}.`);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setSplash(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
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
      <ActivityShell activityId="counting" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="You counted so well!" titleEs="¡Contaste muy bien!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(NUMBERS)); setStars(0); setRound(0); props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!"); }} onHome={props.onHome} gardenStrip={<GardenStrip collected={props.collected} compact />} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="counting" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>How many? • ¿Cuántas?</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#5ed4cb" }}>
          <span>Count</span><b>•</b><span>Cuenta</span>
        </button>
      </section>
      <section className={`pond-area ${splash ? "splash" : ""}`} aria-label={`${target.value} objects`}>
        {Array.from({ length: target.value }, (_, i) => (
          <span key={i} className={`pond-item ${highlight === i ? "lit" : ""}`}>
            {objEmoji}
          </span>
        ))}
      </section>
      <section className="choice-row number-row" aria-label="Numbers">
        {choices.map((n) => (
          <button key={n.id} type="button" className={`big-choice number-choice ${wiggleId === n.id ? "wiggle" : ""}`} onClick={() => void pick(n)} aria-label={`${n.en}, ${n.es}`}>
            <span className="big-digit">{n.digit}</span>
            <strong>{n.en}</strong>
            <small>{n.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} emoji={toast?.emoji} title={toast?.title ?? ""} variant="color" />
    </ActivityShell>
  );
}
