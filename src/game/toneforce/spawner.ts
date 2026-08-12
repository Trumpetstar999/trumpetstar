import { GAME_W } from "./constants";
import type { Enemy, EnemyKind, LevelDef } from "./types";

let nextId = 1;
export function nextEnemyId() { return nextId++; }

export function spawnEnemy(level: LevelDef): Enemy {
  const r = Math.random();
  let kind: EnemyKind = "wrong_note";
  if (level.id >= 3 && r < 0.45) kind = "meteor";
  else if (level.id >= 4 && r < 0.2) kind = "alien_speaker";
  const w = kind === "meteor" ? 80 : kind === "alien_speaker" ? 92 : 116;
  return {
    id: nextEnemyId(),
    x: 20 + Math.random() * (GAME_W - 40),
    y: -20,
    w, h: w,
    vx: 0,
    vy: level.enemySpeed + Math.random() * 0.6,
    hp: kind === "meteor" ? 2 : 1,
    kind,
    points: kind === "meteor" ? 15 : 10,
  };
}

export function spawnBoss(level: LevelDef): Enemy {
  return {
    id: nextEnemyId(),
    x: GAME_W / 2, y: 130,
    w: 320, h: 320,
    vx: 1.2, vy: 0,
    hp: 25, kind: "boss",
    points: 200,
  };
}
