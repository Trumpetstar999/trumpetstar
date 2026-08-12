import { useEffect, useState } from "react";
import { KEYS, load, save } from "@/lib/toneforce/storage";

export interface ScoreEntry { score: number; level: number; date: string; name?: string; }

export function useHighscores() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  useEffect(() => { setScores(load(KEYS.scores, [])); }, []);
  const add = (entry: ScoreEntry) => {
    const next = [...load<ScoreEntry[]>(KEYS.scores, []), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    save(KEYS.scores, next);
    setScores(next);
  };
  const clear = () => { save(KEYS.scores, []); setScores([]); };
  return { scores, add, clear };
}

import type { Difficulty } from "@/lib/toneforce/difficulty";
import { DIFFICULTY_KEYS } from "@/lib/toneforce/difficulty";

export interface AppSettings { soundEnabled: boolean; musicEnabled: boolean; difficulty: Difficulty; instrument: "C" | "Bb" | "Eb" | "F"; }
const DEFAULT_SETTINGS: AppSettings = { soundEnabled: true, musicEnabled: true, difficulty: "normal", instrument: "Bb" };

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    const loaded = load(KEYS.settings, DEFAULT_SETTINGS);
    if (!DIFFICULTY_KEYS.includes(loaded.difficulty)) loaded.difficulty = "normal";
    setSettings(loaded);
  }, []);
  const update = (s: Partial<AppSettings>) => {
    const next = { ...settings, ...s };
    setSettings(next);
    save(KEYS.settings, next);
  };
  return { settings, update };
}
