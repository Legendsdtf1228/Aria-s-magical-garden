"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { SoftToast } from "../components/SoftToast";
import { GARDEN_ANIMALS, spanishAlALa, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { shuffle, type RewardResult } from "../data/collection";
import { characterArtId, FOOD_PROP_ART } from "../game/assets";
import type { ActivityCommonProps } from "./types";

const ROUNDS = 6;

const STAGE_SLOTS = [
  { x: 0.32, y: 0.62 },
  { x: 0.68, y: 0.62 },
];

const FOOD_SLOTS = [
  { x: 0.22, y: 0.88 },
  { x: 0.5, y: 0.9 },
  { x: 0.78, y: 0.88 },
];

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
      `¿Puedes alimentar ${spanishAlALa(target.gender)} ${target.es.toLowerCase()}?`,
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
      animal.gender === "f"
        ? `¡Ñam! A la ${animal.es.toLowerCase()} le encanta.`
        : `¡Ñam! Al ${animal.es.toLowerCase()} le encanta.`,
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

  const spriteSize =
    typeof window !== "undefined"
      ? Math.round(Math.min(220, Math.max(130, window.innerHeight * 0.22)))
      : 160;

  if (complete) {
    return (
      <ActivityShell
        activityId="feed"
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
          titleEn="Everyone is happily fed!"
          titleEs="¡Todos están felices!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(GARDEN_ANIMALS));
            setStars(0);
            setRound(0);
            props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain");
          }}
          onHome={props.onHome}
        />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="feed"
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
      <div className="picnic-feed-scene" data-feed-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">Feed the {target.en}</p>
          <p className="painted-prompt-line es">
            Alimenta {spanishAlALa(target.gender)} {target.es}
          </p>
        </div>

        <div className="picnic-friends" aria-label="Hungry friends">
          {stageAnimals.map((a, i) => {
            const slot = STAGE_SLOTS[i] || STAGE_SLOTS[0];
            return (
              <div
                key={a.id}
                className={`picnic-friend ${overId === a.id ? "is-over" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
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
                <span className="meadow-animal-shadow" aria-hidden />
                <CharacterSprite
                  id={characterArtId(a.id)}
                  size={spriteSize}
                  pose={poses[a.id] === "celebrate" ? "celebrate" : poses[a.id] === "eat" ? "tap" : "idle"}
                  title={`${a.en} ${a.es}`}
                />
                <span className="env-choice-label env-choice-label-lg">
                  <strong>{a.en}</strong>
                  <small>{a.es}</small>
                </span>
              </div>
            );
          })}
        </div>

        <div className="picnic-foods" aria-label="Food">
          {foodList.map((f, i) => {
            const slot = FOOD_SLOTS[i] || FOOD_SLOTS[0];
            const src = FOOD_PROP_ART[f.kind];
            return (
              <button
                key={f.kind + f.en}
                type="button"
                className={`picnic-food ${bounceFood === f.kind ? "is-wiggle" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("food", f.kind)}
                onClick={() => tryFeed(target.id, f.kind)}
                aria-label={`${f.en}, ${f.es}`}
              >
                <span className="env-choice-shadow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="picnic-food-img" src={src} alt="" draggable={false} />
                <span className="env-choice-label env-choice-label-lg">
                  <strong>{f.en}</strong>
                  <small>{f.es}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="friend" />
    </ActivityShell>
  );
}
