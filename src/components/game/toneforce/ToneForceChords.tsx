import { useMemo } from 'react';
import { useChordSettings } from '@/hooks/toneforce/useChordSettings';
import { useTfT } from '@/i18n/toneforce';

type Quality = 'dur' | 'moll';

const ROOTS: { value: string; label: string; pc: number }[] = [
  { value: 'C', label: 'C', pc: 0 },
  { value: 'C#', label: 'C# / Des', pc: 1 },
  { value: 'D', label: 'D', pc: 2 },
  { value: 'Eb', label: 'Es / D#', pc: 3 },
  { value: 'E', label: 'E', pc: 4 },
  { value: 'F', label: 'F', pc: 5 },
  { value: 'F#', label: 'F# / Ges', pc: 6 },
  { value: 'G', label: 'G', pc: 7 },
  { value: 'Ab', label: 'As / G#', pc: 8 },
  { value: 'A', label: 'A', pc: 9 },
  { value: 'Bb', label: 'B (Bb)', pc: 10 },
  { value: 'H', label: 'H', pc: 11 },
];

const ALL_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'H'];

function spell(pc: number, prefer: 'sharp' | 'flat'): string {
  const sharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'];
  const flat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'B', 'H'];
  return (prefer === 'flat' ? flat : sharp)[((pc % 12) + 12) % 12];
}

function buildTriad(root: string, quality: Quality): [string, string, string] {
  const meta = ROOTS.find((r) => r.value === root) ?? ROOTS[0];
  const prefer: 'sharp' | 'flat' = ['Eb', 'Ab', 'Bb'].includes(root) ? 'flat' : 'sharp';
  const third = quality === 'dur' ? 4 : 3;
  return [spell(meta.pc, prefer), spell(meta.pc + third, prefer), spell(meta.pc + 7, prefer)];
}

export function ToneForceChords() {
  const t = useTfT();
  const { chord, update } = useChordSettings();

  const { quality, root } = useMemo(() => {
    const toPc = (n: string) => {
      const map: Record<string, number> = {
        C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
        G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, H: 11,
      };
      return map[n] ?? 0;
    };
    const rPc = toPc(chord.left);
    const tPc = toPc(chord.fire);
    const interval = (((tPc - rPc) % 12) + 12) % 12;
    const matchedRoot = ROOTS.find((r) => r.pc === rPc)?.value ?? 'C';
    return { quality: (interval === 3 ? 'moll' : 'dur') as Quality, root: matchedRoot };
  }, [chord]);

  const applyPreset = (r: string, q: Quality) => {
    const [left, fire, right] = buildTriad(r, q);
    update({ left, fire, right, presetId: `${r}-${q}` });
  };

  const setNote = (slot: 'left' | 'fire' | 'right', v: string) =>
    update({ ...chord, [slot]: v, presetId: 'custom' });

  return (
    <div className="max-w-md mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">{t('chords.title')}</h2>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
        <div className="text-sm text-white/70 mb-3">{t('chords.preset')}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1 uppercase tracking-wider">
              {t('chords.quality')}
            </label>
            <select
              value={quality}
              onChange={(e) => applyPreset(root, e.target.value as Quality)}
              className="w-full rounded-lg bg-[#1a0b3d] border border-white/20 px-3 py-2 text-base font-semibold"
            >
              <option value="dur">{t('chords.major')}</option>
              <option value="moll">{t('chords.minor')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1 uppercase tracking-wider">
              {t('chords.root')}
            </label>
            <select
              value={root}
              onChange={(e) => applyPreset(e.target.value, quality)}
              className="w-full rounded-lg bg-[#1a0b3d] border border-white/20 px-3 py-2 text-base font-semibold"
            >
              {ROOTS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-white/70 mt-4">
          {t('chords.current')}{' '}
          <b className="text-[#ffcc33]">{chord.left} – {chord.fire} – {chord.right}</b>
        </p>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="text-sm text-white/70 mb-3">{t('chords.custom')}</div>
        <div className="grid grid-cols-3 gap-3">
          {(['left', 'fire', 'right'] as const).map((slot, i) => {
            const labels = [t('chords.left'), t('chords.fire'), t('chords.right')];
            const colors = ['text-[#1e6bff]', 'text-[#ff8a1f]', 'text-[#ff3b4d]'];
            return (
              <div key={slot}>
                <div className={`text-xs font-bold mb-1 ${colors[i]}`}>{labels[i]}</div>
                <select
                  value={chord[slot]}
                  onChange={(e) => setNote(slot, e.target.value)}
                  className="w-full rounded-lg bg-[#1a0b3d] border border-white/20 px-2 py-2 text-lg font-bold text-center"
                >
                  {ALL_NOTES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-white/50 mt-3">
          {t('chords.assignment', { left: chord.left, fire: chord.fire, right: chord.right })}
        </p>
      </div>
    </div>
  );
}
