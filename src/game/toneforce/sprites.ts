import playerUrl from "@/assets/player_ship.png";
import playerUrl2 from "@/assets/player_ship_2.png";
import wrongNoteUrl from "@/assets/enemy_wrong_note.png";
import wrongNoteUrl2 from "@/assets/enemy_wrong_note_2.png";
import meteorUrl from "@/assets/enemy_meteor.png";
import alienSpeakerUrl from "@/assets/enemy_alien_speaker.png";
import alienSpeakerUrl2 from "@/assets/enemy_alien_speaker_2.png";
import bossUrl from "@/assets/enemy_boss.png";
import bossUrl2 from "@/assets/enemy_boss_2.png";
import shieldUrl from "@/assets/powerup_shield.png";
import shieldUrl2 from "@/assets/powerup_shield_2.png";
import lifeUrl from "@/assets/powerup_life.png";
import lifeUrl2 from "@/assets/powerup_life_2.png";
import laserUrl from "@/assets/laser.png";
import bgSpaceUrl from "@/assets/bg_space.jpg";
import bgBossUrl from "@/assets/bg_boss.jpg";

function loadImage(src: string): HTMLImageElement {
  const ImageCtor = (globalThis as { Image?: new () => HTMLImageElement }).Image;
  if (typeof ImageCtor !== "function") {
    // SSR: return a stub; real load happens on the client when sprites.ts re-evaluates.
    return {
      complete: false,
      naturalWidth: 0,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as HTMLImageElement;
  }
  const img = new ImageCtor();
  img.src = src;
  return img;
}

export const SPRITES = {
  player: loadImage(playerUrl),
  wrong_note: loadImage(wrongNoteUrl),
  meteor: loadImage(meteorUrl),
  alien_speaker: loadImage(alienSpeakerUrl),
  boss: loadImage(bossUrl),
  shield: loadImage(shieldUrl),
  life: loadImage(lifeUrl),
  laser: loadImage(laserUrl),
  bg_space: loadImage(bgSpaceUrl),
  bg_boss: loadImage(bgBossUrl),
};

// Animation frame sets. Renderer picks frame by time-based index.
export const FRAMES = {
  player: [loadImage(playerUrl)],
  wrong_note: [loadImage(wrongNoteUrl), loadImage(wrongNoteUrl2)],
  meteor: [loadImage(meteorUrl)], // rotated in renderer
  alien_speaker: [loadImage(alienSpeakerUrl), loadImage(alienSpeakerUrl2)],
  boss: [loadImage(bossUrl), loadImage(bossUrl2)],
  shield: [loadImage(shieldUrl), loadImage(shieldUrl2)],
  life: [loadImage(lifeUrl), loadImage(lifeUrl2)],
};

export type FrameKey = keyof typeof FRAMES;

export function pickFrame(key: FrameKey, now: number, fps = 6): HTMLImageElement {
  const arr = FRAMES[key];
  const idx = Math.floor((now / 1000) * fps) % arr.length;
  return arr[idx];
}

export function isReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Per-target-size offscreen-canvas cache for sprites.
 * Pre-scaling huge source PNGs once is dramatically faster in Chrome than
 * letting drawImage downscale a multi-megapixel image every frame.
 */
const SPRITE_CACHE = new Map<string, HTMLCanvasElement>();
const SIZE_BUCKET = 8;

export function getScaledSprite(img: HTMLImageElement, w: number): HTMLCanvasElement | null {
  if (!isReady(img) || typeof document === "undefined") return null;
  const bw = Math.max(SIZE_BUCKET, Math.round(w / SIZE_BUCKET) * SIZE_BUCKET);
  const aspect = img.naturalHeight / img.naturalWidth;
  const bh = Math.max(SIZE_BUCKET, Math.round(bw * aspect));
  const key = `${img.src}|${bw}`;
  let c = SPRITE_CACHE.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = bw;
    c.height = bh;
    const cx = c.getContext("2d");
    if (!cx) return null;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(img, 0, 0, bw, bh);
    SPRITE_CACHE.set(key, c);
  }
  return c;
}

// Named registry of every image used by the game, for preloading + diagnostics.
interface NamedImage { name: string; img: HTMLImageElement; }

function allNamedImages(): NamedImage[] {
  const seen = new Map<HTMLImageElement, string>();
  for (const [key, img] of Object.entries(SPRITES)) {
    if (!seen.has(img)) seen.set(img, key);
  }
  for (const [key, arr] of Object.entries(FRAMES)) {
    arr.forEach((img, i) => {
      if (!seen.has(img)) seen.set(img, `${key}#${i}`);
    });
  }
  return Array.from(seen, ([img, name]) => ({ name, img }));
}

export function totalAssetCount(): number {
  return allNamedImages().length;
}

export function loadedAssetCount(): number {
  return allNamedImages().filter((n) => isReady(n.img)).length;
}

export interface PreloadResult {
  loaded: number;
  total: number;
  failed: string[];
}

/**
 * Awaits every sprite/background image. Resolves with a list of names that
 * failed to load so the UI can show a clear hint while the renderer falls
 * back to vector primitives for missing sprites.
 */
export function preloadAll(
  onProgress?: (loaded: number, total: number, failed: string[]) => void,
): Promise<PreloadResult> {
  const named = allNamedImages();
  const total = named.length;
  const failed: string[] = [];
  let loaded = 0;
  onProgress?.(loaded, total, failed);

  return Promise.all(
    named.map(
      ({ name, img }) =>
        new Promise<void>((resolve) => {
          const finish = (ok: boolean) => {
            if (!ok) failed.push(name);
            loaded += 1;
            onProgress?.(loaded, total, failed);
            resolve();
          };
          if (isReady(img)) {
            finish(true);
          } else if (img.complete && img.naturalWidth === 0) {
            // already errored before listeners attached
            finish(false);
          } else {
            img.addEventListener("load", () => finish(true), { once: true });
            img.addEventListener("error", () => finish(false), { once: true });
          }
        }),
    ),
  ).then(() => ({ loaded, total, failed }));
}

