import { useState, useCallback } from 'react';

export interface GameSettings {
  key: string;
  scaleType: string;
  rangeMin: string;
  rangeMax: string;
  rangeMinMidi: number;
  rangeMaxMidi: number;
  accidentalMode: 'key_signature' | 'note_accidentals';
  startSpeed: number;
  confidenceThreshold: 'low' | 'medium' | 'high';
  sfxEnabled: boolean;
  calibrationCents: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  key: 'C',
  scaleType: 'major',
  rangeMin: 'C4',
  rangeMax: 'G5',
  rangeMinMidi: 60,
  rangeMaxMidi: 79,
  accidentalMode: 'key_signature',
  startSpeed: 3,
  confidenceThreshold: 'medium',
  sfxEnabled: false,
  calibrationCents: 0,
};

const STORAGE_KEY = 'trumpetstar_game_settings';

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useGameSettings() {
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { settings, updateSettings, resetSettings };
}
