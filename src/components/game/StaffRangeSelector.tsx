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

// Treble clef staff lines: E4=-4, G4=-2, B4=0, D5=2, F5=4
const STAFF_LINE_POSITIONS = [-4, -2, 0, 2, 4];

// Viewport: show a bit below E4 (pos -4) and above F5 (pos 4)
const STAFF_POS_MIN = -5.5; // slightly below bottom line (E4)
const STAFF_POS_MAX = 5.5;  // slightly above top line (F5)
const STAFF_TOTAL = STAFF_POS_MAX - STAFF_POS_MIN;

// Map staff position to percentage (top = 0%, bottom = 100%)
// High notes → top of staff → small percentage
function staffPosToPercent(pos: number): number {
  return ((STAFF_POS_MAX - pos) / STAFF_TOTAL) * 100;
}

// Treble clef SVG path (simplified glyph)
function TrebleClef({ color = 'rgba(234,179,8,0.9)' }: { color?: string }) {
  return (
    <text
      x="8" y={`${staffPosToPercent(1)}%`}
      fontSize="28"
      fill={color}
      fontFamily="serif"
      dominantBaseline="middle"
      textAnchor="middle"
      style={{ userSelect: 'none' }}
    >
      𝄞
    </text>
  );
}

function NoteHead({ midi, color }: { midi: number; color: string }) {
  const staffPos = midiToStaffPosition(midi);
  const pct = staffPosToPercent(staffPos);
  const noteInOctave = midi % 12;
  const isAccidental = [1, 3, 6, 8, 10].includes(noteInOctave);

  // Ledger lines below staff (below E4 = pos -4)
  const lowerLedgers: number[] = [];
  if (staffPos <= -6) {
    for (let p = -6; p >= staffPos; p -= 2) lowerLedgers.push(p);
  }
  // Ledger lines above staff (above F5 = pos 4)
  const upperLedgers: number[] = [];
  if (staffPos >= 6) {
    for (let p = 6; p <= staffPos; p += 2) upperLedgers.push(p);
  }

  return (
    <g>
      {lowerLedgers.map((p, i) => (
        <line
          key={`ll-${i}`}
          x1="30" x2="58"
          y1={`${staffPosToPercent(p)}%`}
          y2={`${staffPosToPercent(p)}%`}
          stroke={color} strokeWidth="1.5" strokeOpacity="0.8"
        />
      ))}
      {upperLedgers.map((p, i) => (
        <line
          key={`ul-${i}`}
          x1="30" x2="58"
          y1={`${staffPosToPercent(p)}%`}
          y2={`${staffPosToPercent(p)}%`}
          stroke={color} strokeWidth="1.5" strokeOpacity="0.8"
        />
      ))}
      {isAccidental && (
        <text
          x="28" y={`${pct}%`}
          dominantBaseline="middle" textAnchor="middle"
          fontSize="8" fill={color} fontWeight="bold"
        >#</text>
      )}
      <ellipse
        cx="44" cy={`${pct}%`}
        rx="7" ry="5"
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
  if (height <= 0) return null;

  return (
    <rect
      x="0" y={`${topPct}%`}
      width="100%" height={`${height}%`}
      fill="rgba(99,179,237,0.07)"
      rx="2"
    />
  );
}

export function StaffRangeSelector({ minMidi, maxMidi, onMinChange, onMaxChange }: StaffRangeSelectorProps) {
  // Upper slider → upper (max) note; moving right = higher pitch
  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if (v > minMidi) onMaxChange(v);
  }, [minMidi, onMaxChange]);

  // Lower slider → lower (min) note; moving right = higher pitch
  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if (v < maxMidi) onMinChange(v);
  }, [maxMidi, onMinChange]);

  const maxNoteName = midiToNoteName(maxMidi);
  const minNoteName = midiToNoteName(minMidi);

  const maxPct = ((maxMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100;
  const minPct = ((minMidi - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * 100;

  return (
    <div className="flex flex-col items-center gap-0 select-none w-full">
      {/* Upper slider → Obere Note */}
      <div className="w-full flex flex-col items-center gap-1 mb-2">
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[11px] text-white/50 uppercase tracking-wider">Obere Note</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(99,179,237,0.25)', color: '#93c5fd' }}
          >
            {maxNoteName}
          </span>
        </div>
        <input
          type="range"
          min={MIDI_MIN} max={MIDI_MAX} step={1}
          value={maxMidi}
          onChange={handleMaxChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              rgba(99,179,237,0.5) 0%,
              rgba(99,179,237,0.5) ${maxPct}%,
              rgba(255,255,255,0.1) ${maxPct}%,
              rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>

      {/* Staff visualization */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,30,60,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '120px',
        }}
      >
        <svg
          viewBox="0 0 100 120"
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
              x1="16" x2="98"
              y1={`${staffPosToPercent(pos)}%`}
              y2={`${staffPosToPercent(pos)}%`}
              stroke="rgba(234,179,8,0.65)"
              strokeWidth="1"
            />
          ))}

          {/* Treble clef */}
          <TrebleClef />

          {/* Note heads */}
          <NoteHead midi={maxMidi} color="#93c5fd" />
          <NoteHead midi={minMidi} color="#86efac" />
        </svg>

        {/* Right edge labels */}
        <div className="absolute right-1.5 top-0 h-full flex flex-col justify-between py-0.5 pointer-events-none">
          <span className="text-[8px] text-white/30">f2</span>
          <span className="text-[8px] text-white/20">b1</span>
          <span className="text-[8px] text-white/30">e1</span>
        </div>
      </div>

      {/* Lower slider → Untere Note */}
      <div className="w-full flex flex-col items-center gap-1 mt-2">
        <input
          type="range"
          min={MIDI_MIN} max={MIDI_MAX} step={1}
          value={minMidi}
          onChange={handleMinChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              rgba(134,239,172,0.5) 0%,
              rgba(134,239,172,0.5) ${minPct}%,
              rgba(255,255,255,0.1) ${minPct}%,
              rgba(255,255,255,0.1) 100%)`
          }}
        />
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
    </div>
  );
}
