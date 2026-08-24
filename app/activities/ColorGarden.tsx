"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { SoftToast } from "../components/SoftToast";
import { COLORS } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle } from "../data/collection";
import type { RewardResult } from "../data/collectionTypes";
import type { ColorItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;
const CELEBRATE_MS = 1100;

const FIND_KEY: Record<string, string> = {
  red: "findRed",
  blue: "findBlue",
  yellow: "findYellow",
  green: "findGreen",
  purple: "findPurple",
  orange: "findOrange",
  pink: "findPink",
  brown: "findBrown",
  black: "findBlack",
  white: "findWhite",
};

type PropKind = "pot" | "can" | "bed" | "boots";

const COLOR_KIND: Record<string, PropKind> = {
  red: "pot",
  blue: "can",
  yellow: "bed",
  green: "bed",
  purple: "pot",
  orange: "can",
  pink: "boots",
  brown: "pot",
  black: "boots",
  white: "can",
};

const PROP_SRC: Record<PropKind, string> = {
  pot: "/art/objects/flower-pot.webp",
  can: "/art/objects/watering-can.webp",
  bed: "/art/objects/flower-bed.webp",
  boots: "/art/objects/garden-boots.webp",
};

const GROUND_SLOTS = [
  { x: 0.22, y: 0.8 },
  { x: 0.5, y: 0.84 },
  { x: 0.78, y: 0.8 },
];

export function ColorGardenActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(COLORS));
  const [choices, setChoices] = useState<ColorItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [bloomId, setBloomId] = useState<string | null>(null);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    subtitle?: string;
    variant: "friend" | "sparkle" | "color";
  } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    const key = FIND_KEY[target.id] ?? "findColor";
    props.voice.speak(`Find ${target.en}.`, `Encuentra ${target.es}.`, key);
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(COLORS, target, 3));
    setBloomId(null);
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishRound = (reward: RewardResult) => {
    setBusy(true);
    setLastReward(reward);
    setToast({
      title: reward.kind === "friend" ? `${reward.en} • ${reward.es}` : `${target.en} • ${target.es}`,
      subtitle: reward.kind === "friend" ? "New friend!" : undefined,
      variant: reward.kind === "friend" ? "friend" : "color",
    });
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.voice.speak(`Great job! ${target.en}.`, `${target.es}. ¡${reward.es}!`);
      props.audio.sparkle();
    } else {
      props.voice.speak(`Great job! ${target.en}.`, `¡Muy bien! ${target.es}.`);
      props.audio.correct();
    }
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setBloomId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
    }, CELEBRATE_MS);
  };

  const match = (c: ColorItem) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    if (c.id !== target.id) {
      setWiggleId(c.id);
      props.audio.retry();
      props.voice.speak("Try another one.", "Intenta otra.", "tryAgain");
      setTimeout(() => setWiggleId(null), 500);
      return;
    }
    lock.current = true;
    setBloomId(c.id);
    const reward = props.onAward();
    setTimeout(() => finishRound(reward), 280);
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
        activityId="colors"
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
          titleEn="You matched so many colors!"
          titleEs="¡Muy bien!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(COLORS));
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
      activityId="colors"
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
      <div className="color-flower-patch" data-color-v5="env-props">
        <div className="painted-prompt-sign color-patch-sign" role="status">
          <p className="painted-prompt-line">
            Find {target.en} <span aria-hidden>•</span> {target.es}
          </p>
          <p className="painted-prompt-line es">Encuentra el {target.es}</p>
        </div>

        <div className="color-ground-choices" aria-label="Color choices">
          {choices.map((c, i) => {
            const kind = COLOR_KIND[c.id] || "pot";
            const slot = GROUND_SLOTS[i] || GROUND_SLOTS[0];
            return (
              <button
                key={c.id}
                type="button"
                className={`env-color-choice kind-${kind} ${wiggleId === c.id ? "is-wiggle" : ""} ${bloomId === c.id ? "is-bloom" : ""}`}
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  ["--fill" as string]: c.hex,
                }}
                onClick={() => match(c)}
                aria-label={`${c.en}, ${c.es}`}
              >
                <span className="env-choice-shadow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="env-prop-img" src={PROP_SRC[kind]} alt="" draggable={false} />
                <span className="env-color-wash" aria-hidden />
                {bloomId === c.id && <span className="env-petal-swirl" aria-hidden />}
                <span className="env-choice-label">
                  <strong>{c.en}</strong>
                  <small>{c.es}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <SoftToast show={!!toast} title={toast?.title ?? ""} subtitle={toast?.subtitle} variant={toast?.variant} />
    </ActivityShell>
  );
}
