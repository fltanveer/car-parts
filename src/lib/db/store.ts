"use client";

// Client-side stand-in for Supabase. One localStorage document shared by the
// customer app, seller panel and admin panel, so an action in one panel shows
// up in the others (open them in two tabs). Each exported action maps to a
// future server action.
import { useRef, useSyncExternalStore } from "react";
import { buildSeed, type DB } from "./seed";

const KEY = "gaarihub:v2";

let state: DB | null = null;
const serverState: DB = buildSeed();
const listeners = new Set<() => void>();

const load = (): DB => {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DB) : null;
    state = parsed && parsed.v === 2 ? { ...buildSeed(), ...parsed } : buildSeed();
  } catch {
    state = buildSeed();
  }
  return state!;
};

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep in memory */
  }
};

export const getDb = () => load();

/** Apply a partial update. The only write path; actions build on it. */
export const update = (fn: (s: DB) => Partial<DB>) => {
  const cur = load();
  state = { ...cur, ...fn(cur) };
  persist();
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

/**
 * Subscribe to derived data. The result is cached per (state, selector), so
 * selectors may filter/map and return new arrays without render loops.
 */
export function useDb<T>(selector: (s: DB) => T): T {
  const cache = useRef<{ s: DB; f: (s: DB) => T; r: T } | null>(null);
  const read = (s: DB) => {
    const c = cache.current;
    if (c && c.s === s && c.f === selector) return c.r;
    const r = selector(s);
    cache.current = { s, f: selector, r };
    return r;
  };
  return useSyncExternalStore(
    subscribe,
    () => read(load()),
    () => read(serverState),
  );
}

const noop = () => () => {};
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export const resetDemo = () => {
  // Panel-specific overlays (admin edits, ops notes) live under the same prefix.
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("gaarihub:") && k !== KEY).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage blocked */
  }
  state = buildSeed();
  persist();
  // Overlays keep in-memory copies, so reload to start every panel clean.
  window.location.reload();
};
