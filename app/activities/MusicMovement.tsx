"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { MOVEMENTS } from "../data/catalog";
import { friendById } from "../data/friends";
import { shuffle, type RewardResult } from "../data/collection";
import { MUSIC_CUE_ART, characterArtId } from "../game/assets";
import type { MovementItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

const CUE_SLOTS = [
  { x: 0.1, y: 0.88 },
  { x: 0.26, y: 0.88 },
  { x: 0.42, y: 0.88 },
  { x: 0.58, y: 0.88 },
  { x: 0.74, y: 0.88 },
  { x: 0.9, y: 0.88 },
];

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
      <ActivityShell
        activityId="music"
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
          titleEn="What wonderful movers!"
          titleEs="¡Qué bien se mueven!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(MOVEMENTS));
            setStars(0);
            setRound(0);
            props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!");
          }}
          onHome={props.onHome}
        />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="music"
      stars={stars}
      starsNeeded={ROUNDS}
      collected={props.collected}
      catchingId={catchingId}
      busy={false}
      speechOn={props.speechOn}
      onToggleSpeech={props.onToggleSpeech}
      onOpenSettings={props.onOpenSettings}
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onRepeat={() => playMove(current)}
    >
      <div className="music-gazebo-scene" data-music-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">{current.en}</p>
          <p className="painted-prompt-line es">{current.es}</p>
        </div>

        <div className={`music-dancer ${anim ? `do-${current.cue}` : ""}`} aria-hidden>
          <CharacterSprite id={characterArtId("bunny")} size={160} pose={anim ? "celebrate" : "idle"} title="Dancer" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="music-current-cue" src={MUSIC_CUE_ART[current.cue]} alt="" draggable={false} />
        </div>

        <div className="music-cue-row" aria-label="Movements">
          {MOVEMENTS.map((m, i) => {
            const slot = CUE_SLOTS[i] || CUE_SLOTS[0];
            return (
              <button
                key={m.id}
                type="button"
                className={`music-cue-btn ${m.id === current.id ? "is-selected" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                onClick={() => playMove(m)}
                aria-label={`${m.en}, ${m.es}`}
              >
                <span className="env-choice-shadow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="music-cue-img" src={MUSIC_CUE_ART[m.cue]} alt="" draggable={false} />
                <span className="env-choice-label env-choice-label-lg">
                  <strong>{m.en}</strong>
                  <small>{m.es}</small>
                </span>
              </button>
            );
          })}
        </div>

        <button type="button" className="music-next-btn" onClick={next}>
          Next • Siguiente
        </button>
      </div>
    </ActivityShell>
  );
}
