/**
 * Toddler InputGuard — ignore accidental multi-touch / rapid retriggers.
 */

export type InputGuardOptions = {
  /** Minimum ms between accepted taps on the same target */
  debounceMs?: number;
  /** When true, all choice inputs are ignored */
  locked?: boolean;
};

export class InputGuard {
  private lastAt = 0;
  private lastKey = "";
  private locked = false;
  private debounceMs: number;

  constructor(opts: InputGuardOptions = {}) {
    this.debounceMs = opts.debounceMs ?? 420;
    this.locked = !!opts.locked;
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  isLocked() {
    return this.locked;
  }

  /** Returns true if this interaction should proceed. */
  accept(key = "default", pointerType?: string) {
    if (this.locked) return false;
    // Prefer primary pointer; ignore secondary touches while active
    if (pointerType === "touch" && this.locked) return false;
    const now = Date.now();
    if (key === this.lastKey && now - this.lastAt < this.debounceMs) return false;
    this.lastKey = key;
    this.lastAt = now;
    return true;
  }

  reset() {
    this.lastAt = 0;
    this.lastKey = "";
  }
}

/** Prevent native drag / context menu on game art. */
export function hardenGamePointer(el: HTMLElement | null) {
  if (!el) return () => {};
  const prevent = (e: Event) => e.preventDefault();
  el.addEventListener("contextmenu", prevent);
  el.addEventListener("dragstart", prevent);
  return () => {
    el.removeEventListener("contextmenu", prevent);
    el.removeEventListener("dragstart", prevent);
  };
}
