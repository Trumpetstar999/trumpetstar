import { Settings2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { KEY_NAMES, SCALE_DISPLAY_NAMES, CONFIDENCE_THRESHOLDS, getScaleNotes } from './constants';
import { StaffRangeSelector } from './StaffRangeSelector';
import type { GameSettings } from '@/hooks/useGameSettings';

// Default comfortable range per key for Bb trumpet (written pitch)
// Keeps the range within the 5-line staff + a few ledger lines
const KEY_DEFAULT_RANGE: Record<string, { minMidi: number; maxMidi: number }> = {
  'C':  { minMidi: 60, maxMidi: 79 }, // C4–G5
  'G':  { minMidi: 62, maxMidi: 79 }, // D4–G5
  'D':  { minMidi: 62, maxMidi: 81 }, // D4–A5
  'A':  { minMidi: 64, maxMidi: 81 }, // E4–A5
  'E':  { minMidi: 64, maxMidi: 83 }, // E4–B5
  'B':  { minMidi: 59, maxMidi: 83 }, // B3–B5
  'F#': { minMidi: 54, maxMidi: 78 }, // F#3–F#5
  'C#': { minMidi: 61, maxMidi: 78 }, // C#4–F#5
  'F':  { minMidi: 60, maxMidi: 77 }, // C4–F5
  'Bb': { minMidi: 58, maxMidi: 77 }, // Bb3–F5
  'Eb': { minMidi: 63, maxMidi: 75 }, // Eb4–Eb5
  'Ab': { minMidi: 56, maxMidi: 80 }, // Ab3–Ab5
  'Db': { minMidi: 61, maxMidi: 78 }, // Db4–F#5
  'Gb': { minMidi: 54, maxMidi: 78 }, // Gb3–F#5
  'Cb': { minMidi: 59, maxMidi: 77 }, // B3–F5
};

interface GameSettingsInlineProps {
  settings: GameSettings;
  onUpdate: (partial: Partial<GameSettings>) => void;
}

// Detect iPad
function isIPad(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function GameSettingsInline({ settings, onUpdate }: GameSettingsInlineProps) {
  const handleMinChange = (midi: number) => {
    onUpdate({ rangeMinMidi: midi, rangeMin: `${midi}` });
  };
  const handleMaxChange = (midi: number) => {
    onUpdate({ rangeMaxMidi: midi, rangeMax: `${midi}` });
  };
  const handleKeyChange = (key: string) => {
    const range = KEY_DEFAULT_RANGE[key] ?? { minMidi: 60, maxMidi: 79 };
    onUpdate({ key, rangeMinMidi: range.minMidi, rangeMin: `${range.minMidi}`, rangeMaxMidi: range.maxMidi, rangeMax: `${range.maxMidi}` });
  };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, hsl(222,60%,16%) 0%, hsl(222,70%,12%) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Settings2 className="w-4 h-4 text-white/40" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Einstellungen</span>
      </div>

      <div className="p-4 space-y-5">
        {/* iPad warning */}
        {isIPad() && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">iPad-Hinweis</p>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                Die Mikrofon-Erkennung funktioniert auf iPads leider noch nicht zuverlässig. Wir arbeiten daran!
              </p>
            </div>
          </div>
        )}

        {/* Row 1: Key + Scale */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Tonart</label>
            <Select value={settings.key} onValueChange={v => onUpdate({ key: v })}>
              <SelectTrigger
                className="h-9 text-sm border-0"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_NAMES.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Skala</label>
            <Select value={settings.scaleType} onValueChange={v => onUpdate({ scaleType: v })}>
              <SelectTrigger
                className="h-9 text-sm border-0"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCALE_DISPLAY_NAMES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Staff Range Selector */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-3">Tonumfang</label>
          <StaffRangeSelector
            minMidi={settings.rangeMinMidi}
            maxMidi={settings.rangeMaxMidi}
            onMinChange={midi => onUpdate({ rangeMinMidi: midi, rangeMin: `${midi}` })}
            onMaxChange={midi => onUpdate({ rangeMaxMidi: midi, rangeMax: `${midi}` })}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Row: Speed + Confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">
              Speed
              <span className="ml-1 text-white/70 font-bold">{settings.startSpeed}</span>
            </label>
            <input
              type="range" min={1} max={10} step={1}
              value={settings.startSpeed}
              onChange={e => onUpdate({ startSpeed: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  rgba(234,179,8,0.7) 0%,
                  rgba(234,179,8,0.7) ${((settings.startSpeed - 1) / 9) * 100}%,
                  rgba(255,255,255,0.1) ${((settings.startSpeed - 1) / 9) * 100}%,
                  rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Genauigkeit</label>
            <Select value={settings.confidenceThreshold} onValueChange={(v: 'low' | 'medium' | 'high') => onUpdate({ confidenceThreshold: v })}>
              <SelectTrigger
                className="h-9 text-sm border-0"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row: Accidentals + Calibration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Vorzeichen</label>
            <Select value={settings.accidentalMode} onValueChange={(v: 'key_signature' | 'note_accidentals') => onUpdate({ accidentalMode: v })}>
              <SelectTrigger
                className="h-9 text-sm border-0"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="key_signature">Generalvorzeichen</SelectItem>
                <SelectItem value="note_accidentals">An der Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">
              Kalibrierung
              <span className="ml-1 text-white/70 font-bold">
                {settings.calibrationCents > 0 ? '+' : ''}{settings.calibrationCents}¢
              </span>
            </label>
            <input
              type="range" min={-50} max={50} step={1}
              value={settings.calibrationCents}
              onChange={e => onUpdate({ calibrationCents: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mt-3"
              style={{
                background: `linear-gradient(to right,
                  rgba(99,179,237,0.5) 0%,
                  rgba(99,179,237,0.5) ${((settings.calibrationCents + 50) / 100) * 100}%,
                  rgba(255,255,255,0.1) ${((settings.calibrationCents + 50) / 100) * 100}%,
                  rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
        </div>

        {/* SFX Toggle */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-xs font-medium text-white/80">Soundeffekte (SFX)</p>
            <p className="text-[10px] text-white/35">Kann die Pitch-Erkennung stören</p>
          </div>
          <Switch
            checked={settings.sfxEnabled}
            onCheckedChange={v => onUpdate({ sfxEnabled: v })}
          />
        </div>
      </div>
    </div>
  );
}
