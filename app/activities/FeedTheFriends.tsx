"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenStrip } from "../components/GardenStrip";
import { SoftToast } from "../components/SoftToast";
import { FEED_PAIRS } from "../data/catalog";
import { friendById } from "../data/friends";
import { shuffle, type RewardResult } from "../data/collection";
import type { FeedPair } from "../types/game";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

export function FeedTheFriendsActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(FEED_PAIRS));
  const [foods, setFoods] = useState<FeedPair["food"][]>([]);
  const [pickedFood, setPickedFood] = useState<string | null>(null);
  const [eating, setEating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [toast, setToast] = useState<{ emoji: string; title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(
      `Feed the ${target.animal.en.toLowerCase()}.`,
      `Alimenta al ${target.animal.es.toLowerCase()}.`,
    );
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    const wrong = shuffle(FEED_PAIRS.filter((p) => p.id !== target.id))
      .slice(0, 2)
      .map((p) => p.food);
    setFoods(shuffle([target.food, ...wrong]));
    setPickedFood(null);
    setEating(false);
    lock.current = false;
    const t = setTimeout(prompt, 350);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const tryFeed = (foodEn: string) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    setPickedFood(foodEn);
    const food = foods.find((f) => f.en === foodEn);
    if (food) props.voice.speak(food.en, food.es);
    if (foodEn !== target.food.en) {
      setWiggle(foodEn);
      props.audio.retry();
      setTimeout(() => {
        props.voice.speak("Let's try another one.", "Intentemos otra vez.");
        setWiggle(null);
        setPickedFood(null);
      }, 700);
      return;
    }
    lock.current = true;
    setBusy(true);
    setEating(true);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({
      emoji: target.animal.emoji,
      title: `Yum! ${target.food.en} • ${target.food.es}`,
    });
    props.voice.speak(`Yum! The ${target.animal.en} loves ${target.food.en}.`, `¡Ñam! Al ${target.animal.es} le encanta.`);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setEating(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
    }, 2000);
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
      <ActivityShell activityId="feed" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="Everyone is happily fed!" titleEs="¡Todos están felices!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(FEED_PAIRS)); setStars(0); setRound(0); props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!"); }} onHome={props.onHome} gardenStrip={<GardenStrip collected={props.collected} compact />} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="feed" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Feed the friend • Alimenta al amigo</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#ffb347" }}>
          <span>{target.animal.en}</span><b>•</b><span>{target.animal.es}</span>
        </button>
      </section>
      <section className="playarea">
        <button
          type="button"
          className={`feed-animal ${eating ? "eating" : ""}`}
          onClick={() => props.voice.speak(target.animal.en, target.animal.es)}
          aria-label={`${target.animal.en}, ${target.animal.es}`}
        >
          <span className="big-emoji">{target.animal.emoji}</span>
          {eating && <span className="yum">😋</span>}
        </button>
        <p>Tap the food, then feed! · ¡Toca la comida!</p>
      </section>
      <section className="choice-row" aria-label="Food">
        {foods.map((f) => (
          <button
            key={f.en}
            type="button"
            className={`big-choice ${pickedFood === f.en ? "selected" : ""} ${wiggle === f.en ? "wiggle" : ""}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("food", f.en)}
            onClick={() => tryFeed(f.en)}
            aria-label={`${f.en}, ${f.es}`}
          >
            <span className="big-emoji">{f.emoji}</span>
            <strong>{f.en}</strong>
            <small>{f.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} emoji={toast?.emoji} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
