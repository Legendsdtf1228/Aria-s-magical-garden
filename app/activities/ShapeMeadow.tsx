"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { SoftToast } from "../components/SoftToast";
import { SHAPES } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import type { ShapeItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

function ShapeVisual({ kind, className = "" }: { kind: ShapeItem["kind"]; className?: string }) {
  return <span className={`shape-vis shape-${kind} ${className}`} aria-hidden />;
}

export function ShapeMeadowActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(SHAPES));
  const [choices, setChoices] = useState<ShapeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [planted, setPlanted] = useState<string[]>([]);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ emoji: string; title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(`Find the ${target.en.toLowerCase()}.`, `Busca el ${target.es.toLowerCase()}.`);
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(SHAPES, target, 3));
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (s: ShapeItem) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    if (s.id !== target.id) {
      setWiggleId(s.id);
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.");
      setTimeout(() => setWiggleId(null), 500);
      return;
    }
    lock.current = true;
    setBusy(true);
    setPlanted((p) => [...p, s.gardenEmoji]);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ emoji: s.gardenEmoji, title: `${s.en} • ${s.es}` });
    props.voice.speak(`Great job! ${s.en}.`, `${s.es}.`);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setStars((x) => x + 1);
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
      <ActivityShell activityId="shapes" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="Your meadow is blooming!" titleEs="¡Qué lindo prado!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(SHAPES)); setStars(0); setRound(0); setPlanted([]); props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="shapes" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Match the shape • Une la forma</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#9ad67a" }}>
          <span>{target.en}</span><b>•</b><span>{target.es}</span>
        </button>
      </section>
      <section className="playarea">
        <div className={`shape-hero ${busy ? "bounce" : ""}`}>
          <ShapeVisual kind={target.kind} />
        </div>
        <div className="planted-row" aria-label="Garden shapes">
          {planted.map((e, i) => (
            <span key={`${e}-${i}`} className="planted">{e}</span>
          ))}
        </div>
      </section>
      <section className="choice-row" aria-label="Shapes">
        {choices.map((s) => (
          <button key={s.id} type="button" className={`big-choice shape-choice ${wiggleId === s.id ? "wiggle" : ""}`} onClick={() => pick(s)} aria-label={`${s.en}, ${s.es}`}>
            <ShapeVisual kind={s.kind} />
            <strong>{s.en}</strong>
            <small>{s.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} emoji={toast?.emoji} title={toast?.title ?? ""} variant="sparkle" />
    </ActivityShell>
  );
}
