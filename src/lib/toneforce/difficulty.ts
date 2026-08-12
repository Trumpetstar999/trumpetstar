export type Difficulty = "super_easy" | "easy" | "normal" | "hard";

export interface DifficultyProfile {
  centTolerance: number;
  stabilityRequired: number;
  actionDebounceMs: number;
  sustainedStability: number;
}

const PROFILES: Record<Difficulty, DifficultyProfile> = {
  super_easy: { centTolerance: 80, stabilityRequired: 0.3, actionDebounceMs: 180, sustainedStability: 0.25 },
  easy:       { centTolerance: 50, stabilityRequired: 0.45, actionDebounceMs: 220, sustainedStability: 0.35 },
  normal:     { centTolerance: 30, stabilityRequired: 0.6, actionDebounceMs: 250, sustainedStability: 0.5 },
  hard:       { centTolerance: 15, stabilityRequired: 0.8, actionDebounceMs: 300, sustainedStability: 0.65 },
};

export const DIFFICULTY_KEYS: Difficulty[] = ["super_easy", "easy", "normal", "hard"];

export function getDifficultyProfile(d: Difficulty | string | undefined): DifficultyProfile {
  if (d && d in PROFILES) return PROFILES[d as Difficulty];
  return PROFILES.normal;
}
