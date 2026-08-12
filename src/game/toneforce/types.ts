export type Action = "left" | "right" | "fire" | "idle";

export interface Player {
  x: number; y: number; w: number; h: number;
  lives: number; shieldUntil: number; fireReadyAt: number;
  moveDir: -1 | 0 | 1; moveUntil: number;
}

export type EnemyKind = "wrong_note" | "meteor" | "alien_speaker" | "boss";

export interface Enemy {
  id: number; x: number; y: number; w: number; h: number;
  vy: number; vx: number; hp: number; kind: EnemyKind; points: number;
  nextFireAt?: number;
  hasFired?: boolean;
  nextSpawnAt?: number;
}

export interface Projectile {
  id: number; x: number; y: number; vy: number; w: number; h: number;
  vx?: number;
  hostile?: boolean;
}

export interface Powerup {
  id: number; x: number; y: number; vy: number; kind: "shield" | "extra_life";
}

export interface LevelDef {
  id: number; name: string; targetScore: number;
  enemySpawnRate: number; enemySpeed: number; boss?: boolean;
}
