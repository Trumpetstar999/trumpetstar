// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { nearestTrumpetSample, TRUMPET_SPRITE_URL, TrumpetSound } from '@/lib/trumpetSound';

function loadMotor(root: Record<string, any>) {
  const source = readFileSync('src/trompete/engine/audio/motor.js', 'utf8').replace(/^import[^\n]+\n/, '');
  runInNewContext(source, { ...root, TRUMPET_SPRITE_URL, setTimeout });
  return root.Motor;
}

describe('original trumpet playback', () => {
  it('loads the shipped same-origin recording', () => {
    expect(TRUMPET_SPRITE_URL).toBe('/trompete/audio/trumpet-sprite.m4a');
    expect(readFileSync(`public${TRUMPET_SPRITE_URL}`).length).toBe(50322);
  });

  it('chooses the nearest real trumpet sample for low and high notes', () => {
    const samples = { c1: { f0: 232.53 }, d1: { f0: 261.54 }, d2: { f0: 522.89 } };
    expect(nearestTrumpetSample(233.08188, samples)).toBe('c1');
    expect(nearestTrumpetSample(261.62556, samples)).toBe('d1');
    expect(nearestTrumpetSample(932.32752, samples)).toBe('d2');
  });

  it('does not mark failed sample loading ready and retries next start', async () => {
    const loaded = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({});
    const root: Record<string, any> = {};
    root.Sampler = class { laden = loaded; };
    // Keep root as globalThis so exported Motor remains accessible.
    root.globalThis = root;
    const Motor = loadMotor(root);
    const motor = new Motor({ toene: [] });
    motor.ctx = { state: 'running' };
    await expect(motor.starten()).rejects.toThrow('network');
    expect(motor.bereit).toBe(false);
    await motor.starten();
    expect(motor.bereit).toBe(true);
    expect(motor.fehler).toBeNull();
    expect(loaded).toHaveBeenCalledTimes(2);
  });

  it('allows the sampler to retry after a failed request', async () => {
    let attempts = 0;
    const root: Record<string, any> = {
      XMLHttpRequest: class {
        status = 503; response = new ArrayBuffer(1); onload = () => {};
        open() {} send() { attempts++; this.status = attempts === 1 ? 503 : 200; this.onload(); }
      },
    };
    root.globalThis = root;
    runInNewContext(readFileSync('src/trompete/engine/audio/sampler.js', 'utf8'), root);
    const buffer = { sampleRate: 44100, numberOfChannels: 0 };
    const sampler = new root.Sampler({ ctx: { decodeAudioData: (_: unknown, done: (b: unknown) => void) => { done(buffer); return Promise.resolve(buffer); } } });
    await expect(sampler.laden()).rejects.toThrow('503');
    await sampler.laden();
    expect(sampler.bereit()).toBe(true);
    expect(attempts).toBe(2);
  });

  it('crossfades only once when decoding invokes both callback and promise', async () => {
    const root: Record<string, any> = { XMLHttpRequest: class { status = 200; onload = () => {}; open() {} send() { this.onload(); } } };
    root.globalThis = root;
    runInNewContext(readFileSync('src/trompete/engine/audio/sampler.js', 'utf8'), root);
    const buffer = {};
    const sampler = new root.Sampler({ ctx: { decodeAudioData: (_: unknown, done: (b: unknown) => void) => { done(buffer); return Promise.resolve(buffer); } } });
    sampler._blenden = vi.fn();
    await sampler.laden();
    expect(sampler._blenden).toHaveBeenCalledTimes(1);
  });

  it('plays the Happybeginners celebration as five trumpet samples', () => {
    const root: Record<string, any> = {}; root.globalThis = root;
    const Motor = loadMotor(root);
    const motor = new Motor({ toene: [] });
    motor.ctx = { currentTime: 10 };
    motor.sampler = { bereit: () => true, ausklang: () => .35 };
    motor.spieleTon = vi.fn();
    expect(motor.spieleLob()).toBeCloseTo(1.79);
    expect(motor.spieleTon.mock.calls.map((c: any[]) => c[0])).toEqual(['g1', 'h1', 'd2', 'c2', 'd2']);
    expect(motor.spieleTon.mock.calls[4][1].wann).toBeCloseTo(10.69);
  });

  it('cancels pending fingering sound after navigation', async () => {
    let finish: () => void = () => {};
    const loaded = new Promise<void>(resolve => { finish = resolve; });
    const played = vi.fn();
    const oldAC = window.AudioContext;
    const root = window as any;
    const oldSampler = root.Sampler;
    root.AudioContext = class { destination = {}; resume = () => Promise.resolve(); close = () => Promise.resolve(); };
    root.Sampler = class { static PROBEN = { c1: { f0: 232.53 } }; laden = () => loaded; spiele = played; };
    try {
      const sound = new TrumpetSound();
      const pending = sound.play(233.08188);
      sound.dispose(); finish(); await pending;
      expect(played).not.toHaveBeenCalled();
    } finally { root.AudioContext = oldAC; root.Sampler = oldSampler; }
  });
});