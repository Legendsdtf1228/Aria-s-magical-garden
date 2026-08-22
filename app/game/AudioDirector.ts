/**
 * Lightweight AudioDirector helpers for sequential speech.
 * Integrates with the existing bilingual voice system without replacing it.
 */

export type SpeakOneFn = (text: string, lang: "en" | "es") => Promise<void>;

/**
 * Create a speakOne that uses Web Speech (or resolves immediately if unavailable).
 * Callers should cancel speechSynthesis before starting a new protected sequence.
 */
export function createSpeakOne(opts: {
  speechOn: boolean;
  speechVolume: number;
  getEnVoice?: () => SpeechSynthesisVoice | null;
  getEsVoice?: () => SpeechSynthesisVoice | null;
  /** Optional: try recorded file first; return true if played */
  tryRecording?: (text: string, lang: "en" | "es") => Promise<boolean>;
}): SpeakOneFn {
  return async (text, lang) => {
    if (!opts.speechOn || !text.trim()) {
      await new Promise((r) => setTimeout(r, 120));
      return;
    }
    if (opts.tryRecording) {
      try {
        const played = await opts.tryRecording(text, lang);
        if (played) return;
      } catch {
        /* fall through to TTS */
      }
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      await new Promise((r) => setTimeout(r, 280));
      return;
    }
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text.trim());
      const voice = lang === "en" ? opts.getEnVoice?.() : opts.getEsVoice?.();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = lang === "es" ? "es-MX" : "en-US";
      }
      u.rate = lang === "es" ? 0.78 : 0.82;
      u.pitch = 1;
      u.volume = Math.min(1, Math.max(0, opts.speechVolume));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
      // Safety timeout so a hung TTS never blocks the sequence forever
      setTimeout(finish, 4000);
    });
  };
}

export function cancelSpeechSynthesis() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
