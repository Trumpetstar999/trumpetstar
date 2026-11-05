import { SimpleFilter, SoundTouch, getWebAudioNode } from 'soundtouchjs';

export function setDrumTempo(processor: { tempo: number; pitch: number; rate: number }, bpm: number, nativeBpm: number | null) {
  processor.pitch = 1;
  processor.rate = 1;
  processor.tempo = nativeBpm && nativeBpm > 0 && Number.isFinite(bpm) && bpm > 0 ? bpm / nativeBpm : 1;
}

export function loopSource(buffer: Pick<AudioBuffer, 'length' | 'numberOfChannels' | 'getChannelData'>) {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  return {
    extract(target: Float32Array, frames: number, position: number) {
      if (!buffer.length) return 0;
      for (let i = 0; i < frames; i++) {
        const index = (position + i) % buffer.length;
        target[2 * i] = left[index];
        target[2 * i + 1] = right[index];
      }
      return frames;
    },
  };
}

export function createDrumLoop(ctx: AudioContext, buffer: AudioBuffer, bpm: number, nativeBpm: number | null) {
  const processor = new SoundTouch();
  processor.stretch.setParameters(ctx.sampleRate, 0, 0, 8);
  setDrumTempo(processor, bpm, nativeBpm);
  const filter = new SimpleFilter(loopSource(buffer), processor);
  const node = getWebAudioNode(ctx, filter, undefined, 4096);
  return {
    connect: (gain: GainNode) => node.connect(gain),
    updateBpm: (next: number, native: number | null) => setDrumTempo(processor, next, native),
    stop: () => { node.disconnect(); node.onaudioprocess = null; filter.clear(); },
  };
}