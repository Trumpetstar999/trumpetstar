// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import toene from '@/trompete/daten/toene';

function engine() {
  const window = new Window();
  const root: Record<string, any> = { document: window.document, localStorage: window.localStorage };
  for (const file of ['render/glyphen', 'render/noten', 'fortschritt', 'bewertung']) {
    runInNewContext(readFileSync(`src/trompete/engine/${file}.js`, 'utf8'), root);
  }
  return root;
}

describe('beginner feedback exercise rules', () => {
  it('keeps Bb trumpet written C4 at concert Bb3', () => {
    const c = toene.toene.find(t => t.id === 'c1');
    expect(c?.notiertMidi).toBe(60);
    expect(c?.klingendMidi).toBe(58);
  });
  it('preserves the same pitch and valves for F sharp / G flat', () => {
    const sharp = toene.toene.find(t => t.id === 'fis1');
    const flat = toene.toene.find(t => t.id === 'ges1');
    expect(sharp?.klingendMidi).toBe(64);
    expect(flat?.klingendMidi).toBe(64);
    expect(flat?.griff.ventile).toEqual(sharp?.griff.ventile);
  });
  it('applies flats until the barline and cancels them for the natural note', () => {
    const r = engine();
    const tones = Object.fromEntries(toene.toene.map(t => [t.id, t]));
    const notes = ['b1', 'b1', 'h1', 'b1'].map((tonId, i) => ({ tonId, takt: i === 3 ? 1 : 0 }));
    expect(Array.from(r.Noten.vorzeichenBestimmen(notes, tones, 0))).toEqual([-1, 0, 2, -1]);
  });
  it('persists the original browser-local learning state', () => {
    const r = engine();
    const f = new r.Fortschritt({ toene: toene.toene, speicher: r.localStorage });
    f.setzeTempo(75);
    f.setzeHilfe('namen', false);
    const restored = new r.Fortschritt({ toene: toene.toene, speicher: r.localStorage });
    expect(restored.tempo()).toBe(75);
    expect(restored.hilfe('namen')).toBe(false);
    expect(r.localStorage.getItem('trompete-erwachsene.fortschritt.v1')).not.toBeNull();
  });
  it('scores an on-time target note and rejects a wrong played note', () => {
    const r = engine();
    const melody = { noten: [{ tonId: 'c1', schlag: 0, dauer: 1 }] };
    const played = { tonId: 'c1', tStart: 0, tEnde: 1, oktave: 0 };
    expect(r.Bewertung.bewerte(melody, [played], { tempoBpm: 60 }).fehler).toBe(0);
    expect(r.Bewertung.bewerte(melody, [{ ...played, tonId: 'd1' }], { tempoBpm: 60 }).tonFehler).toBe(1);
  });
});