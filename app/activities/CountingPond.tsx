"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityComplete } from "../components/ActivityComplete";
import { ActivityShell } from "../components/ActivityShell";
import { CharacterSprite } from "../components/game/SceneKit";
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

/** Frog lily pads in scene — feet anchors (normalized). */
const FROG_PADS = [
  { x: 0.22, y: 0.58 },
  { x: 0.38, y: 0.52 },
  { x: 0.54, y: 0.56 },
  { x: 0.68, y: 0.5 },
  { x: 0.82, y: 0.54 },
];

/** Shore launch points near pond edge. */
const EDGE_LAUNCH = [
  { x: 0.08, y: 0.72 },
  { x: 0.12, y: 0.68 },
  { x: 0.9, y: 0.7 },
  { x: 0.88, y: 0.74 },
  { x: 0.06, y: 0.66 },
];

type FrogVisual = {
  /** Fully landed on pad (stays visible). */
  landed: boolean;
  /** Currently hopping. */
  hopping: boolean;
  /** Ripple after land. */
  ripple: boolean;
  /** Celebrate on correct answer. */
  celebrate: boolean;
  x: number;
  y: number;
  lift: number;
};

function emptyFrogs(n: number): FrogVisual[] {
  return Array.from({ length: n }, (_, i) => ({
    landed: false,
    hopping: false,
    ripple: false,
    celebrate: false,
    x: EDGE_LAUNCH[i % EDGE_LAUNCH.length].x,
    y: EDGE_LAUNCH[i % EDGE_LAUNCH.length].y,
    lift: 0,
  }));
}

function readReviewFrogs(): number {
  if (typeof window === "undefined") return 0;
  return Number(new URLSearchParams(window.location.search).get("frogs") || 0);
}

/**
 * Full-bleed Counting Pond.
 * Speech order preserved via runCountSequence (EN then ES).
 * Visual: each frog hops shore → pad, lands, ripple, THEN number speaks.
 */
export function CountingPondActivity(props: ActivityCommonProps) {
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [order, setOrder] = useState(() => shuffle(NUMBERS.filter((n) => n.value <= 3)));
  const [choices, setChoices] = useState<NumberItem[]>([]);
  const [frogs, setFrogs] = useState<FrogVisual[]>([]);
  const [glowPad, setGlowPad] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [counting, setCounting] = useState(false);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string } | null>(null);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<RewardResult | null>(null);
  const seq = useRef(new SequenceController());
  const guard = useRef(new InputGuard({ debounceMs: 450 }));
  const animGate = useRef<Promise<void>>(Promise.resolve());
  const hoppedRef = useRef<Set<number>>(new Set());
  const [reviewForce, setReviewForce] = useState(0);
  const [reviewParamsReady, setReviewParamsReady] = useState(false);
  useEffect(() => {
    setReviewForce(readReviewFrogs());
    setReviewParamsReady(true);
  }, []);
  const pool = stars < 2 ? NUMBERS.filter((n) => n.value <= 3) : NUMBERS;
  /** Review capture: ?frogs=4 forces a four-frog round without changing sequence logic. */
  const forcedTarget =
    reviewForce >= 1 && reviewForce <= 5
      ? NUMBERS.find((n) => n.value === reviewForce) ?? null
      : null;
  const target = forcedTarget ?? pool[round % pool.length] ?? order[round % order.length];
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
    setFrogs((prev) => prev.map((f) => ({ ...f, hopping: false, ripple: false, lift: 0 })));
    guard.current.setLocked(false);
  }, [props.voice]);

  useEffect(() => () => cancelSeq(), [cancelSeq]);

  const hopFrogOntoPad = useCallback(async (index: number, isActive: () => boolean) => {
    const pad = FROG_PADS[index % FROG_PADS.length];
    const edge = EDGE_LAUNCH[index % EDGE_LAUNCH.length];
    const steps = 18;
    const duration = 520;
    const stepMs = duration / steps;

    setFrogs((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        hopping: true,
        landed: false,
        ripple: false,
        x: edge.x,
        y: edge.y,
        lift: 0,
      };
      return next;
    });

    for (let s = 1; s <= steps; s++) {
      if (!isActive()) return;
      const t = s / steps;
      const lift = Math.sin(Math.PI * t) * 0.08;
      const x = edge.x + (pad.x - edge.x) * t;
      const y = edge.y + (pad.y - edge.y) * t;
      setFrogs((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = { ...next[index], x, y, lift, hopping: true };
        return next;
      });
      await new Promise((r) => setTimeout(r, stepMs));
    }

    if (!isActive()) return;
    setFrogs((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        x: pad.x,
        y: pad.y,
        lift: 0,
        hopping: false,
        landed: true,
        ripple: true,
      };
      return next;
    });
    await new Promise((r) => setTimeout(r, 280));
    if (!isActive()) return;
    setFrogs((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ripple: false };
      return next;
    });
  }, []);

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
    setFrogs(emptyFrogs(target.value));
    setGlowPad(null);
    hoppedRef.current = new Set();

    // Track which frog index the upcoming speakOne belongs to (per language pass).
    let passIndex = 0;
    await runCountSequence({
      count: target.value,
      mode,
      enWords: EN_COUNT,
      esWords: ES_COUNT,
      onIndex: (i) => {
        if (!handle.isActive()) return;
        if (i < 0) return;
        passIndex = i;
        // Hop only once per frog (EN pass). ES pass reuses landed frogs.
        if (!hoppedRef.current.has(i)) {
          hoppedRef.current.add(i);
          animGate.current = hopFrogOntoPad(i, handle.isActive);
        } else {
          animGate.current = Promise.resolve();
        }
      },
      speakOne: async (word, lang) => {
        if (!handle.isActive()) return;
        await animGate.current;
        if (!handle.isActive()) return;
        // Keep all frogs 0..passIndex landed visible (do not clear / reuse one frog)
        setFrogs((prev) =>
          prev.map((f, idx) =>
            idx <= passIndex ? { ...f, landed: true, hopping: false } : f,
          ),
        );
        await speakOne(word, lang);
      },
      isActive: handle.isActive,
      pauseMs: 120,
    });

    if (!handle.isActive()) return;
    setCounting(false);
    setBusy(false);
    guard.current.setLocked(false);
    askHowMany();
  }, [askHowMany, hopFrogOntoPad, mode, props.voice, speakOne, target.value]);

  useEffect(() => {
    if (!reviewParamsReady || complete) return;
    setChoices(pickChoices(pool, target, 3));
    setGlowPad(null);
    guard.current.reset();
    const timer = setTimeout(() => {
      void playCountThenAsk();
    }, 400);
    return () => {
      clearTimeout(timer);
      seq.current.cancelAll();
      cancelSpeechSynthesis();
    };
    // Wait for ?frogs= before starting so review capture does not play a 1-frog round first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, complete, stars, reviewForce, reviewParamsReady, target.value]);

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
    setGlowPad(n.id);
    setFrogs((prev) => prev.map((f) => ({ ...f, celebrate: true })));
    const reward = props.onAward();
    setLastReward(reward);
    setToast({ title: `${n.en} frogs! · ¡${n.es} ranas!` });
    props.voice.speak(`${n.en} frogs!`, `¡${n.es} ranas!`);
    if (reward.kind === "friend") {
      setCatchingId(reward.id);
      props.audio.sparkle();
    } else props.audio.correct();
    setTimeout(() => {
      setBusy(false);
      setToast(null);
      setCatchingId(null);
      setGlowPad(null);
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
      <ActivityShell
        activityId="counting"
        stars={stars}
        starsNeeded={ROUNDS}
        collected={props.collected}
        busy
        speechOn={props.speechOn}
        onHomeRequest={props.onHomeRequest}
        onCatchFriend={onCatch}
        onOpenSettings={props.onOpenSettings}
      >
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
      </ActivityShell>
    );
  }

  return (
    <ActivityShell
      activityId="counting"
      stars={stars}
      starsNeeded={ROUNDS}
      collected={props.collected}
      catchingId={catchingId}
      busy={busy}
      speechOn={props.speechOn}
      onHomeRequest={() => {
        cancelSeq();
        props.onHomeRequest();
      }}
      onCatchFriend={onCatch}
      onOpenSettings={props.onOpenSettings}
      onRepeat={replay}
    >
      <div className="counting-pond-bleed" data-counting-v5="full-bleed">
        <div className="painted-prompt-sign counting-prompt-sign" role="status">
          <p className="painted-prompt-line">How many frogs?</p>
          <p className="painted-prompt-line es">¿Cuántas ranas?</p>
        </div>

        <div className="pond-frog-layer" aria-label={`${target.value} frogs`}>
          {frogs.map((f, i) =>
            f.landed || f.hopping ? (
              <div
                key={`frog-${i}`}
                className={`pond-frog ${f.hopping ? "is-hopping" : ""} ${f.landed ? "is-landed" : ""} ${f.celebrate ? "is-celebrate" : ""}`}
                style={{
                  left: `${f.x * 100}%`,
                  top: `${(f.y - f.lift) * 100}%`,
                }}
              >
                <CharacterSprite
                  id="frog-idle"
                  size={Math.round(typeof window !== "undefined" ? Math.min(168, window.innerHeight * 0.2) : 130)}
                  pose={f.celebrate ? "celebrate" : "idle"}
                  title={`Frog ${i + 1}`}
                />
                {f.landed && <span className="frog-contact-shadow" aria-hidden />}
                {f.ripple && <span className="frog-land-ripple" aria-hidden />}
              </div>
            ) : null,
          )}
        </div>

        <section className="pond-answer-pads" aria-label="Numbers">
          {choices.map((n, i) => {
            const slot = [
              { x: 0.28, y: 0.78 },
              { x: 0.5, y: 0.84 },
              { x: 0.72, y: 0.78 },
            ][i] || { x: 0.5, y: 0.82 };
            return (
              <button
                key={n.id}
                type="button"
                className={`pond-answer-pad ${wiggleId === n.id ? "is-wiggle" : ""} ${glowPad === n.id ? "is-glow" : ""}`}
                style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                disabled={counting || busy}
                onClick={() => void pick(n)}
                aria-label={`${n.en}, ${n.es}`}
              >
                <span className="pond-pad-disk" aria-hidden />
                <span className="pond-pad-digit">{n.digit}</span>
              </button>
            );
          })}
        </section>

        <SoftToast show={!!toast} title={toast?.title ?? ""} variant="color" />
      </div>
    </ActivityShell>
  );
}
