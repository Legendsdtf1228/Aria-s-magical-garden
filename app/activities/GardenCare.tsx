"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
import { SoftToast } from "../components/SoftToast";
import { shuffle } from "../data/collection";
import { friendById } from "../data/friends";
import type { RewardResult } from "../data/collectionTypes";
import { CARE_TOOL_ART, characterArtId } from "../game/assets";
import type { ActivityCommonProps } from "./types";

const ALL_TOOLS = [
  { id: "water", label: "Water", es: "Agua" },
  { id: "sun", label: "Sunshine", es: "Sol" },
  { id: "grow", label: "Grow", es: "Crecer" },
  { id: "visit", label: "Friends", es: "Amigos" },
] as const;

const STEPS = [
  { id: "water", en: "Water the seeds", es: "Riega las semillas", need: "water" },
  { id: "sun", en: "Give them sunshine", es: "Dales sol", need: "sun" },
  { id: "grow", en: "Help them grow", es: "Ayúdalas a crecer", need: "grow" },
  { id: "visit", en: "Welcome garden friends", es: "Recibe a los amigos", need: "visit" },
] as const;

const TOOL_SLOTS = [
  { x: 0.2, y: 0.86 },
  { x: 0.5, y: 0.88 },
  { x: 0.8, y: 0.86 },
];

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
      <ActivityShell
        activityId="gardenCare"
        stars={stars}
        starsNeeded={STEPS.length}
        collected={props.collected}
        busy
        speechOn={props.speechOn}
        onToggleSpeech={props.onToggleSpeech}
        onOpenSettings={props.onOpenSettings}
        onHomeRequest={props.onHomeRequest}
        onCatchFriend={onCatch}
      >
        <ActivityComplete
          titleEn="Your garden is blooming!"
          titleEs="¡Tu jardín florece!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setStep(0);
            setStars(0);
            setGrown(false);
            setVisitors(false);
            props.voice.speak("Want to play again?", "¿Quieres jugar otra vez?", "playAgain");
          }}
          onHome={props.onHome}
        />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="gardenCare"
      stars={stars}
      starsNeeded={STEPS.length}
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
      <div className="care-beds-scene" data-care-v5="painted">
        <div className="painted-prompt-sign meadow-prompt" role="status">
          <p className="painted-prompt-line">{current.en}</p>
          <p className="painted-prompt-line es">{current.es}</p>
        </div>

        <div className={`care-plot-painted ${grown ? "is-grown" : ""}`} aria-label="Garden plot">
          {visitors ? (
            <div className="care-visitors">
              <CharacterSprite id={characterArtId("butterfly")} size={100} pose="celebrate" title="Butterfly" />
              <CharacterSprite id={characterArtId("bee")} size={100} pose="celebrate" title="Bee" />
            </div>
          ) : grown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="care-plot-img" src={CARE_TOOL_ART.grow} alt="" draggable={false} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="care-plot-img is-seed" src={CARE_TOOL_ART.grow} alt="" draggable={false} />
          )}
        </div>

        <div className="care-tool-row" aria-label="Garden tools">
          {toolChoices.map((t, i) => {
            const slot = TOOL_SLOTS[i] || TOOL_SLOTS[0];
            return (
              <button
                key={t.id}
                type="button"
                className="care-tool-painted"
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                onClick={() => advance(t.id)}
                aria-label={`${t.label}, ${t.es}`}
              >
                <span className="env-choice-shadow" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="care-tool-img" src={CARE_TOOL_ART[t.id]} alt="" draggable={false} />
                <span className="env-choice-label env-choice-label-lg">
                  <strong>{t.label}</strong>
                  <small>{t.es}</small>
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
