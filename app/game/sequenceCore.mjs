/** ESM mirrors for Node tests */
export class SequenceController {
  constructor() {
    this.currentId = 0;
  }
  start() {
    const id = ++this.currentId;
    return {
      id,
      isActive: () => this.currentId === id,
      cancel: () => {
        if (this.currentId === id) this.currentId++;
      },
    };
  }
  cancelAll() {
    this.currentId++;
  }
}

export async function waitMs(ms, isActive) {
  const step = 20;
  let left = ms;
  while (left > 0 && isActive()) {
    await new Promise((r) => setTimeout(r, Math.min(step, left)));
    left -= step;
  }
}

export async function runCountSequence(opts) {
  const {
    count,
    mode,
    enWords,
    esWords,
    speakOne,
    onIndex,
    isActive,
    pauseMs = 40,
  } = opts;

  const runLang = async (lang, words) => {
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

export class InputGuard {
  constructor(opts = {}) {
    this.debounceMs = opts.debounceMs ?? 420;
    this.locked = !!opts.locked;
    this.lastAt = 0;
    this.lastKey = "";
  }
  setLocked(locked) {
    this.locked = locked;
  }
  accept(key = "default") {
    if (this.locked) return false;
    const now = Date.now();
    if (key === this.lastKey && now - this.lastAt < this.debounceMs) return false;
    this.lastKey = key;
    this.lastAt = now;
    return true;
  }
}
