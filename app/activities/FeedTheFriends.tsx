"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenAnimal } from "../components/GardenAnimal";
import { SoftToast } from "../components/SoftToast";
import { GARDEN_ANIMALS, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { shuffle, type RewardResult } from "../data/collection";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

const FOOD_EMOJI: Record<string, string> = {
  carrot: "🥕",
  bone: "🦴",
  fish: "🐟",
  seeds: "🌾",
  fly: "🪰",
  flower: "🌼",
  berry: "🫐",
  leaf: "🍃",
};

export function FeedTheFriendsActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(GARDEN_ANIMALS));
  const [stageAnimals, setStageAnimals] = useState(GARDEN_ANIMALS.slice(0, 2));
  const [foods, setFoods] = useState(GARDEN_ANIMALS.slice(0, 3).map((a) => a.food));
  const [poses, setPoses] = useState<Partial<Record<GardenAnimalId, AnimalPose>>>({});
  const [bounceFood, setBounceFood] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const lock = useRef(false);
  const target = order[round % order.length];
  const complete = stars >= ROUNDS;

  const prompt = useCallback(() => {
    props.voice.speak(
      `Can you feed the ${target.en.toLowerCase()}?`,
      `¿Puedes alimentar al ${target.es.toLowerCase()}?`,
      "feedFriend",
    );
  }, [props.voice, target]);

  useEffect(() => {
    if (complete) return;
    const others = shuffle(GARDEN_ANIMALS.filter((a) => a.id !== target.id)).slice(0, 1);
    const onStage = shuffle([target, ...others]);
    setStageAnimals(onStage);
    const wrongFoods = shuffle(GARDEN_ANIMALS.filter((a) => a.id !== target.id))
      .slice(0, 2)
      .map((a) => a.food);
    setFoods(shuffle([target.food, ...wrongFoods]));
    setPoses({});
    lock.current = false;
    const t = setTimeout(prompt, 400);
    return () => clearTimeout(t);
  }, [round, target, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const tryFeed = (animalId: GardenAnimalId, foodKind: string) => {
    if (busy || complete || lock.current) return;
    props.audio.ensure();
    props.audio.tap();
    const animal = GARDEN_ANIMALS.find((a) => a.id === animalId)!;
    if (animalId !== target.id || foodKind !== target.food.kind) {
      setBounceFood(foodKind);
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.", "tryAgain");
      setTimeout(() => setBounceFood(null), 550);
      return;
    }
    lock.current = true;
    setBusy(true);
    setPoses({ [animalId]: "eat" });
    props.voice.speak(
      `Yum! The ${animal.en} loves ${animal.food.en}.`,
      `¡Ñam! Al ${animal.es} le encanta.`,
    );
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: `${animal.en} • ${animal.food.en}` });
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setPoses({ [animalId]: "celebrate" });
    }, 700);
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      lock.current = false;
      if (stars + 1 >= ROUNDS) props.onActivityComplete?.("feed");
    }, 1900);
  };

  const foodList = useMemo(() => foods, [foods]);

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
      <ActivityShell activityId="feed" stars={stars} starsNeeded={ROUNDS} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="Everyone is happily fed!" titleEs="¡Todos están felices!" stars={stars} reward={lastReward} onAgain={() => { setOrder(shuffle(GARDEN_ANIMALS)); setStars(0); setRound(0); props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="feed" stars={stars} starsNeeded={ROUNDS} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Feed the friends • Alimenta a los amigos</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#ffb347" }}>
          <span>{target.en}</span><b>•</b><span>{target.es}</span>
        </button>
      </section>
      <section className="feed-stage" aria-label="Hungry friends">
        {stageAnimals.map((a) => (
          <div
            key={a.id}
            className={`feed-drop ${overId === a.id ? "over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(a.id);
            }}
            onDragLeave={() => setOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOverId(null);
              const kind = e.dataTransfer.getData("food");
              if (kind) tryFeed(a.id, kind);
            }}
          >
            <GardenAnimal id={a.id} pose={poses[a.id] || "idle"} size={110} />
            <strong>{a.en}</strong>
            <small>{a.es}</small>
          </div>
        ))}
      </section>
      <section className="food-tray" aria-label="Food">
        {foodList.map((f) => (
          <button
            key={f.kind + f.en}
            type="button"
            className={`food-token ${bounceFood === f.kind ? "bounce-back" : ""}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("food", f.kind)}
            onClick={() => {
              // Tap fallback: feed the target animal if this is the correct food
              tryFeed(target.id, f.kind);
            }}
            aria-label={`${f.en}, ${f.es}`}
          >
            <span className="food-art">{FOOD_EMOJI[f.kind] || "🍽️"}</span>
            <strong>{f.en}</strong>
            <small>{f.es}</small>
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
