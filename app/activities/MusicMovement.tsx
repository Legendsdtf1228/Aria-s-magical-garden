"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { MOVEMENTS } from "../data/catalog";
import { friendById } from "../data/friends";
import { shuffle, type RewardResult } from "../data/collection";
import type { MovementItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

export function MusicMovementActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(MOVEMENTS));
  const [current, setCurrent] = useState<MovementItem>(order[0]);
  const [anim, setAnim] = useState(false);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const complete = stars >= ROUNDS;

  const playMove = useCallback(
    (m: MovementItem) => {
      props.audio.ensure();
      setCurrent(m);
      setAnim(false);
      props.voice.speak(m.en, undefined);
      setTimeout(() => {
        props.voice.speak("", m.es);
        props.audio.movementCue(m.cue);
        setAnim(true);
      }, 900);
    },
    [props.audio, props.voice],
  );

  useEffect(() => {
    if (complete) return;
    const m = order[round % order.length];
    const t = setTimeout(() => playMove(m), 300);
    return () => clearTimeout(t);
  }, [round, order, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    props.audio.ensure();
    props.audio.tap();
    const reward = props.onAward();
    setLastReward(reward);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
      props.voice.speak(`A new friend! ${reward.en}.`, `${reward.es}.`);
    } else {
      props.audio.correct();
    }
    setTimeout(() => {
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
    }, 900);
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
      <ActivityShell activityId="music" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="What wonderful movers!" titleEs="¡Qué bien se mueven!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(MOVEMENTS)); setStars(0); setRound(0); props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="music" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={false} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={() => playMove(current)}>
      <section className="prompt">
        <p>Move with me • Muévete conmigo</p>
        <button type="button" onClick={() => playMove(current)} style={{ ["--target" as string]: "#c08aff" }}>
          <span>{current.en}</span><b>•</b><span>{current.es}</span>
        </button>
      </section>
      <section className="playarea stage-area">
        <div className={`dancer ${anim ? `do-${current.cue}` : ""}`} aria-hidden>
          <span className="big-emoji">🧒</span>
          <span className="move-emoji">{current.emoji}</span>
        </div>
        <p>
          {current.en}! · ¡{current.es}!
        </p>
      </section>
      <section className="choice-row wrap-row" aria-label="Movements">
        {MOVEMENTS.map((m) => (
          <button key={m.id} type="button" className={`big-choice mini-choice ${m.id === current.id ? "selected" : ""}`} onClick={() => playMove(m)} aria-label={`${m.en}, ${m.es}`}>
            <span className="big-emoji">{m.emoji}</span>
            <strong>{m.en}</strong>
          </button>
        ))}
      </section>
      <div className="finish-actions music-next">
        <button type="button" className="play" onClick={next}>
          Next • Siguiente ▶
        </button>
      </div>
    </ActivityShell>
  );
}
