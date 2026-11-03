/** Rhythm builder model: durations are counted in eighth notes; a 4/4 bar holds 8. */
export type BlockKind = 'whole' | 'half' | 'quarter' | 'eighths' | 'qrest' | 'dotted';

export const BAR_CAPACITY = 8;

export const BLOCKS: Record<BlockKind, { eighths: number; heads: number; parts: { dur: string; eighths: number; rest?: boolean; dot?: boolean }[] }> = {
  whole: { eighths: 8, heads: 1, parts: [{ dur: 'w', eighths: 8 }] },
  half: { eighths: 4, heads: 1, parts: [{ dur: 'h', eighths: 4 }] },
  quarter: { eighths: 2, heads: 1, parts: [{ dur: 'q', eighths: 2 }] },
  eighths: { eighths: 2, heads: 2, parts: [{ dur: '8', eighths: 1 }, { dur: '8', eighths: 1 }] },
  qrest: { eighths: 2, heads: 0, parts: [{ dur: 'qr', eighths: 2, rest: true }] },
  dotted: { eighths: 4, heads: 2, parts: [{ dur: 'qd', eighths: 3, dot: true }, { dur: '8', eighths: 1 }] },
};
export const BLOCK_ORDER: BlockKind[] = ['whole', 'half', 'quarter', 'eighths', 'qrest', 'dotted'];

/** Notated (B♭ trumpet) scale C–D–E–F–G–A–H–C'. */
export const SCALE = [
  { name: 'C', key: 'c/4', midi: 60 }, { name: 'D', key: 'd/4', midi: 62 }, { name: 'E', key: 'e/4', midi: 64 },
  { name: 'F', key: 'f/4', midi: 65 }, { name: 'G', key: 'g/4', midi: 67 }, { name: 'A', key: 'a/4', midi: 69 },
  { name: 'H', key: 'b/4', midi: 71 }, { name: "C'", key: 'c/5', midi: 72 },
];
export const DEFAULT_PITCH = 4;

export interface Block { kind: BlockKind; pitches: number[] }
export type Bars = Block[][];

export const barFill = (bar: Block[]) => bar.reduce((s, b) => s + BLOCKS[b.kind].eighths, 0);
export const canPlace = (bar: Block[], kind: BlockKind) => barFill(bar) + BLOCKS[kind].eighths <= BAR_CAPACITY;
export const newBlock = (kind: BlockKind): Block => ({ kind, pitches: Array(BLOCKS[kind].heads).fill(DEFAULT_PITCH) });

export function emptyBars(count: 2 | 4): Bars { return Array.from({ length: count }, () => []); }

/** Resize keeping existing content in the first bars. */
export function resizeBars(bars: Bars, count: 2 | 4): Bars {
  return Array.from({ length: count }, (_, i) => bars[i] ?? []);
}

/** Place into the preferred bar if it fits, else the first bar with room; returns null when no bar fits. */
export function placeBlock(bars: Bars, kind: BlockKind, preferred?: number): Bars | null {
  const order = preferred !== undefined ? [preferred, ...bars.keys()] : [...bars.keys()];
  const target = order.find((i) => bars[i] && canPlace(bars[i], kind));
  if (target === undefined) return null;
  return bars.map((b, i) => (i === target ? [...b, newBlock(kind)] : b));
}

export function setPitch(bars: Bars, bar: number, block: number, head: number, pitch: number): Bars {
  if (pitch < 0 || pitch >= SCALE.length) return bars;
  return bars.map((b, i) => i !== bar ? b : b.map((bl, j) => j !== block || head >= bl.pitches.length ? bl
    : { ...bl, pitches: bl.pitches.map((p, h) => (h === head ? pitch : p)) }));
}

export function removeBlock(bars: Bars, bar: number, block: number): Bars {
  return bars.map((b, i) => (i === bar ? b.filter((_, j) => j !== block) : b));
}

/** Sounding pitch of a B♭ trumpet is a major second below the notated pitch. */
export const soundingHz = (pitch: number) => 440 * Math.pow(2, (SCALE[pitch].midi - 2 - 69) / 12);

/** Flatten to timed events (start/length in eighths) for playback. */
export function events(bars: Bars) {
  const out: { start: number; len: number; pitch: number | null }[] = [];
  bars.forEach((bar, bi) => {
    let pos = bi * BAR_CAPACITY;
    bar.forEach((bl) => {
      let head = 0;
      BLOCKS[bl.kind].parts.forEach((p) => {
        out.push({ start: pos, len: p.eighths, pitch: p.rest ? null : bl.pitches[head++] });
        pos += p.eighths;
      });
    });
  });
  return out;
}
