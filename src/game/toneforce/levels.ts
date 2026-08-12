import type { LevelDef } from "./types";

export const LEVELS: LevelDef[] = [
  { id: 1, name: "First Flight", targetScore: 700, enemySpawnRate: 2600, enemySpeed: 0.8 },
  { id: 2, name: "Return Fire", targetScore: 1200, enemySpawnRate: 2400, enemySpeed: 0.95 },
  { id: 3, name: "Meteor Melody", targetScore: 1700, enemySpawnRate: 2800, enemySpeed: 1.2 },
  { id: 4, name: "Chord Battle", targetScore: 2500, enemySpawnRate: 1800, enemySpeed: 1.4, boss: true },
];
