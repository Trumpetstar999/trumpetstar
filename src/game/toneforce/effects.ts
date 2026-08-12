export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;     // remaining ms
  maxLife: number;  // total ms
  size: number;
  hue: number;      // 0..360
  kind: "spark" | "ring" | "smoke";
  rot?: number;
}

export const particlesRef: { current: Particle[] } = { current: [] };

export function spawnExplosion(x: number, y: number, radius: number) {
  const arr = particlesRef.current;
  // shockwave ring
  arr.push({
    x, y, vx: 0, vy: 0,
    life: 420, maxLife: 420,
    size: radius * 0.4,
    hue: 50, kind: "ring",
  });
  // bright core flash
  arr.push({
    x, y, vx: 0, vy: 0,
    life: 180, maxLife: 180,
    size: radius * 0.9,
    hue: 45, kind: "ring",
  });
  // sparks
  const sparkCount = 22;
  for (let i = 0; i < sparkCount; i++) {
    const ang = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.4;
    const speed = 2 + Math.random() * 3.5;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 500 + Math.random() * 350,
      maxLife: 850,
      size: 2 + Math.random() * 2.5,
      hue: 30 + Math.random() * 40, // orange-yellow
      kind: "spark",
    });
  }
  // green debris (UFO-themed)
  for (let i = 0; i < 8; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.2;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 0.5,
      life: 600 + Math.random() * 300,
      maxLife: 900,
      size: 2.5 + Math.random() * 2,
      hue: 110 + Math.random() * 30,
      kind: "spark",
    });
  }
  // smoke puffs
  for (let i = 0; i < 6; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 0.8;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 0.4,
      life: 700 + Math.random() * 300,
      maxLife: 1000,
      size: 8 + Math.random() * 6,
      hue: 0, kind: "smoke",
    });
  }
}

export function spawnPlayerHit(x: number, y: number, radius: number) {
  const arr = particlesRef.current;
  // Bright white core flash
  arr.push({ x, y, vx: 0, vy: 0, life: 200, maxLife: 200, size: radius * 0.9, hue: 200, kind: "ring" });
  // Expanding cyan shockwave
  arr.push({ x, y, vx: 0, vy: 0, life: 520, maxLife: 520, size: radius * 0.5, hue: 200, kind: "ring" });
  // Secondary slower ring
  arr.push({ x, y, vx: 0, vy: 0, life: 700, maxLife: 700, size: radius * 0.35, hue: 220, kind: "ring" });
  // Blue/white energy sparks bursting outward
  const sparkCount = 26;
  for (let i = 0; i < sparkCount; i++) {
    const ang = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.5;
    const speed = 2.5 + Math.random() * 3.5;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 450 + Math.random() * 350,
      maxLife: 800,
      size: 2 + Math.random() * 2.2,
      hue: 195 + Math.random() * 35,
      kind: "spark",
    });
  }
  // Hot white inner sparks
  for (let i = 0; i < 10; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 300 + Math.random() * 200,
      maxLife: 500,
      size: 2 + Math.random() * 1.5,
      hue: 50,
      kind: "spark",
    });
  }
  // Smoke puffs
  for (let i = 0; i < 5; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.7;
    arr.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 0.3,
      life: 600 + Math.random() * 300,
      maxLife: 900,
      size: 7 + Math.random() * 5,
      hue: 0, kind: "smoke",
    });
  }
}

export function updateParticles(dt: number) {
  const arr = particlesRef.current;
  for (const p of arr) {
    p.x += p.vx * (dt / 16);
    p.y += p.vy * (dt / 16);
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + (p.kind === "smoke" ? -0.02 : 0.05);
    p.life -= dt;
  }
  particlesRef.current = arr.filter((p) => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
  ctx.save();
  for (const p of particlesRef.current) {
    const t = Math.max(0, p.life / p.maxLife); // 1 -> 0
    if (p.kind === "ring") {
      const grow = 1 + (1 - t) * 2.4;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = t * 0.9;
      ctx.lineWidth = 3 * t + 0.5;
      ctx.strokeStyle = `hsl(${p.hue}, 100%, 65%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "spark") {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = t;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 80%, 1)`);
      grad.addColorStop(0.4, `hsla(${p.hue}, 100%, 55%, 0.8)`);
      grad.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // smoke
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = t * 0.35;
      const grow = 1 + (1 - t) * 1.8;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * grow);
      grad.addColorStop(0, "rgba(120,120,130,0.7)");
      grad.addColorStop(1, "rgba(40,40,50,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}
