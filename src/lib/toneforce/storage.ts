// Tiny localStorage wrapper, SSR-safe.
const isBrowser = typeof window !== "undefined";

export function load<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}

export function save<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export const KEYS = {
  chord: "tf.chord",
  scores: "tf.scores",
  settings: "tf.settings",
  playerName: "tf.playerName",
} as const;
