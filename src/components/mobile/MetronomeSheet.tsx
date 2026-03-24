import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, Minus, Plus, Timer } from 'lucide-react';
import { useMetronomeEngine, SoundStyle, Subdivision } from '@/hooks/useMetronomeEngine';
import { useDrumMachineEngine } from '@/hooks/useDrumMachineEngine';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DrumBeat {
  id: string;
  title: string;
  category: string | null;
  native_bpm: number | null;
  file_url: string;
  time_signature_top: number | null;
  time_signature_bottom: number | null;
}

type Mode = 'metronome' | 'drummachine';

const STORAGE_KEY = 'trumpetstar_metronome_settings';

function loadBpm(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored).bpm ?? 120;
  } catch {}
  return 120;
}

export function MetronomeSheet() {
  const [mode, setMode] = useState<Mode>('drummachine');
  const [bpm, setBpm] = useState(loadBpm);
  const [timeSignatureTop] = useState(4);
  const [timeSignatureBottom] = useState(4);
  const [volume] = useState(0.8);
  const [soundStyle] = useState<SoundStyle>('click');
  const [accentBeat1] = useState(true);
  const [subdivision] = useState<Subdivision>('off');
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [beats, setBeats] = useState<DrumBeat[]>([]);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const metronome = useMetronomeEngine();
  const drumMachine = useDrumMachineEngine();
  const isRunning = mode === 'metronome' ? metronome.isRunning : drumMachine.isRunning;

  useEffect(() => {
    supabase.from('drum_beats').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) {
        setBeats(data as DrumBeat[]);
        if (!selectedBeatId && data.length > 0) setSelectedBeatId(data[0].id);
      }
    });
  }, []);

  // save bpm
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prev = stored ? JSON.parse(stored) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, bpm }));
    } catch {}
  }, [bpm]);

  // sync running metronome
  useEffect(() => {
    if (metronome.isRunning) {
      metronome.updateOptions({ bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision });
    }
  }, [bpm]);

  useEffect(() => {
    if (drumMachine.isRunning) {
      const beat = beats.find(b => b.id === selectedBeatId);
      if (beat) drumMachine.updateBpm(bpm, beat.native_bpm);
    }
  }, [bpm]);

  useEffect(() => {
    return () => { metronome.cleanup(); drumMachine.cleanup(); };
  }, []);

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
      if (beat) await drumMachine.start(beat, bpm, volume);
    }
  }, [isRunning, mode, bpm, timeSignatureTop, timeSignatureBottom, volume, soundStyle, accentBeat1, subdivision, selectedBeatId, beats, metronome, drumMachine]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes(prev => {
      const newTaps = [...prev, now].slice(-8);
      if (newTaps.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < newTaps.length; i++) {
          const iv = newTaps[i] - newTaps[i - 1];
          if (iv < 3000) intervals.push(iv);
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,18,45,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
      }}
    >
      {/* Mode toggle */}
      <div className="flex p-3 gap-2">
        {(['metronome', 'drummachine'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => {
              if (m === mode) return;
              metronome.stop(); drumMachine.stop();
              setMode(m);
            }}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
              mode === m
                ? 'text-white'
                : 'text-white/40 hover:text-white/60'
            )}
            style={mode === m ? {
              background: 'linear-gradient(135deg, hsl(212 100% 42%), hsl(218 88% 34%))',
              boxShadow: '0 4px 12px rgba(0,120,255,0.3)',
            } : {
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            {m === 'metronome' ? 'Metronom' : 'DrumMachine'}
          </button>
        ))}
      </div>

      {/* BPM row */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => setBpm(b => Math.max(30, b - 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <Minus className="w-4 h-4 text-white/70" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-4xl font-bold text-white tabular-nums">{bpm}</div>
          <div className="text-white/40 text-[10px] tracking-widest uppercase">BPM</div>
        </div>

        <button
          onClick={() => setBpm(b => Math.min(240, b + 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <Plus className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* BPM slider */}
      <div className="px-4 pb-3">
        <input
          type="range" min={30} max={240} value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'hsl(212 100% 56%)' }}
        />
      </div>

      {/* Beat indicator (metronome mode) */}
      {mode === 'metronome' && metronome.isRunning && (
        <div className="flex justify-center gap-2 pb-3">
          {Array.from({ length: timeSignatureTop }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-75',
                metronome.currentBeat === i
                  ? 'scale-125'
                  : 'opacity-30'
              )}
              style={{
                background: metronome.currentBeat === i
                  ? (i === 0 ? 'hsl(212 100% 56%)' : 'hsl(212 100% 70%)')
                  : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Beat selector (drum machine) */}
      {mode === 'drummachine' && (
        <div className="px-4 pb-3">
          <Select value={selectedBeatId || ''} onValueChange={handleBeatChange}>
            <SelectTrigger
              className="w-full border-white/10 text-white/80 text-xs h-9"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <SelectValue placeholder="Beat wählen..." />
            </SelectTrigger>
            <SelectContent>
              {beats.map(beat => (
                <SelectItem key={beat.id} value={beat.id} className="text-xs">
                  {beat.title} {beat.native_bpm ? `– ${beat.native_bpm} BPM` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBeat?.native_bpm && (
            <p className="text-white/30 text-[10px] mt-1 text-center">
              Original {selectedBeat.native_bpm} BPM → {Math.round((bpm / selectedBeat.native_bpm) * 100)}%
            </p>
          )}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-3 px-4 pb-4">
        {/* Play/Stop */}
        <button
          onClick={handleStartStop}
          disabled={mode === 'drummachine' && !selectedBeatId}
          className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all disabled:opacity-40"
          style={isRunning ? {
            background: 'linear-gradient(135deg, hsl(0 80% 40%), hsl(0 70% 32%))',
            boxShadow: '0 4px 16px rgba(200,50,50,0.35)',
            color: 'white',
          } : {
            background: 'linear-gradient(135deg, hsl(212 100% 42%), hsl(218 88% 34%))',
            boxShadow: '0 4px 16px rgba(0,120,255,0.35)',
            color: 'white',
          }}
        >
          {isRunning
            ? <><Square className="w-4 h-4" /><span>Stop</span></>
            : <><Play className="w-4 h-4 ml-0.5" /><span>Start</span></>}
        </button>

        {/* TAP */}
        <button
          onClick={handleTap}
          className="h-12 px-5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          TAP
        </button>
      </div>
    </div>
  );
}
