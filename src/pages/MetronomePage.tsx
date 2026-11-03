import { useState, useEffect, useCallback, useRef } from 'react';
import { useMetronomeEngine, SoundStyle, Subdivision } from '@/hooks/useMetronomeEngine';
import { useDrumMachineEngine } from '@/hooks/useDrumMachineEngine';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Play, Square, Minus, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { PRACTICE_COPY } from '@/i18n/practice-tools';

type Mode = 'metronome' | 'drummachine';

interface DrumBeat {
  id: string;
  title: string;
  category: string | null;
  native_bpm: number | null;
  file_url: string;
  time_signature_top: number | null;
  time_signature_bottom: number | null;
}

const STORAGE_KEY = 'trumpetstar_metronome_settings';

interface SavedSettings {
  bpm: number;
  timeSignatureTop: number;
  timeSignatureBottom: number;
  volume: number;
  soundStyle: SoundStyle;
  accentBeat1: boolean;
  subdivision: Subdivision;
  lastBeatId: string | null;
  mode: Mode;
}

const defaultSettings: SavedSettings = {
  bpm: 120,
  timeSignatureTop: 4,
  timeSignatureBottom: 4,
  volume: 0.8,
  soundStyle: 'click',
  accentBeat1: true,
  subdivision: 'off',
  lastBeatId: null,
  mode: 'drummachine',
};

function loadSettings(): SavedSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: SavedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function MetronomePage() {
  const saved = useRef(loadSettings()).current;
  const [mode, setMode] = useState<Mode>(saved.mode);
  const [bpm, setBpm] = useState(saved.bpm);
  const [timeSignatureTop, setTimeSignatureTop] = useState(saved.timeSignatureTop);
  const [timeSignatureBottom, setTimeSignatureBottom] = useState(saved.timeSignatureBottom);
  const [volume, setVolume] = useState(saved.volume);
  const [soundStyle, setSoundStyle] = useState<SoundStyle>(saved.soundStyle);
  const [accentBeat1, setAccentBeat1] = useState(saved.accentBeat1);
  const [subdivision, setSubdivision] = useState<Subdivision>(saved.subdivision);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(saved.lastBeatId);
  const [beats, setBeats] = useState<DrumBeat[]>([]);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const metronome = useMetronomeEngine();
  const drumMachine = useDrumMachineEngine();
  const { t, language } = useLanguage();
  const copy = PRACTICE_COPY[language];

  const isRunning = mode === 'metronome' ? metronome.isRunning : drumMachine.isRunning;

  // Load beats
  useEffect(() => {
    supabase.from('drum_beats').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) {
        setBeats(data as DrumBeat[]);
        if (!selectedBeatId && data.length > 0) {
          setSelectedBeatId(data[0].id);
        }
      }
    });
  }, []);

  // Save settings
  useEffect(() => {
    saveSettings({ bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision, lastBeatId: selectedBeatId, mode });
  }, [bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision, selectedBeatId, mode]);

  // Update running metronome options
  useEffect(() => {
    if (metronome.isRunning) {
      metronome.updateOptions({ bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision });
    }
  }, [bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision]);

  // Update running drum machine BPM
  useEffect(() => {
    if (drumMachine.isRunning) {
      const beat = beats.find(b => b.id === selectedBeatId);
      if (beat) drumMachine.updateBpm(bpm, beat.native_bpm);
    }
  }, [bpm]);

  // Update running drum machine volume
  useEffect(() => {
    if (drumMachine.isRunning) {
      drumMachine.updateVolume(volume);
    }
  }, [volume]);

  // Cleanup
  useEffect(() => {
    return () => {
      metronome.cleanup();
      drumMachine.cleanup();
    };
  }, []);

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode === mode) return;
    metronome.stop();
    drumMachine.stop();
    setMode(newMode);
  }, [mode, metronome, drumMachine]);

  const handleStartStop = useCallback(async () => {
    if (isRunning) {
      if (mode === 'metronome') metronome.stop();
      else drumMachine.stop();
      return;
    }

    if (mode === 'metronome') {
      await metronome.start({ bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision });
    } else {
      const beat = beats.find(b => b.id === selectedBeatId);
      if (beat) {
        await drumMachine.start(beat, bpm, volume);
      }
    }
  }, [isRunning, mode, bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision, selectedBeatId, beats, metronome, drumMachine]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes(prev => {
      const newTaps = [...prev, now].slice(-8);
      if (newTaps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          const interval = newTaps[i] - newTaps[i - 1];
          if (interval < 3000) intervals.push(interval);
        }
        if (intervals.length > 0) {
          intervals.sort((a, b) => a - b);
          const median = intervals[Math.floor(intervals.length / 2)];
          const newBpm = Math.round(60000 / median);
          if (newBpm >= 30 && newBpm <= 240) setBpm(newBpm);
        }
      }
      return newTaps;
    });
  }, []);

  const handleBeatChange = useCallback(async (beatId: string) => {
    setSelectedBeatId(beatId);
    if (drumMachine.isRunning) {
      const beat = beats.find(b => b.id === beatId);
      if (beat) await drumMachine.changeBeat(beat, bpm, volume);
    }
  }, [beats, bpm, volume, drumMachine]);

  const selectedBeat = beats.find(b => b.id === selectedBeatId);

  return (
    <div className="flex flex-col items-center gap-6 p-4 pb-24 max-w-lg mx-auto ts-light-module">
      {/* Mode Toggle */}
      <div className="flex bg-muted rounded-lg p-1 w-full max-w-xs">
        <Button variant="secondary"
          onClick={() => handleModeChange('metronome')}
          aria-pressed={mode === 'metronome'}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
            mode === 'metronome' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {copy.metronome}
        </Button>
        <Button variant="secondary"
          onClick={() => handleModeChange('drummachine')}
          aria-pressed={mode === 'drummachine'}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
            mode === 'drummachine' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {copy.drums}
        </Button>
      </div>

      {/* BPM Display & Controls */}
      <div className="flex flex-col items-center gap-3">
        <div className="text-7xl font-bold text-foreground tabular-nums ">
          {bpm}
        </div>
        <span className="text-sm text-muted-foreground uppercase ">BPM</span>
        <div className="flex items-center gap-4">
          <Button variant="secondary"
            onClick={() => setBpm(b => Math.max(30, b - 1))}
            aria-label={copy.decrease} title={copy.decrease}
            className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <Minus className="w-5 h-5" />
          </Button>
          <input
            aria-label={t('player.tempo')}
            type="range"
            min={30}
            max={240}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-40 accent-primary"
          />
          <Button variant="secondary"
            onClick={() => setBpm(b => Math.min(240, b + 1))}
            aria-label={copy.increase} title={copy.increase}
            className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Beat indicator */}
      {mode === 'metronome' && metronome.isRunning && (
        <div className="flex gap-2">
          {Array.from({ length: timeSignatureTop }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-100',
                metronome.currentBeat === i
                  ? (i === 0 && accentBeat1 ? 'bg-primary scale-125' : 'bg-primary/70 scale-110')
                  : 'bg-muted-foreground/20'
              )}
            />
          ))}
        </div>
      )}

      {/* Start/Stop */}
      <Button variant="secondary"
        onClick={handleStartStop}
        aria-label={t(isRunning ? 'player.stop' : 'player.play')} title={t(isRunning ? 'player.stop' : 'player.play')}
        disabled={mode === 'drummachine' && !selectedBeatId}
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all',
          isRunning
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            : 'bg-gold hover:bg-gold/90 text-gold-foreground',
          mode === 'drummachine' && !selectedBeatId && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isRunning ? <Square className="!w-8 !h-8" /> : <Play className="!w-8 !h-8 ml-1" />}
      </Button>

      {/* Tap Tempo */}
      <Button variant="secondary"
        onClick={handleTap}
        className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
      >
        TAP
      </Button>

      {/* Time Signature */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">{copy.meter}</Label>
        <Select value={String(timeSignatureTop)} onValueChange={v => setTimeSignatureTop(Number(v))}>
          <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-lg font-bold text-foreground">/</span>
        <Select value={String(timeSignatureBottom)} onValueChange={v => setTimeSignatureBottom(Number(v))}>
          <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2, 4, 8, 16].map(n => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Volume */}
      <div className="w-full max-w-xs space-y-2">
        <Label className="text-sm text-muted-foreground">{t('player.volume')}</Label>
        <Slider
          value={[volume * 100]}
          onValueChange={v => setVolume(v[0] / 100)}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Mode-specific controls */}
      {mode === 'metronome' && (
        <div className="w-full max-w-xs space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{copy.sound}</Label>
            <Select value={soundStyle} onValueChange={v => setSoundStyle(v as SoundStyle)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="click">{copy.click}</SelectItem>
                <SelectItem value="woodblock">{copy.woodblock}</SelectItem>
                <SelectItem value="beep">{copy.beep}</SelectItem>
                <SelectItem value="rim">{copy.rim}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{copy.accent}</Label>
            <Switch checked={accentBeat1} onCheckedChange={setAccentBeat1} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{copy.subdivision}</Label>
            <Select value={subdivision} onValueChange={v => setSubdivision(v as Subdivision)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">{copy.off}</SelectItem>
                <SelectItem value="8th">{copy.eighth}</SelectItem>
                <SelectItem value="triplet">{copy.triplet}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {mode === 'drummachine' && (
        <div className="w-full max-w-xs space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{copy.beat}</Label>
            {beats.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">{copy.noBeats}</p>
            ) : (
              <Select value={selectedBeatId || ''} onValueChange={handleBeatChange}>
                <SelectTrigger><SelectValue placeholder={copy.selectBeat} /></SelectTrigger>
                <SelectContent>
                  {beats.map(beat => (
                    <SelectItem key={beat.id} value={beat.id}>
                      {beat.title} {beat.category ? `(${beat.category})` : ''} {beat.native_bpm ? `– ${beat.native_bpm} BPM` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedBeat && (
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
              {selectedBeat.native_bpm ? (
                <span>{copy.original}: {selectedBeat.native_bpm} BPM → {copy.current}: {bpm} BPM ({Math.round((bpm / selectedBeat.native_bpm) * 100)}%)</span>
              ) : (
                <span>{copy.nativeMissing}</span>
              )}
            </div>
          )}

          {drumMachine.isLoading && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">{copy.loadingBeat}</p>
          )}
        </div>
      )}
    </div>
  );
}
