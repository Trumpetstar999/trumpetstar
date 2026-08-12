import { useAppSettings } from '@/hooks/toneforce/useLocalProgress';
import { INSTRUMENT_OPTIONS } from '@/lib/toneforce/notes';
import { DIFFICULTY_KEYS, getDifficultyProfile, type Difficulty } from '@/lib/toneforce/difficulty';
import { useTfT } from '@/i18n/toneforce';

export function ToneForceSettings() {
  const t = useTfT();
  const { settings, update } = useAppSettings();
  const profile = getDifficultyProfile(settings.difficulty);
  const diffLabel = (d: Difficulty) => t(`settings.${d}`);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h2>
      <div className="space-y-3">
        <label className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white">
          <span>{t('settings.sound')}</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
            className="w-5 h-5 accent-[#ffcc33]"
          />
        </label>
        <label className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white">
          <span>{t('settings.music')}</span>
          <input
            type="checkbox"
            checked={settings.musicEnabled}
            onChange={(e) => update({ musicEnabled: e.target.checked })}
            className="w-5 h-5 accent-[#ffcc33]"
          />
        </label>

        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
          <div className="mb-2 text-white">{t('settings.difficulty')}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_KEYS.map((d) => (
              <button
                key={d}
                onClick={() => update({ difficulty: d })}
                className={`rounded-lg py-2 text-sm font-semibold ${
                  settings.difficulty === d ? 'bg-[#ffcc33] text-[#0c0524]' : 'bg-white/10 text-white'
                }`}
              >
                {diffLabel(d)}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/60 mt-2">
            {t('settings.difficultyHint', { cents: profile.centTolerance })}
          </p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
          <div className="mb-2 text-white">{t('settings.instrument')}</div>
          <div className="grid grid-cols-2 gap-2">
            {INSTRUMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => update({ instrument: opt.id })}
                className={`rounded-lg py-2 px-3 text-xs font-semibold text-left ${
                  settings.instrument === opt.id ? 'bg-[#ffcc33] text-[#0c0524]' : 'bg-white/10 text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/50 mt-2">{t('settings.instrumentHint')}</p>
        </div>
      </div>
    </div>
  );
}
