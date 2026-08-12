import { useEffect, useState } from "react";
import { CHORD_PRESETS } from "@/lib/notes";
import { KEYS, load, save } from "@/lib/storage";

export interface ChordSettings {
  left: string;
  fire: string;
  right: string;
  presetId: string | "custom";
}

const DEFAULT: ChordSettings = { left: "C", fire: "E", right: "G", presetId: "C" };

export function useChordSettings() {
  const [chord, setChord] = useState<ChordSettings>(DEFAULT);
  useEffect(() => { setChord(load(KEYS.chord, DEFAULT)); }, []);
  const update = (c: ChordSettings) => { setChord(c); save(KEYS.chord, c); };
  const usePreset = (id: string) => {
    const p = CHORD_PRESETS.find((x) => x.id === id);
    if (!p) return;
    update({ left: p.notes[0], fire: p.notes[1], right: p.notes[2], presetId: id });
  };
  return { chord, update, usePreset };
}
