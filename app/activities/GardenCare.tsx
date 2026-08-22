"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { GardenAnimal } from "../components/GardenAnimal";
import { SoftToast } from "../components/SoftToast";
import { shuffle } from "../data/collection";
import { friendById } from "../data/friends";
import type { RewardResult } from "../data/collectionTypes";
import type { ActivityCommonProps } from "./types";

const ALL_TOOLS = [
  { id: "water", label: "Water", es: "Agua", icon: "💧" },
  { id: "sun", label: "Sunshine", es: "Sol", icon: "☀️" },
  { id: "grow", label: "Grow", es: "Crecer", icon: "🪴" },
  { id: "visit", label: "Friends", es: "Amigos", icon: "🦋" },
] as const;

const STEPS = [
  { id: "water", en: "Water the seeds", es: "Riega las semillas", need: "water" },
  { id: "sun", en: "Give them sunshine", es: "Dales sol", need: "sun" },
  { id: "grow", en: "Help them grow", es: "Ayúdalas a crecer", need: "grow" },
  { id: "visit", en: "Welcome garden friends", es: "Recibe a los amigos", need: "visit" },
] as const;

export function GardenCareActivity(props: ActivityCommonProps) {
  const [step, setStep] = useState(0);
  const [grown, setGrown] = useState(false);
  const [visitors, setVisitors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const [stars, setStars] = useState(0);
  const current = STEPS[step] ?? STEPS[STEPS.length - 1];
  const complete = step >= STEPS.length;

  const toolChoices = useMemo(() => {
    if (complete) return [];
    const correct = ALL_TOOLS.find((t) => t.id === current.need)!;
    const others = shuffle(ALL_TOOLS.filter((t) => t.id !== current.need)).slice(0, 2);
    return shuffle([correct, ...others]);
  }, [current.need, complete, step]);

  const prompt = useCallback(() => {
    props.voice.speak(current.en + ".", current.es + ".");
  }, [props.voice, current]);

  useEffect(() => {
    if (complete) return;
    const t = setTimeout(prompt, 400);
    return () => clearTimeout(t);
  }, [step, complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (tool: string) => {
    if (busy || complete) return;
    props.audio.ensure();
    props.audio.tap();
    if (tool !== current.need) {
      props.audio.retry();
      props.voice.speak("Let's try another one.", "Intentemos otra vez.", "tryAgain");
      return;
    }
    setBusy(true);
    if (tool === "water" || tool === "sun" || tool === "grow") setGrown(true);
    if (tool === "visit") setVisitors(true);
    props.audio.sparkle();
    props.voice.speak("Great job!", "¡Muy bien!", "greatJob");
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: current.en });
    if (reward.kind === "friend") setCatchingId(reward.id);
    setStars((s) => s + 1);
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setStep((s) => s + 1);
      if (step + 1 >= STEPS.length) props.onActivityComplete?.("gardenCare");
    }, 1400);
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
      <ActivityShell activityId="gardenCare" stars={stars} starsNeeded={STEPS.length} collected={props.collected} busy speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch}>
        <ActivityComplete titleEn="Your garden is blooming!" titleEs="¡Tu jardín florece!" stars={stars} reward={lastReward} onAgain={() => { setStep(0); setStars(0); setGrown(false); setVisitors(false); props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain"); }} onHome={props.onHome} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell activityId="gardenCare" stars={stars} starsNeeded={STEPS.length} collected={props.collected} catchingId={catchingId} busy={busy} speechOn={props.speechOn} onToggleSpeech={props.onToggleSpeech} onOpenSettings={props.onOpenSettings} onHomeRequest={props.onHomeRequest} onCatchFriend={onCatch} onRepeat={prompt}>
      <section className="prompt">
        <p>Garden care • Cuidar el jardín</p>
        <button type="button" onClick={prompt} style={{ ["--target" as string]: "#7ec86a" }}>
          <span>{current.en}</span><b>•</b><span>{current.es}</span>
        </button>
      </section>
      <div className={`care-plot ${grown ? "grown" : ""}`} aria-label="Garden plot">
        {visitors ? (
          <div style={{ display: "flex", gap: 8 }}>
            <GardenAnimal id="butterfly" pose="move" size={72} />
            <GardenAnimal id="bee" pose="move" size={72} />
          </div>
        ) : grown ? (
          "🌸🌼🌺"
        ) : (
          "🌱🌱🌱"
        )}
      </div>
      <section className="care-row" aria-label="Garden tools">
        {toolChoices.map((t) => (
          <button
            key={t.id}
            type="button"
            className="care-tool"
            onClick={() => advance(t.id)}
            aria-label={`${t.label}, ${t.es}`}
          >
            {t.icon}
          </button>
        ))}
      </section>
      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="sparkle" />
    </ActivityShell>
  );
}
