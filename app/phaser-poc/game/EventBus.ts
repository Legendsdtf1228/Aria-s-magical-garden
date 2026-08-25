/** Lightweight bridge between React shell and Phaser scenes (no Phaser import — SSR-safe). */
type Handler = (...args: unknown[]) => void;

class PocEventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler) {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return this;
  }

  once(event: string, fn: Handler) {
    const wrap: Handler = (...args) => {
      this.off(event, wrap);
      fn(...args);
    };
    return this.on(event, wrap);
  }

  off(event: string, fn?: Handler) {
    if (!fn) {
      this.listeners.delete(event);
      return this;
    }
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  removeListener(event: string, fn: Handler) {
    return this.off(event, fn);
  }

  emit(event: string, ...args: unknown[]) {
    const set = this.listeners.get(event);
    if (!set) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
}

export const EventBus = new PocEventBus();
