"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import {
  CelebrationEffect,
  CharacterSprite,
  ChildGameControls,
  SceneBackground,
  SpokenPrompt,
  TouchSafeButton,
} from "../components/game/SceneKit";
import { SoftToast } from "../components/SoftToast";
import { NUMBERS } from "../data/catalog";
import { friendById } from "../data/friends";
import { pickChoices, shuffle } from "../data/collection";
import type { RewardResult } from "../data/collectionTypes";
import type { NumberItem } from "../types/game";
import type { ActivityCommonProps } from "./types";
import { createSpeakOne, cancelSpeechSynthesis } from "../game/AudioDirector";
import { InputGuard } from "../game/InputGuard";
import { SequenceController, runCountSequence } from "../game/SequenceController";

const ROUNDS = 5;
const EN_COUNT = ["One", "Two", "Three", "Four", "Five"];
const ES_COUNT = ["Uno", "Dos", "Tres", "Cuatro", "Cinco"];

/**
 * Milestone-2 Counting Pond — illustrated pond, full-body frogs,
 * protected sequential bilingual count (EN fully, then ES).
 */
export function CountingPondActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(NUMBERS.filter((n) => n.value <= 3)));
  const [choices, setChoices] = useState<NumberItem[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [counting, setCounting] = useState(false);
  const [splash, setSplash] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const seq = useRef(new SequenceController());
  const guard = useRef(new InputGuard({ debounceMs: 450 }));
  const pool = stars < 2 ? NUMBERS.filter((n) => n.value <= 3) : NUMBERS;
  const target = pool[round % pool.length] ?? order[round % order.length];
  const complete = stars >= ROUNDS;
  const mode = props.languageMode ?? "both";

  const speakOne = useCallback(
    createSpeakOne({
      speechOn: props.speechOn,
      speechVolume: 1,
    }),
    [props.speechOn],
  );

  const cancelSeq = useCallback(() => {
    seq.current.cancelAll();
    cancelSpeechSynthesis();
    props.voice.cancel();
    setCounting(false);
    setHighlight(-1);
    guard.current.setLocked(false);
  }, [props.voice]);

  useEffect(() => () => cancelSeq(), [cancelSeq]);

  const askHowMany = useCallback(() => {
    props.voice.speak("How many frogs?", "¿Cuántas ranas?");
  }, [props.voice]);

  const playCountThenAsk = useCallback(async () => {
    cancelSpeechSynthesis();
    props.voice.cancel();
    const handle = seq.current.start();
    setCounting(true);
    guard.current.setLocked(true);
    setBusy(true);
    await runCountSequence({
      count: target.value,
      mode,
      enWords: EN_COUNT,
      esWords: ES_COUNT,
      speakOne,
      onIndex: (i) => {
        if (handle.isActive()) setHighlight(i);
      },
      isActive: handle.isActive,
      pauseMs: 160,
    });
    if (!handle.isActive()) return;
    setHighlight(-1);
    setCounting(false);
    setBusy(false);
    guard.current.setLocked(false);
    askHowMany();
  }, [askHowMany, mode, props.voice, speakOne, target.value]);

  useEffect(() => {
    if (complete) return;
    setChoices(pickChoices(pool, target, 3));
    setHighlight(-1);
    setSplash(false);
    setCelebrate(false);
    guard.current.reset();
    const timer = setTimeout(() => {
      void playCountThenAsk();
    }, 400);
    return () => {
      clearTimeout(timer);
      seq.current.cancelAll();
      cancelSpeechSynthesis();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, complete, stars]);

  const replay = () => {
    cancelSeq();
    void playCountThenAsk();
  };

  const pick = async (n: NumberItem) => {
    if (busy || counting || complete) return;
    if (!guard.current.accept(`pick-${n.id}`)) return;
    props.audio.ensure();
    props.audio.tap();
    if (n.id !== target.id) {
      setWiggleId(n.id);
      props.audio.retry();
      props.voice.speak("Try another one.", "Intenta otra.");
      setTimeout(() => setWiggleId(null), 500);
      return;
    }
    guard.current.setLocked(true);
    setBusy(true);
    setCelebrate(true);
    setSplash(true);
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: `${n.en} frogs! • ¡${n.es} ranas!` });
    props.voice.speak(`${n.en} frogs!`, `¡${n.es} ranas!`);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setSplash(false);
      setCelebrate(false);
      setToast(null);
      setCatchingId(null);
      setStars((s) => s + 1);
      setRound((r) => r + 1);
      guard.current.setLocked(false);
      if (stars + 1 >= ROUNDS) props.onActivityComplete?.("counting");
    }, 1000);
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
      <div className="counting-v4 scene-bg">
        <ChildGameControls onHome={props.onHomeRequest} />
        <ActivityComplete
          titleEn="You counted so well!"
          titleEs="¡Contaste muy bien!"
          stars={stars}
          reward={lastReward}
          onAgain={() => {
            setOrder(shuffle(NUMBERS));
            setStars(0);
            setRound(0);
            props.voice.speak("Let's play again!", "¡Vamos a jugar otra vez!");
          }}
          onHome={props.onHome}
        />
      </div>
    );
  }

  return (
    <div className={`counting-v4 ${splash ? "splash" : ""}`}>
      <ChildGameControls
        onHome={() => {
          cancelSeq();
          props.onHomeRequest();
        }}
        onReplay={replay}
      />

      <div style={{ paddingTop: 88 }}>
        <SpokenPrompt en="How many frogs?" es="¿Cuántas ranas?" onReplay={replay} />
      </div>

      <div className="pond-stage">
        <SceneBackground id="counting-pond" className="embedded">
          <div className="lily-frogs" aria-label={`${target.value} frogs`}>
            {Array.from({ length: target.value }, (_, i) => (
              <div key={i} className={`lily-slot ${highlight === i ? "lit" : ""}`}>
                <div className="frog-wrap">
                  <CharacterSprite
                    id="frog-idle"
                    size={Math.min(120, 64 + (5 - target.value) * 8)}
                    pose={highlight === i ? "celebrate" : "idle"}
                    title={`Frog ${i + 1}`}
                  />
                </div>
                <div className="lily-pad-disk" aria-hidden />
              </div>
            ))}
          </div>
          <CelebrationEffect kind="splash" active={celebrate} />
        </SceneBackground>
      </div>

      <section className="number-lilies" aria-label="Numbers">
        {choices.map((n) => (
          <TouchSafeButton
            key={n.id}
            className={`number-lily ${wiggleId === n.id ? "wiggle" : ""}`}
            aria-label={`${n.en}, ${n.es}`}
            disabled={counting || busy}
            onClick={() => void pick(n)}
          >
            <span className="digit">{n.digit}</span>
            <span className="dots" aria-hidden>
              {Array.from({ length: n.value }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          </TouchSafeButton>
        ))}
      </section>

      <SoftToast show={!!toast} title={toast?.title ?? ""} variant="color" />
    </div>
  );
}
