// Autocorrelation pitch detector (ACF2+ variant). Returns Hz or -1.
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.003) return -1; // too quiet (lowered for iOS / soft playing)

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; }

  const trimmed = buf.slice(r1, r2);
  const N = trimmed.length;
  const c = new Float32Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) c[i] = c[i] + trimmed[j] * trimmed[j + i];

  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 <= 0) return -1;
  // Reject weak correlations to avoid false positives at the lower RMS gate
  if (c[0] > 0 && maxval / c[0] < 0.3) return -1;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}
