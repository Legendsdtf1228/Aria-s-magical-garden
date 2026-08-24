"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { GARDEN_ANIMALS, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import { CARE_TOOL_ART, FOOD_PROP_ART, characterArtId } from "../game/assets";
import type { ActivityCommonProps } from "./types";

type Sparkle = { id: number; x: number; y: number };

function layoutFriends(list: { id: GardenAnimalId }[]) {
  return list.map((f, i) => ({
    id: f.id,
    left: 18 + (i % 4) * 20,
    top: 42 + Math.floor(i / 4) * 22,
  }));
}

export function FreePlayGardenActivity(props: ActivityCommonProps) {
  const friends = useMemo(() => {
    const owned = props.collected.length
      ? GARDEN_ANIMALS.filter((a) => props.collected.includes(a.id))
      : GARDEN_ANIMALS.slice(0, 3);
    return owned.length ? owned : GARDEN_ANIMALS.slice(0, 3);
  }, [props.collected]);

  const [poses, setPoses] = useState<Partial<Record<GardenAnimalId, AnimalPose>>>({});
  const [positions, setPositions] = useState(() => layoutFriends(friends));
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [rainbow, setRainbow] = useState(false);
  const [rain, setRain] = useState(false);

  useEffect(() => {
    setPositions((prev) => {
      const next = layoutFriends(friends);
      return next.map((n) => prev.find((p) => p.id === n.id) ?? n);
    });
  }, [friends]);

  const speakFriend = useCallback(
    (id: GardenAnimalId) => {
      const a = GARDEN_ANIMALS.find((x) => x.id === id)!;
      props.audio.ensure();
      props.audio.animal(a.sound);
      props.voice.speak(a.en + ".", a.es + ".");
      setPoses((p) => ({ ...p, [id]: "tap" }));
      setTimeout(() => setPoses((p) => ({ ...p, [id]: "celebrate" })), 200);
      setTimeout(() => setPoses((p) => ({ ...p, [id]: "idle" })), 1400);
    },
    [props.audio, props.voice],
  );

  const addSparkle = (x: number, y: number, surprise?: string) => {
    const id = Date.now() + Math.random();
    setSparkles((s) => [...s, { id, x, y }]);
    props.audio.ensure();
    props.audio.sparkle();
    if (surprise) props.onUnlockSurprise?.(surprise);
    setTimeout(() => setSparkles((s) => s.filter((x) => x.id !== id)), 900);
  };

  const prompt = () => {
    props.voice.speak(
      "Play in the garden! Tap the friends.",
      "¡Juega en el jardín! Toca a los amigos.",
    );
  };

  const onCatch = (id: Parameters<typeof props.onCatchFriend>[0]) => {
    if (!props.onCatchFriend(id)) return;
    const f = friendById(id);
    props.audio.sparkle();
    if (f) props.voice.speak(`You caught a ${f.en}!`, `¡Atrapaste un ${f.es}!`);
  };

  return (
    <ActivityShell
      activityId="freePlay"
      stars={0}
      starsNeeded={0}
      collected={props.collected}
      busy={false}
      speechOn={props.speechOn}
      onToggleSpeech={props.onToggleSpeech}
      onOpenSettings={props.onOpenSettings}
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onRepeat={prompt}
    >
      <div className={`freeplay-path-scene ${rain ? "is-raining" : ""}`} data-freeplay-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">Play in the garden</p>
          <p className="painted-prompt-line es">Juega en el jardín</p>
        </div>

        <button
          type="button"
          className="freeplay-sky-tap sun"
          aria-label="Sun"
          onClick={() => {
            setRainbow(true);
            addSparkle(80, 12, "rainbow");
            props.voice.speak("A rainbow!", "¡Un arcoíris!");
            setTimeout(() => setRainbow(false), 2000);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CARE_TOOL_ART.sun} alt="" draggable={false} />
        </button>
        <button
          type="button"
          className="freeplay-sky-tap cloud"
          aria-label="Cloud"
          onClick={() => {
            setRain(true);
            addSparkle(18, 20, "rain");
            props.voice.speak("Soft rain!", "¡Llovizna suave!");
            setTimeout(() => setRain(false), 1800);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CARE_TOOL_ART.water} alt="" draggable={false} />
        </button>

        {rainbow && <div className="freeplay-rainbow" aria-hidden />}

        {positions.map((p) => {
          const a = GARDEN_ANIMALS.find((x) => x.id === p.id)!;
          return (
            <button
              key={p.id}
              type="button"
              className="freeplay-friend"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("friend", p.id)}
              onDragEnd={(e) => {
                const host = e.currentTarget.parentElement;
                if (!host) return;
                const rect = host.getBoundingClientRect();
                const left = Math.min(78, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100));
                const top = Math.min(78, Math.max(28, ((e.clientY - rect.top) / rect.height) * 100));
                setPositions((prev) => prev.map((x) => (x.id === p.id ? { ...x, left, top } : x)));
                setPoses((po) => ({ ...po, [p.id]: "move" }));
                setTimeout(() => setPoses((po) => ({ ...po, [p.id]: "idle" })), 800);
              }}
              onClick={() => speakFriend(p.id)}
              aria-label={`${a.en}, ${a.es}`}
            >
              <CharacterSprite
                id={characterArtId(p.id)}
                size={110}
                pose={poses[p.id] === "celebrate" ? "celebrate" : poses[p.id] === "tap" ? "tap" : "idle"}
                title={`${a.en} ${a.es}`}
              />
            </button>
          );
        })}

        {sparkles.map((s) => (
          <span key={s.id} className="freeplay-spark" style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-hidden />
        ))}

        <div className="freeplay-food-tray" aria-label="Snacks">
          {friends.slice(0, 4).map((a, i) => (
            <button
              key={a.id}
              type="button"
              className="freeplay-food"
              style={{ left: `${18 + i * 20}%` }}
              onClick={() => {
                setPoses((p) => ({ ...p, [a.id]: "eat" }));
                props.audio.ensure();
                props.audio.correct();
                props.voice.speak(`Yum! ${a.food.en}.`, `¡Ñam! ${a.food.es}.`);
                setTimeout(() => setPoses((p) => ({ ...p, [a.id]: "idle" })), 1200);
              }}
              aria-label={`Feed ${a.en}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FOOD_PROP_ART[a.food.kind]} alt="" draggable={false} />
              <span className="env-choice-label env-choice-label-lg">
                <strong>{a.food.en}</strong>
                <small>{a.food.es}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ActivityShell>
  );
}
