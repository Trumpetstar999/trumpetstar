import React, { useCallback } from 'react';
import { midiToNoteName, midiToStaffPosition } from './constants';

interface StaffRangeSelectorProps {
  minMidi: number;
  maxMidi: number;
  onMinChange: (midi: number) => void;
  onMaxChange: (midi: number) => void;
}

const MIDI_MIN = 54; // F#3
const MIDI_MAX = 84; // C6

// Staff lines: E4=-4, G4=-2, B4=0, D5=2, F5=4 (treble clef)
const STAFF_LINE_POSITIONS = [-4, -2, 0, 2, 4];
const STAFF_POS_MIN = -7; // below bottom line (C4 area)
const STAFF_POS_MAX = 9;  // above top line (high notes)
const STAFF_TOTAL = STAFF_POS_MAX - STAFF_POS_MIN; // 16 units

// Map staff position to percentage (bottom = 0%, top = 100%)
function staffPosToPercent(pos: number): number {
  return ((pos - STAFF_POS_MIN) / STAFF_TOTAL) * 100;
}

function NoteHead({ midi, color }: { midi: number; color: string }) {
  const staffPos = midiToStaffPosition(midi);
  const pct = staffPosToPercent(staffPos);
  const noteInOctave = midi % 12;
  const isAccidental = [1, 3, 6, 8, 10].includes(noteInOctave);

  return (
    <g>
      {/* Ledger lines if needed */}
      {staffPos <= -6 && Array.from({ length: Math.floor((-6 - staffPos) / 2) + 1 }, (_, i) => (
        <line
          key={`ledger-lo-${i}`}
          x1="34" x2="66"
          y1={`${staffPosToPercent(-6 - i * 2)}%`}
          y2={`${staffPosToPercent(-6 - i * 2)}%`}
          stroke={color} strokeWidth="1.5" strokeOpacity="0.8"
        />
      ))}
      {staffPos >= 6 && Array.from({ length: Math.floor((staffPos - 6) / 2) + 1 }, (_, i) => (
        <line
          key={`ledger-hi-${i}`}
          x1="34" x2="66"
          y1={`${staffPosToPercent(6 + i * 2)}%`}
          y2={`${staffPosToPercent(6 + i * 2)}%`}
          stroke={color} strokeWidth="1.5" strokeOpacity="0.8"
        />
      ))}
      {/* Accidental symbol */}
      {isAccidental && (
        <text
          x="33" y={`${pct}%`}
          dominantBaseline="middle" textAnchor="middle"
          fontSize="8" fill={color} fontWeight="bold"
        >#</text>
      )}
      {/* Note head */}
      <ellipse
        cx="50%" cy={`${pct}%`}
        rx="7" ry="5.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </g>
  );
}

function RangeShading({ minMidi, maxMidi }: { minMidi: number; maxMidi: number }) {
  const topPct = staffPosToPercent(midiToStaffPosition(maxMidi));
  const bottomPct = staffPosToPercent(midiToStaffPosition(minMidi));
  const height = bottomPct - topPct;

  return (
    <rect
      x="0" y={`${topPct}%`}
      width="100%" height={`${height}%`}
      fill="rgba(99,179,237,0.08)"
      rx="2"
    />
  );
}

export function StaffRangeSelector({ minMidi, maxMidi, onMinChange, onMaxChange }: StaffRangeSelectorProps) {
  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if (v > minMidi) onMaxChange(v);
  }, [minMidi, onMaxChange]);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if (v < maxMidi) onMinChange(v);
  }, [maxMidi, onMinChange]);

  const maxNoteName = midiToNoteName(maxMidi);
  const minNoteName = midiToNoteName(minMidi);

  return (
    <div className="flex flex-col items-center gap-0 select-none w-full">
      {/* Top label + slider (upper note) */}
      <div className="w-full flex flex-col items-center gap-1 mb-1">
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[11px] text-white/50 uppercase tracking-wider">Obere Note</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(99,179,237,0.25)', color: '#93c5fd' }}
          >
            {maxNoteName}
          </span>
        </div>
        <div className="relative w-full">
          <input
            type="range"
            min={MIDI_MIN} max={MIDI_MAX} step={1}
            value={maxMidi}
            onChange={handleMaxChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                rgba(255,255,255,0.1) 0%,
                rgba(255,255,255,0.1) ${((maxMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100}%,
                rgba(99,179,237,0.5) ${((maxMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100}%,
                rgba(99,179,237,0.5) 100%)`
            }}
          />
        </div>
      </div>

      {/* Staff visualization */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,30,60,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '130px',
        }}
      >
        <svg
          viewBox="0 0 100 130"
          preserveAspectRatio="none"
          width="100%" height="100%"
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Range shading */}
          <RangeShading minMidi={minMidi} maxMidi={maxMidi} />

          {/* Staff lines */}
          {STAFF_LINE_POSITIONS.map(pos => (
            <line
              key={pos}
              x1="0" x2="100"
              y1={`${staffPosToPercent(pos)}%`}
              y2={`${staffPosToPercent(pos)}%`}
              stroke="rgba(234,179,8,0.65)"
              strokeWidth="1"
            />
          ))}

          {/* Note heads */}
          <NoteHead midi={maxMidi} color="#93c5fd" />
          <NoteHead midi={minMidi} color="#86efac" />
        </svg>

        {/* Note labels overlay */}
        <div
          className="absolute right-2 flex flex-col justify-between h-full py-1 pointer-events-none"
          style={{ top: 0 }}
        >
          <span className="text-[9px] text-white/25">C6</span>
          <span className="text-[9px] text-white/25">C4</span>
          <span className="text-[9px] text-white/25">F3</span>
        </div>
      </div>

      {/* Bottom slider (lower note) */}
      <div className="w-full flex flex-col items-center gap-1 mt-1">
        <div className="relative w-full">
          <input
            type="range"
            min={MIDI_MIN} max={MIDI_MAX} step={1}
            value={minMidi}
            onChange={handleMinChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                rgba(134,239,172,0.5) 0%,
                rgba(134,239,172,0.5) ${((minMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100}%,
                rgba(255,255,255,0.1) ${((minMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100}%,
                rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[11px] text-white/50 uppercase tracking-wider">Untere Note</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(134,239,172,0.2)', color: '#86efac' }}
          >
            {minNoteName}
          </span>
        </div>
      </div>

      {/* Range presets */}
      <div className="flex gap-2 w-full mt-2">
        {([
          { label: 'Easy', minMidi: 60, maxMidi: 79 },
          { label: 'Normal', minMidi: 57, maxMidi: 84 },
          { label: 'Hard', minMidi: 54, maxMidi: 84 },
        ] as const).map(preset => {
          const active = minMidi === preset.minMidi && maxMidi === preset.maxMidi;
          return (
            <button
              key={preset.label}
              onClick={() => { onMinChange(preset.minMidi); onMaxChange(preset.maxMidi); }}
              className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? 'rgba(99,179,237,0.25)' : 'rgba(255,255,255,0.05)',
                border: active ? '1px solid rgba(99,179,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#93c5fd' : 'rgba(255,255,255,0.45)',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
