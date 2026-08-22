"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityShell } from "../components/ActivityShell";
import { GardenAnimal } from "../components/GardenAnimal";
import { GARDEN_ANIMALS, type AnimalPose, type GardenAnimalId } from "../data/gardenAnimals";
import { friendById } from "../data/friends";
import type { ActivityCommonProps } from "./types";

type Sparkle = { id: number; x: number; y: number; text: string };

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

function layoutFriends(list: { id: GardenAnimalId }[]) {
  return list.map((f, i) => ({
    id: f.id,
    left: 12 + (i % 4) * 22,
    top: 28 + Math.floor(i / 4) * 28,
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
  const [feedId, setFeedId] = useState<GardenAnimalId | null>(null);

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

  const addSparkle = (x: number, y: number, text: string, surprise?: string) => {
    const id = Date.now() + Math.random();
    setSparkles((s) => [...s, { id, x, y, text }]);
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
      onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings}
      onHomeRequest={props.onHomeRequest}
      onCatchFriend={onCatch}
      onRepeat={prompt}
    >
      <section className="prompt">
        <p>Free play • Jardín libre</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#7ec8ff" }}>
          <span>Play</span><b>•</b><span>Jugar</span>
        </button>
      </section>

      <div className={`free-garden ${rain ? "raining" : ""}`} aria-label="Open garden">
        <button
          type="button"
          className="sun-tap"
          aria-label="Sun"
          onClick={() => {
            setRainbow(true);
            addSparkle(80, 12, "🌈", "rainbow");
            props.voice.speak("A rainbow!", "¡Un arcoíris!");
            setTimeout(() => setRainbow(false), 2000);
          }}
        >
          ☀️
        </button>
        <button
          type="button"
          className="cloud-tap"
          aria-label="Cloud"
          onClick={() => {
            setRain(true);
            addSparkle(18, 20, "🌧️", "rain");
            props.voice.speak("Soft rain!", "¡Llovizna suave!");
            setTimeout(() => setRain(false), 1800);
          }}
        >
          ☁️
        </button>
        {["f1", "f2", "f3"].map((f, i) => (
          <button
            key={f}
            type="button"
            className={`flower-tap ${f}`}
            aria-label="Flower"
            onClick={(e) => {
              const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              addSparkle(((i + 1) * 28), 70, "✨", `flower-${f}`);
              props.voice.speak("Sparkles!", "¡Brillos!");
              void rect;
            }}
          >
            🌸
          </button>
        ))}
        {rainbow && <div className="garden-sparkle" style={{ left: "40%", top: "10%" }}>🌈</div>}
        {positions.map((p) => {
          const a = GARDEN_ANIMALS.find((x) => x.id === p.id)!;
          return (
            <button
              key={p.id}
              type="button"
              className="roaming-friend"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("friend", p.id)}
              onDragEnd={(e) => {
                const host = e.currentTarget.parentElement;
                if (!host) return;
                const rect = host.getBoundingClientRect();
                const left = Math.min(78, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100));
                const top = Math.min(70, Math.max(18, ((e.clientY - rect.top) / rect.height) * 100));
                setPositions((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, left, top } : x)),
                );
                setPoses((po) => ({ ...po, [p.id]: "move" }));
                setTimeout(() => setPoses((po) => ({ ...po, [p.id]: "idle" })), 800);
              }}
              onClick={() => speakFriend(p.id)}
              aria-label={`${a.en}, ${a.es}`}
            >
              <GardenAnimal id={p.id} pose={poses[p.id] || "idle"} size={92} />
            </button>
          );
        })}
        {sparkles.map((s) => (
          <span key={s.id} className="garden-sparkle" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            {s.text}
          </span>
        ))}
      </div>

      <section className="food-tray" aria-label="Snacks">
        {friends.slice(0, 4).map((a) => (
          <button
            key={a.id}
            type="button"
            className="food-token"
            onClick={() => {
              setFeedId(a.id);
              setPoses((p) => ({ ...p, [a.id]: "eat" }));
              props.audio.ensure();
              props.audio.correct();
              props.voice.speak(
                `Yum! ${a.food.en}.`,
                `¡Ñam! ${a.food.es}.`,
              );
              setTimeout(() => setPoses((p) => ({ ...p, [a.id]: "idle" })), 1200);
            }}
            aria-label={`Feed ${a.en}`}
          >
            <span className="food-art">{FOOD_EMOJI[a.food.kind]}</span>
            <strong>{a.food.en}</strong>
            <small>{a.food.es}</small>
          </button>
        ))}
      </section>
      {feedId && (
        <p className="playarea" style={{ marginTop: 8 }}>
          Feeding time! · ¡Hora de comer!
        </p>
      )}
      <div className="finish-actions" style={{ marginTop: 12 }}>
        <button type="button" className="play secondary" onClick={props.onHome}>
          Home • Inicio
        </button>
      </div>
    </ActivityShell>
  );
}
