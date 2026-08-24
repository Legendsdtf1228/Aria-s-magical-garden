"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { SoftToast } from "../components/SoftToast";
import { SHAPES } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle, type RewardResult } from "../data/collection";
import { SHAPE_STONE_ART } from "../game/assets";
import type { ShapeItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

/** Feminine Spanish shape nouns use "la". */
const SHAPE_GENDER: Record<string, "m" | "f"> = {
  circle: "m",
  square: "m",
  triangle: "m",
  star: "f",
  heart: "m",
  oval: "m",
};

const GROUND_SLOTS = [
  { x: 0.22, y: 0.8 },
  { x: 0.5, y: 0.84 },
  { x: 0.78, y: 0.8 },
];

export function ShapeMeadowActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(SHAPES));
  const [choices, setChoices] = useState<ShapeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [planted, setPlanted] = useState<string[]>([]);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;
  const art = SHAPE_GENDER[target.id] === "f" ? "la" : "el";

  const prompt = useCallback(() => {
    props.voice.speak(
      `Find the ${target.en.toLowerCase()}.`,
      `Busca ${art} ${target.es.toLowerCase()}.`,
    );
  }, [props.voice, target, art]);

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
    setPlanted((p) => [...p, s.id]);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: `${s.en} • ${s.es}` });
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
      <ActivityShell
        activityId="shapes"
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
          titleEn="Your meadow is blooming!"
          titleEs="¡Qué lindo prado!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(SHAPES));
            setStars(0);
            setRound(0);
            setPlanted([]);
            props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!");
          }}
          onHome={props.onHome}
        />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="shapes"
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
      <div className="shape-meadow-scene" data-shapes-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">Find the {target.en}</p>
          <p className="painted-prompt-line es">
            Busca {art} {target.es}
          </p>
        </div>

        <div className="shape-hero-spot" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="shape-hero-img" src={SHAPE_STONE_ART[target.kind]} alt="" draggable={false} />
        </div>

        <div className="shape-planted-row" aria-label="Collected shapes">
          {planted.map((id, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${id}-${i}`} className="shape-planted-img" src={SHAPE_STONE_ART[id]} alt="" draggable={false} />
          ))}
        </div>

        <div className="color-ground-choices" aria-label="Shapes">
          {choices.map((s, i) => {
            const slot = GROUND_SLOTS[i] || GROUND_SLOTS[0];
            return (
              <button
                key={s.id}
                type="button"
                className={`env-color-choice ${wiggleId === s.id ? "is-wiggle" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                onClick={() => pick(s)}
                aria-label={`${s.en}, ${s.es}`}
              >
                <span className="env-choice-shadow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="env-prop-img" src={SHAPE_STONE_ART[s.kind]} alt="" draggable={false} />
                <span className="env-choice-label env-choice-label-lg">
                  <strong>{s.en}</strong>
                  <small>{s.es}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="sparkle" />
    </ActivityShell>
  );
}
