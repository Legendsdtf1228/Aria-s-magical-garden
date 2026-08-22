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
const CELEBRATE_MS = 900;

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

/** Familiar colored garden objects — no tiny unrelated emoji. */
const COLOR_OBJECT: Record<string, { kind: string; label: string }> = {
  red: { kind: "pot", label: "Flower pot" },
  blue: { kind: "can", label: "Watering can" },
  yellow: { kind: "puddle", label: "Paint puddle" },
  green: { kind: "bed", label: "Flower bed" },
  purple: { kind: "pot", label: "Flower pot" },
  orange: { kind: "can", label: "Watering can" },
  pink: { kind: "bed", label: "Flower bed" },
  brown: { kind: "pot", label: "Flower pot" },
  black: { kind: "puddle", label: "Paint puddle" },
  white: { kind: "can", label: "Watering can" },
};

export function ColorGardenActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(COLORS));
  const [choices, setChoices] = useState<ColorItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [hopTo, setHopTo] = useState<string | null>(null);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    subtitle?: string;
    variant: "friend" | "sparkle" | "color";
  } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const [sparkleBurst, setSparkleBurst] = useState(false);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    const key = FIND_KEY[target.id] ?? "findColor";
    props.voice.speak(
      `Find ${target.en}.`,
      `Encuentra ${target.es}.`,
      key,
    );
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(COLORS, target, 3));
    setHopTo(null);
    setSparkleBurst(false);
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishRound = (reward: RewardResult) => {
    setBusy(true);
    setLastReward(reward);
    setSparkleBurst(true);
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
      setHopTo(null);
      setSparkleBurst(false);
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
    setHopTo(c.id);
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

  const hearFriend = (id: Parameters<typeof props.onCatchFriend>[0]) => {
    const f = friendById(id);
    if (!f) return;
    props.audio.animal(
      f.id === "butterfly"
        ? "flutter"
        : f.id === "bunny"
          ? "hop"
          : f.id === "ladybug"
            ? "crawl"
            : f.id === "bee"
              ? "buzz"
              : f.id === "frog"
                ? "ribbit"
                : f.id === "cat"
                  ? "meow"
                  : f.id === "puppy"
                    ? "bark"
                    : "chirp",
    );
    props.voice.speak(`${f.en}.`, `${f.es}.`);
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
        onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings}
        onHomeRequest={props.onHomeRequest}
        onCatchFriend={onCatch}
        onHearFriend={hearFriend}
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
      onHearFriend={hearFriend}
      onRepeat={prompt}
    >
      <div className="color-stage painted-color-stage">
        <div className="painted-prompt-sign" style={{ ["--target" as string]: target.hex }}>
          <p className="painted-prompt-line">
            Find {target.en} <span aria-hidden>•</span> {target.es}
          </p>
          <p className="painted-prompt-line es">Encuentra el {target.es}</p>
        </div>

        <section className="painted-color-choices" aria-label="Color choices">
          {choices.map((c) => {
            const obj = COLOR_OBJECT[c.id] || COLOR_OBJECT.red;
            return (
              <button
                key={c.id}
                type="button"
                className={`painted-color-object kind-${obj.kind} ${wiggleId === c.id ? "is-wiggle" : ""} ${hopTo === c.id ? "is-correct" : ""}`}
                onClick={() => match(c)}
                style={{ ["--fill" as string]: c.hex, ["--shade" as string]: c.dark }}
                aria-label={`${c.en}, ${c.es}`}
              >
                <span className="painted-color-shape" aria-hidden />
                <strong>{c.en}</strong>
                <small>{c.es}</small>
              </button>
            );
          })}
        </section>
        {sparkleBurst && <div className="painted-petal-burst" aria-hidden />}
      </div>

      <SoftToast show={!!toast} title={toast?.title ?? ""} subtitle={toast?.subtitle} variant={toast?.variant} />
    </ActivityShell>
  );
}
