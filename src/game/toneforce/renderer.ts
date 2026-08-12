import { COLORS, GAME_H, GAME_W } from "./constants";
import { SPRITES, FRAMES, pickFrame, isReady, getScaledSprite } from "./sprites";
import type { Enemy, Player, Powerup, Projectile } from "./types";

void FRAMES;

export interface Star { x: number; y: number; r: number; v: number; }

export function makeStars(n = 60): Star[] {
  return Array.from({ length: n }, () => ({
    x: Math.random() * GAME_W,
    y: Math.random() * GAME_H,
    r: Math.random() * 1.4 + 0.3,
    v: Math.random() * 0.6 + 0.2,
  }));
}

let bgOffset = 0;

// Cache pre-rendered, pre-mirrored vertical "pair" tiles per background image.
// Drawing one cached canvas is ~free compared to downscaling a large JPG twice
// per pair every frame with high-quality smoothing.
const BG_CACHE = new Map<HTMLImageElement, { canvas: HTMLCanvasElement; drawH: number; pairH: number }>();

function getBgTile(bg: HTMLImageElement) {
  if (!isReady(bg) || typeof document === "undefined") return null;
  let entry = BG_CACHE.get(bg);
  if (!entry) {
    const drawH = (bg.naturalHeight / bg.naturalWidth) * GAME_W;
    const pairH = drawH * 2;
    const c = document.createElement("canvas");
    c.width = GAME_W;
    c.height = Math.ceil(pairH);
    const cx = c.getContext("2d");
    if (!cx) return null;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(bg, 0, 0, GAME_W, drawH);
    cx.save();
    cx.translate(0, drawH * 2);
    cx.scale(1, -1);
    cx.drawImage(bg, 0, 0, GAME_W, drawH);
    cx.restore();
    entry = { canvas: c, drawH, pairH };
    BG_CACHE.set(bg, entry);
  }
  return entry;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  dt: number,
  bgKey: "bg_space" | "bg_boss" = "bg_space",
) {
  const bg = SPRITES[bgKey];
  const tile = getBgTile(bg);
  if (tile) {
    const { canvas, pairH } = tile;
    bgOffset = (bgOffset + dt * 0.04) % pairH;
    for (let y = -pairH + bgOffset; y < GAME_H; y += pairH) {
      ctx.drawImage(canvas, 0, y);
    }
  } else {
    const grd = ctx.createLinearGradient(0, 0, 0, GAME_H);
    grd.addColorStop(0, COLORS.violetDeep);
    grd.addColorStop(1, "#2a0f5c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
  }


  // Foreground parallax stars
  ctx.fillStyle = COLORS.white;
  for (const s of stars) {
    s.y += s.v * dt * 0.08;
    if (s.y > GAME_H) { s.y = 0; s.x = Math.random() * GAME_W; }
    ctx.globalAlpha = 0.5 + s.r * 0.3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const cached = getScaledSprite(img, w);
  if (cached) {
    ctx.drawImage(cached, x - w / 2, y - h / 2, w, h);
  } else {
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  }
}

function drawThrusters(ctx: CanvasRenderingContext2D, bodyW: number, bodyH: number, now: number) {
  // Two pulsating blue exhaust beams, positioned at the ship's rear nozzles.
  const pulse = 0.94 + Math.sin(now * 0.006) * 0.06;
  const flicker = 0.98 + Math.sin(now * 0.018) * 0.02;
  const baseLen = bodyH * 0.42 * pulse * flicker;
  const baseW = bodyW * 0.06;
  const yTop = bodyH * 0.18;
  const offsets = [-bodyW * 0.16, bodyW * 0.16];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ox of offsets) {
    const len = baseLen;
    // Outer soft glow
    const glow = ctx.createRadialGradient(ox, yTop + len * 0.3, 0, ox, yTop + len * 0.3, baseW * 3.2);
    glow.addColorStop(0, "rgba(120,190,255,0.55)");
    glow.addColorStop(1, "rgba(60,120,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ox, yTop + len * 0.3, baseW * 3.2, 0, Math.PI * 2);
    ctx.fill();
    // Flame body (teardrop gradient)
    const grad = ctx.createLinearGradient(ox, yTop, ox, yTop + len);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.25, "rgba(160,220,255,0.9)");
    grad.addColorStop(0.7, "rgba(60,130,255,0.7)");
    grad.addColorStop(1, "rgba(30,60,200,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ox - baseW, yTop);
    ctx.quadraticCurveTo(ox - baseW * 0.6, yTop + len * 0.6, ox, yTop + len);
    ctx.quadraticCurveTo(ox + baseW * 0.6, yTop + len * 0.6, ox + baseW, yTop);
    ctx.closePath();
    ctx.fill();
    // Bright inner core
    const core = ctx.createLinearGradient(ox, yTop, ox, yTop + len * 0.75);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(1, "rgba(180,230,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(ox - baseW * 0.45, yTop);
    ctx.quadraticCurveTo(ox - baseW * 0.2, yTop + len * 0.45, ox, yTop + len * 0.75);
    ctx.quadraticCurveTo(ox + baseW * 0.2, yTop + len * 0.45, ox + baseW * 0.45, yTop);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}


export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, now: number) {
  const img = pickFrame("player", now, 8);
  const bodyH = p.h * 2.4;
  const bodyW = bodyH * (8 / 9);
  const bob = Math.sin(now * 0.006) * 2;
  const tilt = p.moveDir * 0.18;
  if (isReady(img)) {
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    if (tilt) ctx.rotate(tilt);
    drawThrusters(ctx, bodyW, bodyH, now);
    const psrc = getScaledSprite(img, bodyW) ?? img;
    ctx.drawImage(psrc, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.h / 2);
    ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2);
    ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2);
    ctx.closePath();
    ctx.fill();
  }
  if (p.shieldUntil > now) {
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + Math.sin(now * 0.01) * 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, bodyW * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const fps = e.kind === "boss" ? 3 : 5;
  const img = pickFrame(e.kind, now, fps);
  if (isReady(img)) {
    const scale = e.kind === "boss" ? 1 : e.kind === "wrong_note" ? 1 : 1.4;
    const w = e.w * scale;
    const h = e.h * scale;
    if (e.kind === "meteor") {
      const src = getScaledSprite(img, w) ?? img;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate((now * 0.003) % (Math.PI * 2));
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else if (e.kind === "wrong_note") {
      const src = getScaledSprite(img, w) ?? img;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate((now * 0.004 + e.id) % (Math.PI * 2));
      ctx.drawImage(src, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else if (e.kind === "boss") {
      const ar = img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
      const bw = e.w;
      const bh = e.w * ar;
      const src = getScaledSprite(img, bw) ?? img;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate((now * 0.004 + e.id) % (Math.PI * 2));
      ctx.shadowColor = "rgba(80,255,120,0.55)";
      ctx.shadowBlur = 24;
      ctx.drawImage(src, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    } else {
      const bob = Math.sin((now + e.x) * 0.005) * 2;
      const pulse = 1 + Math.sin((now + e.y) * 0.006) * 0.04;
      drawSprite(ctx, img, e.x, e.y + bob, w * pulse, h * pulse);
    }
  } else {
    ctx.fillStyle = e.kind === "meteor" ? "#a06a3a" : e.kind === "alien_speaker" ? COLORS.gold : e.kind === "boss" ? "#6a1b3a" : COLORS.red;
    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  }
}

export function drawProjectile(ctx: CanvasRenderingContext2D, pr: Projectile, now: number = 0) {
  const pulse = 1 + Math.sin(now * 0.03 + pr.y * 0.08) * 0.25;
  const beamLen = 56;
  const coreW = 4 * pulse;
  const glowW = 18 * pulse;
  const outerW = 30 * pulse;

  // Direction: hostile beams fly downward, player beams upward
  const dir = pr.hostile ? 1 : -1;

  // Color palette per side
  const c = pr.hostile
    ? {
        halo0: "rgba(120,255,140,0.55)", halo1: "rgba(20,200,60,0)",
        mid: "rgba(40,220,80,0.85)",
        inner: "rgba(180,255,180,0.95)",
        trail0: "rgba(120,255,150,0.6)", trail1: "rgba(20,160,40,0)",
        spark1: "rgba(220,255,220,0.85)", spark2: "rgba(40,220,80,0)",
      }
    : {
        halo0: "rgba(255,210,90,0.55)", halo1: "rgba(255,140,0,0)",
        mid: "rgba(255,140,30,0.85)",
        inner: "rgba(255,225,120,0.95)",
        trail0: "rgba(255,180,60,0.6)", trail1: "rgba(255,60,0,0)",
        spark1: "rgba(255,220,120,0.8)", spark2: "rgba(255,120,0,0)",
      };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const halo = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, outerW);
  halo.addColorStop(0, c.halo0);
  halo.addColorStop(1, c.halo1);
  ctx.fillStyle = halo;
  ctx.fillRect(pr.x - outerW, pr.y - beamLen / 2 - outerW, outerW * 2, beamLen + outerW * 2);

  ctx.fillStyle = c.mid;
  ctx.beginPath();
  ctx.ellipse(pr.x, pr.y, glowW / 2, beamLen / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.inner;
  ctx.beginPath();
  ctx.ellipse(pr.x, pr.y, glowW / 3.5, beamLen / 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(pr.x, pr.y, coreW / 2, beamLen / 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leading spark at the front of motion
  const headY = pr.y + dir * (beamLen / 2);
  const spark = ctx.createRadialGradient(pr.x, headY, 0, pr.x, headY, 14 * pulse);
  spark.addColorStop(0, "rgba(255,255,255,1)");
  spark.addColorStop(0.4, c.spark1);
  spark.addColorStop(1, c.spark2);
  ctx.fillStyle = spark;
  ctx.beginPath();
  ctx.arc(pr.x, headY, 14 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Trailing fade behind motion
  const trailStartY = pr.y;
  const trailEndY = pr.y - dir * beamLen;
  const trail = ctx.createLinearGradient(pr.x, trailStartY, pr.x, trailEndY);
  trail.addColorStop(0, c.trail0);
  trail.addColorStop(1, c.trail1);
  ctx.fillStyle = trail;
  const rectY = dir > 0 ? pr.y - beamLen : pr.y;
  ctx.fillRect(pr.x - coreW / 2, rectY, coreW, beamLen);



  ctx.restore();
}

export function drawPowerup(ctx: CanvasRenderingContext2D, p: Powerup, now: number) {
  const img = pickFrame(p.kind === "shield" ? "shield" : "life", now, 4);
  const bob = Math.sin(now * 0.006) * 3;
  const pulse = 1 + Math.sin(now * 0.008) * 0.1;
  if (isReady(img)) {
    drawSprite(ctx, img, p.x, p.y + bob, 32 * pulse, 32 * pulse);
  } else {
    ctx.fillStyle = p.kind === "shield" ? COLORS.blue : COLORS.red;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}
