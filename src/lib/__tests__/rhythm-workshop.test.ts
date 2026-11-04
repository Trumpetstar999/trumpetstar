// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';

async function workshop() {
  const window = new Window({ url: 'http://localhost/rhythmus-werkstatt/index.html' });
  window.document.body.innerHTML = readFileSync('public/rhythmus-werkstatt/index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const root: Record<string, any> = {
    document: window.document, localStorage: window.localStorage, navigator: window.navigator,
    addEventListener: () => {}, setTimeout, clearTimeout, performance,
    fetch: async () => ({ json: async () => JSON.parse(readFileSync('public/rhythmus-werkstatt/data/toene.json', 'utf8')) }),
  };
  for (const path of ['audio/dsp', 'audio/sampler', 'audio/tracker', 'audio/motor', 'melodie', 'render/glyphen', 'render/noten', 'render/griff', 'werkstatt']) {
    runInNewContext(readFileSync(`public/rhythmus-werkstatt/js/${path}.js`, 'utf8'), root);
  }
  await new Promise(resolve => setTimeout(resolve, 0));
  return root.RhythmusWerkstatt;
}

describe('supplied rhythm workshop rules', () => {
  it('limits a 4/4 rhythm to exactly four complete bars', async () => {
    const w = await workshop();
    w.baukasten.folge = Array(16).fill('viertel');
    expect(w.baukasten._takte().takte.length).toBe(4);
    expect(w.baukasten.passt('viertel')).toBe(false);
  });
  it('rejects whole notes in 3/4 and preserves three-beat capacity', async () => {
    const w = await workshop();
    w.baukasten.taktart = '3/4';
    expect(w.baukasten.passt('ganze')).toBe(false);
    w.baukasten.folge = Array(12).fill('viertel');
    expect(w.baukasten._takte().frei).toBe(0);
    expect(w.baukasten.passt('viertel')).toBe(false);
  });
  it('clamps imported tempo to 40–120 BPM in five-BPM steps', async () => {
    const w = await workshop();
    w.tempoSetzen(0); expect(w.bpm).toBe(40);
    w.tempoSetzen(200); expect(w.bpm).toBe(120);
    w.tempoSetzen(63); expect(w.bpm).toBe(65);
  });
  it('releases every microphone track on exit', async () => {
    const w = await workshop();
    let stopped = 0;
    w.motor.strom = { getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] };
    w.motor.mikrofonStoppen();
    expect(stopped).toBe(2);
    expect(w.motor.mikrofonLaeuft).toBe(false);
  });
});