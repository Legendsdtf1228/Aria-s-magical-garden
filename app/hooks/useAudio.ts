"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioPrefs = {
  musicOn: boolean;
  musicVolume: number;
  speechOn: boolean;
};

/**
 * Gentle original Web Audio cues — no copyrighted melodies.
 * Speech stays louder than music by ducking music while speaking.
 */
export function useAudio(prefs: AudioPrefs, speaking: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const ambienceRef = useRef<{ stop: () => void } | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const ensure = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      const music = ctx.createGain();
      music.gain.value = prefsRef.current.musicOn ? prefsRef.current.musicVolume * 0.35 : 0;
      music.connect(master);
      const sfx = ctx.createGain();
      sfx.gain.value = 0.55;
      sfx.connect(master);
      ctxRef.current = ctx;
      masterRef.current = master;
      musicGainRef.current = music;
      sfxGainRef.current = sfx;
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  useEffect(() => {
    const music = musicGainRef.current;
    const ctx = ctxRef.current;
    if (!music || !ctx) return;
    const target = prefs.musicOn ? prefs.musicVolume * (speaking ? 0.12 : 0.35) : 0;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.12);
  }, [prefs.musicOn, prefs.musicVolume, speaking]);

  const tone = useCallback(
    (
      freqs: number[],
      duration: number,
      type: OscillatorType = "sine",
      gain = 0.12,
      dest: "sfx" | "music" = "sfx",
    ) => {
      const ctx = ensure();
      if (!ctx) return;
      const out = dest === "music" ? musicGainRef.current : sfxGainRef.current;
      if (!out) return;
      if (dest === "music" && !prefsRef.current.musicOn) return;
      const now = ctx.currentTime;
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.02);
        g.gain.exponentialRampToValueAtTime(gain, now + i * 0.02 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(g);
        g.connect(out);
        osc.start(now + i * 0.02);
        osc.stop(now + duration + 0.05);
      });
    },
    [ensure],
  );

  const tap = useCallback(() => tone([660], 0.12, "triangle", 0.06), [tone]);
  const correct = useCallback(
    () => tone([523.25, 659.25, 783.99], 0.45, "sine", 0.1),
    [tone],
  );
  const sparkle = useCallback(
    () => tone([880, 1174.66, 1567.98], 0.5, "triangle", 0.08),
    [tone],
  );
  const retry = useCallback(() => tone([392, 349], 0.28, "sine", 0.05), [tone]);

  const animal = useCallback(
    (kind: string) => {
      const map: Record<string, number[]> = {
        bark: [180, 140],
        meow: [520, 420, 500],
        chirp: [1200, 1500, 1300],
        ribbit: [220, 180, 200],
        moo: [120, 100],
        quack: [380, 300],
        neigh: [440, 520, 400],
        baa: [300, 260],
      };
      tone(map[kind] ?? [400], 0.35, "triangle", 0.08);
    },
    [tone],
  );

  const movementCue = useCallback(
    (cue: string) => {
      const map: Record<string, number[]> = {
        clap: [800, 900],
        stomp: [120, 100],
        spin: [440, 554, 659],
        jump: [392, 523],
        wiggle: [349, 392, 349, 440],
        freeze: [330],
      };
      tone(map[cue] ?? [500], cue === "freeze" ? 0.6 : 0.4, "sine", 0.09, "music");
    },
    [tone],
  );

  const startAmbience = useCallback(() => {
    if (!prefsRef.current.musicOn) return;
    const ctx = ensure();
    if (!ctx || !musicGainRef.current || ambienceRef.current) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 196;
    g.gain.value = 0.015;
    osc.connect(g);
    g.connect(musicGainRef.current);
    osc.start();
    ambienceRef.current = {
      stop: () => {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  }, [ensure]);

  const stopAll = useCallback(() => {
    ambienceRef.current?.stop();
    ambienceRef.current = null;
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    ensure,
    tap,
    correct,
    sparkle,
    retry,
    animal,
    movementCue,
    startAmbience,
    stopAll,
  };
}
