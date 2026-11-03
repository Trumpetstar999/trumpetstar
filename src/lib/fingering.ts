/** Standard Bb-trumpet fingerings, written pitch, German note names (c' = middle C). */
export interface FingeringNote {
  name: string;
  /** VexFlow key, e.g. "f#/3" */
  key: string;
  sharp: boolean;
  /** Written MIDI number */
  midi: number;
  valves: number[];
}

const RAW: [string, string][] = [
  ['fis', '1-2-3'], ['g', '1-3'], ['gis', '2-3'], ['a', '1-2'], ['ais', '1'], ['h', '2'],
  ["c'", '0'], ["cis'", '1-2-3'], ["d'", '1-3'], ["dis'", '2-3'], ["e'", '1-2'], ["f'", '1'],
  ["fis'", '2'], ["g'", '0'], ["gis'", '2-3'], ["a'", '1-2'], ["ais'", '1'], ["h'", '2'],
  ["c''", '0'], ["cis''", '1-2'], ["d''", '1'], ["dis''", '2'], ["e''", '0'], ["f''", '1'],
  ["fis''", '2'], ["g''", '0'], ["gis''", '2-3'], ["a''", '1-2'], ["ais''", '1'], ["h''", '2'],
  ["c'''", '0'],
];

const STEP: Record<string, [string, number]> = {
  c: ['c', 0], d: ['d', 2], e: ['e', 4], f: ['f', 5], g: ['g', 7], a: ['a', 9], h: ['b', 11],
};

function parse(name: string, fingering: string): FingeringNote {
  const ticks = (name.match(/'/g) || []).length;
  const base = name.replace(/'/g, '');
  const sharp = base.length > 1 && base.endsWith('is');
  const letter = base[0];
  const [vf, semis] = STEP[letter];
  const octave = 3 + ticks;
  return {
    name,
    key: `${vf}${sharp ? '#' : ''}/${octave}`,
    sharp,
    midi: 12 * (octave + 1) + semis + (sharp ? 1 : 0),
    valves: fingering === '0' ? [] : fingering.split('-').map(Number),
  };
}

export const FINGERINGS: FingeringNote[] = RAW.map(([n, f]) => parse(n, f));

/** Bb trumpet sounds a major second below written pitch. */
export function soundingFrequency(writtenMidi: number): number {
  return 440 * Math.pow(2, (writtenMidi - 2 - 69) / 12);
}
