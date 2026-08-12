export function aabb(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
}

/**
 * Tighter hit-test for a circular target (UFO).
 * Returns true if a point projectile lies within the disc, or if a small
 * rectangular projectile's nearest point to the circle center is inside r.
 */
export function circleHit(
  cx: number, cy: number, r: number,
  px: number, py: number, pw = 0, ph = 0,
): boolean {
  // Closest point on the projectile rect to circle center
  const nx = Math.max(px - pw / 2, Math.min(cx, px + pw / 2));
  const ny = Math.max(py - ph / 2, Math.min(cy, py + ph / 2));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

