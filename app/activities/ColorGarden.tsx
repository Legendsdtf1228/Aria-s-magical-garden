"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenStrip } from "../components/GardenStrip";
import { SoftToast } from "../components/SoftToast";
import { COLORS } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle } from "../data/collection";
import type { RewardResult } from "../data/collectionTypes";
import type { ColorItem } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

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

export function ColorGardenActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(COLORS));
  const [choices, setChoices] = useState<ColorItem[]>([]);
  const [selected, setSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ emoji: string; title: string; subtitle?: string; variant: "friend" | "sparkle" | "color" } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    const key = FIND_KEY[target.id] ?? "findColor";
    props.voice.speak(
      `Can you find the ${target.en.toLowerCase()} basket?`,
      `¿Puedes encontrar la canasta ${target.es.toLowerCase()}?`,
      key,
    );
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(COLORS, target, 3));
    setSelected(false);
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishRound = (reward: RewardResult) => {
    setBusy(true);
    setLastReward(reward);
    setToast({
      emoji: reward.emoji,
      title: reward.kind === "friend" ? `${reward.en} • ${reward.es}` : reward.en,
      subtitle: reward.kind === "friend" ? "New friend!" : reward.es,
      variant: reward.kind === "friend" ? "friend" : "sparkle",
    });
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.voice.speak(`Great job! ${target.en}. A new friend! ${reward.en}.`, `${target.es}. ${reward.es}.`);
      props.audio.sparkle();
    } else {
      props.voice.speak(`Great job! ${target.en}.`, `${target.es}. ${reward.es}`);
      props.audio.correct();
      setToast({
        emoji: target.emoji,
        title: `${target.en} • ${target.es}`,
        variant: "color",
      });
    }
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
    }, 1900);
  };

  const match = (c: ColorItem) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    if (c.id !== target.id) {
      setWiggleId(c.id);
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.", "tryAgain");
      setTimeout(() => setWiggleId(null), 500);
      return;
    }
    lock.current = true;
    setSelected(false);
    const reward = props.onAward();
    finishRound(reward);
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
          gardenStrip={<GardenStrip collected={props.collected} compact />}
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
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onRepeat={prompt}
    >
      <section className="prompt">
        <p>Match the color • Une el color</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: target.hex }}>
          <span>{target.en}</span>
          <b>•</b>
          <span>{target.es}</span>
        </button>
      </section>
      <section className="playarea">
        <button
          type="button"
          className={`blob ${selected ? "selected" : ""} ${busy ? "bounce" : ""}`}
          style={{ ["--friend" as string]: target.hex, ["--dark" as string]: target.dark }}
          onClick={() => {
            setSelected(true);
            props.voice.speak(`${target.en}.`, `${target.es}.`);
          }}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("id", target.id)}
          aria-label={`${target.en}, ${target.es}`}
        >
          <span className="eyes">
            <i />
            <i />
          </span>
          <span className="smile" />
        </button>
        <p>
          {selected ? "Now choose its basket!" : "Tap me, then a basket!"}
          <br />
          <span>{selected ? "¡Ahora elige su canasta!" : "¡Tócame, luego una canasta!"}</span>
        </p>
      </section>
      <section className="baskets" aria-label="Color choices">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`basket ${wiggleId === c.id ? "wiggle" : ""}`}
            onClick={() => match(c)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              match(c);
            }}
            style={{ ["--basket" as string]: c.hex, ["--bdark" as string]: c.dark }}
          >
            <span className="handle" />
            <span className="body">
              <b>{c.emoji}</b>
            </span>
            <strong>{c.en}</strong>
            <small>{c.es}</small>
          </button>
        ))}
      </section>
      <SoftToast
        show={!!toast}
        emoji={toast?.emoji}
        title={toast?.title ?? ""}
        subtitle={toast?.subtitle}
        variant={toast?.variant}
      />
    </ActivityShell>
  );
}
