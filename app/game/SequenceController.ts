/**
 * SequenceController — protects multi-step audio/visual sequences (e.g. counting).
 * Stale completions from cancelled sequences are ignored.
 */

export type SequenceHandle = {
  id: number;
  isActive: () => boolean;
  cancel: () => void;
};

export class SequenceController {
  private currentId = 0;

  start(): SequenceHandle {
    const id = ++this.currentId;
    return {
      id,
      isActive: () => this.currentId === id,
      cancel: () => {
        if (this.currentId === id) this.currentId++;
      },
    };
  }

  /** Cancel whatever is running (Home, unmount, language change). */
  cancelAll() {
    this.currentId++;
  }

  get activeId() {
    return this.currentId;
  }
}

export async function waitMs(ms: number, isActive: () => boolean) {
  if (ms <= 0) return;
  const step = 50;
  let left = ms;
  while (left > 0 && isActive()) {
    await new Promise((r) => setTimeout(r, Math.min(step, left)));
    left -= step;
  }
}

/**
 * Speak numbers 1..n as a protected sequence.
 * English completes fully before Spanish when mode is "both".
 */
export async function runCountSequence(opts: {
  count: number;
  mode: "en" | "es" | "both";
  enWords: string[];
  esWords: string[];
  speakOne: (text: string, lang: "en" | "es") => Promise<void>;
  onIndex: (index: number) => void;
  isActive: () => boolean;
  pauseMs?: number;
}) {
  const { count, mode, enWords, esWords, speakOne, onIndex, isActive, pauseMs = 180 } = opts;
  const runLang = async (lang: "en" | "es", words: string[]) => {
    for (let i = 0; i < count; i++) {
      if (!isActive()) return;
      onIndex(i);
      await speakOne(words[i], lang);
      if (!isActive()) return;
      await waitMs(pauseMs, isActive);
    }
  };

  if (mode === "en" || mode === "both") await runLang("en", enWords);
  if (!isActive()) return;
  if (mode === "es" || mode === "both") await runLang("es", esWords);
  if (isActive()) onIndex(-1);
}
