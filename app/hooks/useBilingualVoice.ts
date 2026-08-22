"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPhrase,
  PRELOAD_PHRASE_IDS,
  recordingUrl,
  type PhraseId,
} from "../data/phraseManifest";
import {
  isNaturalVoice,
  LANG_PAUSE_MS,
  pickBestVoice,
  VOICE_RATES,
} from "../lib/voiceSelect";

export type SpeakPart = {
  text: string;
  lang: "en" | "es";
  phraseKey?: string;
};

type VoicePrefs = {
  speechOn: boolean;
  speechVolume: number;
  enVoiceURI: string | null;
  esVoiceURI: string | null;
  languageMode?: "en" | "es" | "both";
};

export { pickBestVoice, isNaturalVoice, VOICE_RATES, LANG_PAUSE_MS } from "../lib/voiceSelect";

const existsCache = new Map<string, boolean>();
let activeAudio: HTMLAudioElement | null = null;

/** Map older kebab keys to manifest ids */
const KEY_ALIASES: Record<string, PhraseId> = {
  welcome: "welcome",
  "try-again": "tryAgain",
  tryAgain: "tryAgain",
  "great-job": "greatJob",
  greatJob: "greatJob",
  "play-again": "playAgain",
  playAgain: "playAgain",
  "new-friend": "newFriend",
  newFriend: "newFriend",
  "caught-friend": "caughtFriend",
  caughtFriend: "caughtFriend",
  "find-color": "findColor",
  findColor: "findColor",
  "find-animal": "findAnimal",
  findAnimal: "findAnimal",
  "find-shape": "findShape",
  findShape: "findShape",
  "how-many": "howMany",
  howMany: "howMany",
  "feed-friend": "feedFriend",
  feedFriend: "feedFriend",
  movement: "movement",
  previewEnglish: "previewEnglish",
  previewSpanish: "previewSpanish",
};

function resolvePhraseKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  return KEY_ALIASES[raw] ?? raw;
}

function stopActiveAudio() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
  } catch {
    /* ignore */
  }
  activeAudio = null;
}

async function recordingExists(url: string): Promise<boolean> {
  if (existsCache.has(url)) return existsCache.get(url)!;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) {
      existsCache.set(url, true);
      return true;
    }
    // Some hosts reject HEAD — try a ranged GET quietly
    if (res.status === 405 || res.status === 501) {
      const get = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-1" },
      });
      const ok = get.ok || get.status === 206;
      existsCache.set(url, ok);
      return ok;
    }
    existsCache.set(url, false);
    return false;
  } catch {
    existsCache.set(url, false);
    return false;
  }
}

async function tryPlayRecording(url: string | null, volume: number): Promise<boolean> {
  if (!url || typeof Audio === "undefined") return false;
  const exists = await recordingExists(url);
  if (!exists) return false;
  return await new Promise((resolve) => {
    try {
      stopActiveAudio();
      const audio = new Audio(url);
      activeAudio = audio;
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        resolve(true);
      };
      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        existsCache.set(url, false);
        resolve(false);
      };
      void audio.play().catch(() => {
        if (activeAudio === audio) activeAudio = null;
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

export function useBilingualVoice(prefs: VoicePrefs) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [selectedEn, setSelectedEn] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedEs, setSelectedEs] = useState<SpeechSynthesisVoice | null>(null);
  const prefsRef = useRef(prefs);
  const queueRef = useRef<SpeakPart[]>([]);
  const runningRef = useRef(false);
  const cancelledRef = useRef(false);
  const lockedEn = useRef<SpeechSynthesisVoice | null>(null);
  const lockedEs = useRef<SpeechSynthesisVoice | null>(null);
  const preloadedRef = useRef(false);
  prefsRef.current = prefs;

  const refreshVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const list = window.speechSynthesis.getVoices();
    setVoices(list);
    const en = pickBestVoice(list, "en", prefsRef.current.enVoiceURI);
    const es = pickBestVoice(list, "es", prefsRef.current.esVoiceURI);
    lockedEn.current = en;
    lockedEs.current = es;
    setSelectedEn(en);
    setSelectedEs(es);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
      window.speechSynthesis.cancel();
      stopActiveAudio();
    };
  }, [refreshVoices]);

  useEffect(() => {
    refreshVoices();
  }, [prefs.enVoiceURI, prefs.esVoiceURI, refreshVoices]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    queueRef.current = [];
    runningRef.current = false;
    setSpeaking(false);
    stopActiveAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (!prefs.speechOn) cancel();
  }, [prefs.speechOn, cancel]);

  const preloadCommon = useCallback(() => {
    if (preloadedRef.current || typeof Audio === "undefined") return;
    preloadedRef.current = true;
    for (const id of PRELOAD_PHRASE_IDS) {
      for (const lang of ["en", "es"] as const) {
        const url = recordingUrl(id, lang);
        if (!url) continue;
        void recordingExists(url).then((ok) => {
          if (!ok) return;
          const a = new Audio();
          a.preload = "auto";
          a.src = url;
        });
      }
    }
  }, []);

  const speakNext = useCallback(async () => {
    if (runningRef.current) return;
    const part = queueRef.current.shift();
    if (!part) {
      setSpeaking(false);
      return;
    }
    runningRef.current = true;
    setSpeaking(true);
    cancelledRef.current = false;
    const { speechOn, speechVolume } = prefsRef.current;
    if (!speechOn) {
      runningRef.current = false;
      queueRef.current = [];
      setSpeaking(false);
      return;
    }

    const key = resolvePhraseKey(part.phraseKey);
    const url = key ? recordingUrl(key, part.lang) : null;
    const played = await tryPlayRecording(url, speechVolume);
    if (cancelledRef.current) {
      runningRef.current = false;
      setSpeaking(false);
      return;
    }
    if (played) {
      runningRef.current = false;
      setTimeout(() => void speakNext(), LANG_PAUSE_MS);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      runningRef.current = false;
      void speakNext();
      return;
    }

    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(part.text);
      const voice =
        part.lang === "en"
          ? lockedEn.current
          : lockedEs.current;
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = part.lang === "es" ? "es-MX" : "en-US";
      }
      // One language only — never mix EN+ES in a single utterance
      u.rate = part.lang === "es" ? VOICE_RATES.es : VOICE_RATES.en;
      u.pitch = VOICE_RATES.pitch;
      u.volume = Math.min(1, Math.max(0, speechVolume));
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });

    if (cancelledRef.current) {
      runningRef.current = false;
      setSpeaking(false);
      return;
    }
    runningRef.current = false;
    setTimeout(() => void speakNext(), LANG_PAUSE_MS);
  }, []);

  const speak = useCallback(
    (
      en: string,
      es?: string,
      keys?: PhraseId | string | { en?: string; es?: string },
    ) => {
      if (!prefsRef.current.speechOn) return;
      preloadCommon();
      cancel();
      cancelledRef.current = false;
      const phraseKey =
        typeof keys === "string"
          ? keys
          : keys && typeof keys === "object"
            ? keys.en || keys.es
            : undefined;
      const mode = prefsRef.current.languageMode ?? "both";
      const parts: SpeakPart[] = [];
      if (mode !== "es" && en.trim()) {
        parts.push({ text: en.trim(), lang: "en", phraseKey });
      }
      if (mode !== "en" && es?.trim()) {
        parts.push({ text: es.trim(), lang: "es", phraseKey });
      }
      // If parent chose one language but only the other text was provided, still speak that text
      if (!parts.length && en.trim()) parts.push({ text: en.trim(), lang: "en", phraseKey });
      if (!parts.length && es?.trim()) parts.push({ text: es.trim(), lang: "es", phraseKey });
      queueRef.current = parts;
      setTimeout(() => void speakNext(), 30);
    },
    [cancel, speakNext, preloadCommon],
  );

  const speakPhrase = useCallback(
    (phraseKey: PhraseId) => {
      const entry = getPhrase(phraseKey);
      speak(entry.enText, entry.esText, phraseKey);
    },
    [speak],
  );

  const speakParts = useCallback(
    (parts: SpeakPart[]) => {
      if (!prefsRef.current.speechOn) return;
      preloadCommon();
      cancel();
      cancelledRef.current = false;
      queueRef.current = parts.filter((p) => p.text.trim());
      setTimeout(() => void speakNext(), 30);
    },
    [cancel, speakNext, preloadCommon],
  );

  const enVoices = useMemo(
    () =>
      voices
        .filter((v) => v.lang.toLowerCase().startsWith("en"))
        .slice()
        .sort((a, b) => Number(isNaturalVoice(b)) - Number(isNaturalVoice(a))),
    [voices],
  );
  const esVoices = useMemo(
    () =>
      voices
        .filter((v) => v.lang.toLowerCase().startsWith("es"))
        .slice()
        .sort((a, b) => Number(isNaturalVoice(b)) - Number(isNaturalVoice(a))),
    [voices],
  );

  const naturalAvailable =
    isNaturalVoice(selectedEn) ||
    isNaturalVoice(selectedEs) ||
    enVoices.some(isNaturalVoice) ||
    esVoices.some(isNaturalVoice);

  return {
    speak,
    speakPhrase,
    speakParts,
    cancel,
    speaking,
    voices,
    enVoices,
    esVoices,
    selectedEn,
    selectedEs,
    naturalAvailable,
    preloadCommon,
    pickBestVoice,
  };
}
