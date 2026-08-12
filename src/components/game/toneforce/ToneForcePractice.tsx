import { useEffect, useState } from 'react';
import { useAudioInput } from '@/hooks/toneforce/useAudioInput';
import { usePitchDetection } from '@/hooks/toneforce/usePitchDetection';
import { useChordSettings } from '@/hooks/toneforce/useChordSettings';
import { useAppSettings } from '@/hooks/toneforce/useLocalProgress';
import { pcMatches, instrumentSemitones } from '@/lib/toneforce/notes';
import { getDifficultyProfile } from '@/lib/toneforce/difficulty';
import { StabilityBar } from '@/components/game/toneforce/StabilityBar';
import { useTfT } from '@/i18n/toneforce';

export function ToneForcePractice() {
  const t = useTfT();
  const { chord } = useChordSettings();
  const { status, start, analyserRef, ctxRef } = useAudioInput();
  const { settings } = useAppSettings();
  const pitch = usePitchDetection(analyserRef, ctxRef, status === 'active', instrumentSemitones(settings.instrument));
  const sequence = [chord.left, chord.fire, chord.right];
  const [idx, setIdx] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [hits, setHits] = useState(0);
  const target = sequence[idx];
  const profile = getDifficultyProfile(settings.difficulty);

  useEffect(() => {
    if (status !== 'active') return;
    if (
      pitch.note &&
      pcMatches(pitch.note, target) &&
      pitch.stable >= profile.stabilityRequired &&
      Math.abs(pitch.cents) <= profile.centTolerance
    ) {
      setLastFeedback(Math.abs(pitch.cents) <= profile.centTolerance / 2 ? t('practice.perfect') : t('practice.good'));
      setHits((h) => h + 1);
      setIdx((i) => (i + 1) % sequence.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitch.note, pitch.stable, pitch.cents, target, status, sequence.length, profile.centTolerance, profile.stabilityRequired]);

  return (
    <div className="max-w-md mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">{t('practice.title')}</h2>

      {status !== 'active' ? (
        <button
          onClick={start}
          className="w-full rounded-xl bg-gradient-to-r from-[#ff8a1f] to-[#ff3b4d] py-4 font-semibold"
        >
          {t('practice.activateMic')}
        </button>
      ) : (
        <>
          <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
            <div className="text-xs text-white/60">{t('practice.playNow')}</div>
            <div className="text-7xl font-black my-3 text-[#ffcc33]">{target}</div>
            <div className="text-sm text-white/70">
              {t('practice.detected')} <b className="text-white">{pitch.note ?? '—'}</b>
              {pitch.note && ` (${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢)`}
            </div>
            <div className="mt-4"><StabilityBar value={pitch.stable} label={t('practice.stability')} /></div>
            {lastFeedback && <div className="mt-4 text-2xl font-bold text-green-300 animate-pulse">{lastFeedback}</div>}
          </div>
          <div className="mt-4 text-center text-white/70">
            {t('practice.hits')} <b className="text-[#ffcc33]">{hits}</b>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {sequence.map((n, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg font-bold ${i === idx ? 'bg-[#ffcc33] text-[#0c0524]' : 'bg-white/10'}`}
              >
                {n}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
