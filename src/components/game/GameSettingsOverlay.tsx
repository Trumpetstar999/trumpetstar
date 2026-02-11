import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { KEY_NAMES, SCALE_DISPLAY_NAMES, RANGE_PRESETS, noteNameToMidi, midiToNoteName } from './constants';
import type { GameSettings } from '@/hooks/useGameSettings';

interface GameSettingsOverlayProps {
  open: boolean;
  settings: GameSettings;
  onUpdate: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
}

export function GameSettingsOverlay({ open, settings, onUpdate, onClose }: GameSettingsOverlayProps) {
  if (!open) return null;

  const handleRangePreset = (preset: 'easy' | 'normal' | 'hard') => {
    const p = RANGE_PRESETS[preset];
    onUpdate({ rangeMin: p.min, rangeMax: p.max, rangeMinMidi: p.minMidi, rangeMaxMidi: p.maxMidi });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto rounded-2xl bg-[hsl(222,86%,22%)] border border-white/15 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Einstellungen</h2>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Key */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">Tonart</Label>
            <Select value={settings.key} onValueChange={v => onUpdate({ key: v })}>
              <SelectTrigger className="bg-white/10 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_NAMES.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Scale */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">Skala</Label>
            <Select value={settings.scaleType} onValueChange={v => onUpdate({ scaleType: v })}>
              <SelectTrigger className="bg-white/10 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCALE_DISPLAY_NAMES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Range presets */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">
              Tonumfang: {settings.rangeMin} – {settings.rangeMax}
            </Label>
            <div className="flex gap-2 mb-2">
              {(['easy', 'normal', 'hard'] as const).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={settings.rangeMinMidi === RANGE_PRESETS[p].minMidi && settings.rangeMaxMidi === RANGE_PRESETS[p].maxMidi ? 'default' : 'outline'}
                  onClick={() => handleRangePreset(p)}
                  className="flex-1 text-xs capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
            {/* Min slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/50">
                <span>Min: {midiToNoteName(settings.rangeMinMidi)}</span>
                <span>Max: {midiToNoteName(settings.rangeMaxMidi)}</span>
              </div>
              <Slider
                min={54} max={84} step={1}
                value={[settings.rangeMinMidi, settings.rangeMaxMidi]}
                onValueChange={([min, max]) => onUpdate({
                  rangeMinMidi: min, rangeMaxMidi: max,
                  rangeMin: midiToNoteName(min), rangeMax: midiToNoteName(max),
                })}
                className="w-full"
              />
            </div>
          </div>

          {/* Accidental mode */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">Vorzeichen</Label>
            <Select value={settings.accidentalMode} onValueChange={(v: 'key_signature' | 'note_accidentals') => onUpdate({ accidentalMode: v })}>
              <SelectTrigger className="bg-white/10 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="key_signature">Generalvorzeichen</SelectItem>
                <SelectItem value="note_accidentals">Vorzeichen an der Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speed */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">
              Start-Speed: {settings.startSpeed}
            </Label>
            <Slider
              min={1} max={10} step={1}
              value={[settings.startSpeed]}
              onValueChange={([v]) => onUpdate({ startSpeed: v })}
            />
          </div>

          {/* Confidence */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">Confidence Threshold</Label>
            <Select value={settings.confidenceThreshold} onValueChange={(v: 'low' | 'medium' | 'high') => onUpdate({ confidenceThreshold: v })}>
              <SelectTrigger className="bg-white/10 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calibration */}
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider mb-1.5 block">
              Kalibrierung: {settings.calibrationCents > 0 ? '+' : ''}{settings.calibrationCents} cents
            </Label>
            <Slider
              min={-50} max={50} step={1}
              value={[settings.calibrationCents]}
              onValueChange={([v]) => onUpdate({ calibrationCents: v })}
            />
          </div>

          {/* SFX */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80 text-xs">SFX</Label>
              <p className="text-[10px] text-white/40">Kann die Pitch-Erkennung stören</p>
            </div>
            <Switch
              checked={settings.sfxEnabled}
              onCheckedChange={v => onUpdate({ sfxEnabled: v })}
            />
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-5">Fertig</Button>
      </div>
    </div>
  );
}
