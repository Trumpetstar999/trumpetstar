import '@/trompete/engine/audio/sampler.js';

// Use the already shipped original recording, not an asset route that may
// return the SPA document in standalone/PWA environments.
export const TRUMPET_SPRITE_URL = '/trompete/audio/trumpet-sprite.m4a';

interface SamplePlayer {
  laden(): Promise<unknown>;
  spiele(name: string, options: { frequenzHz: number; dauer: number; ziel: AudioNode }): AudioBufferSourceNode | null;
}
interface SampleConstructor {
  new(options: { ctx: AudioContext; url: string }): SamplePlayer;
  PROBEN: Record<string, { f0: number }>;
}

export function nearestTrumpetSample(frequency: number, samples: Record<string, { f0: number }>) {
  return Object.keys(samples).reduce((best, name) =>
    Math.abs(Math.log2(frequency / samples[name].f0)) < Math.abs(Math.log2(frequency / samples[best].f0)) ? name : best,
  Object.keys(samples)[0]);
}

export class TrumpetSound {
  private context: AudioContext | null = null;
  private sampler: SamplePlayer | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private revision = 0;

  async play(frequency: number) {
    const revision = ++this.revision;
    const root = window as unknown as { webkitAudioContext?: typeof AudioContext; Sampler: SampleConstructor };
    const AC = window.AudioContext || root.webkitAudioContext;
    if (!AC) throw new Error('Audio unavailable');
    this.context ??= new AC();
    // Resume synchronously from the tap, before waiting for network/decode.
    const resumed = this.context.resume();
    this.sampler ??= new root.Sampler({ ctx: this.context, url: TRUMPET_SPRITE_URL });
    await Promise.all([resumed, this.sampler.laden()]);
    if (revision !== this.revision) return;
    this.stopSources();
    const source = this.sampler.spiele(nearestTrumpetSample(frequency, root.Sampler.PROBEN), {
      frequenzHz: frequency, dauer: 1.25, ziel: this.context.destination,
    });
    if (source) {
      this.sources.add(source);
      source.onended = () => this.sources.delete(source);
    }
  }

  private stopSources() {
    for (const source of this.sources) { try { source.stop(); source.disconnect(); } catch { /* ended */ } }
    this.sources.clear();
  }

  dispose() {
    ++this.revision;
    this.stopSources();
    void this.context?.close();
    this.context = null;
    this.sampler = null;
  }
}