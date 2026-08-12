import { useAudioInput } from '@/hooks/toneforce/useAudioInput';
import { usePitchDetection } from '@/hooks/toneforce/usePitchDetection';
import { useChordSettings } from '@/hooks/toneforce/useChordSettings';
import { useAppSettings } from '@/hooks/toneforce/useLocalProgress';
import { StabilityBar } from '@/components/game/toneforce/StabilityBar';
import { pcMatches, instrumentSemitones } from '@/lib/toneforce/notes';
import { getDifficultyProfile } from '@/lib/toneforce/difficulty';
import { useTfT } from '@/i18n/toneforce';

interface Props {
  onStartGame: () => void;
}

export function ToneForceCalibration({ onStartGame }: Props) {
  const t = useTfT();
  const { status, error, start, analyserRef, ctxRef } = useAudioInput();
  const { chord } = useChordSettings();
  const { settings } = useAppSettings();
  const pitch = usePitchDetection(analyserRef, ctxRef, status === 'active', instrumentSemitones(settings.instrument));
  const profile = getDifficultyProfile(settings.difficulty);
  const chordNotes: [string, string, string] = [chord.left, chord.fire, chord.right];

  return (
    <div className="max-w-md mx-auto text-white">
      <h2 className="text-2xl font-bold mb-2">{t('calibration.title')}</h2>
      <p className="text-white/70 text-sm mb-6">
        {t('calibration.currentChord')}{' '}
        <b className="text-[#ffcc33]">{chord.left} – {chord.fire} – {chord.right}</b>
      </p>

      {status === 'idle' && (
        <div className="space-y-3">
          <button
            onClick={start}
            className="w-full rounded-xl bg-gradient-to-r from-[#ff8a1f] to-[#ff3b4d] py-4 font-semibold"
          >
            {t('calibration.activateMic')}
          </button>
          <button
            onClick={onStartGame}
            className="w-full rounded-xl bg-white/10 border border-white/20 py-4 font-semibold"
          >
            {t('calibration.demoMode')}
          </button>
        </div>
      )}

      {status === 'requesting' && <p>{t('calibration.waiting')}</p>}
      {status === 'denied' && (
        <div className="rounded-xl bg-red-500/20 border border-red-500/40 p-4 text-sm">
          {t('calibration.denied')}
        </div>
      )}
      {status === 'error' && <p className="text-red-300 text-sm">{t('calibration.error')} {error}</p>}

      {status === 'active' && (
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-xs text-white/60">{t('calibration.detectedTone')}</div>
            <div className="text-6xl font-black my-2 text-[#ffcc33]">{pitch.note ?? '—'}</div>
            <div className="text-xs text-white/60">
              {pitch.freq > 0 ? `${pitch.freq.toFixed(1)} Hz` : t('calibration.noTone')}
            </div>
            <div className="text-xs mt-1">
              {pitch.note && (
                Math.abs(pitch.cents) < 10 ? (
                  <span className="text-green-300">{t('calibration.perfect')}</span>
                ) : pitch.cents < 0 ? (
                  <span className="text-blue-300">{t('calibration.tooLow', { cents: pitch.cents })}</span>
                ) : (
                  <span className="text-orange-300">{t('calibration.tooHigh', { cents: pitch.cents })}</span>
                )
              )}
            </div>
            <div className="mt-3"><StabilityBar value={pitch.stable} label={t('calibration.stability')} /></div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {chordNotes.map((n, i) => {
              const labels = [t('calibration.left'), t('calibration.fire'), t('calibration.right')];
              const colors = [
                'bg-[#1e6bff]/30 border-[#1e6bff]',
                'bg-[#ff8a1f]/30 border-[#ff8a1f]',
                'bg-[#ff3b4d]/30 border-[#ff3b4d]',
              ];
              const hit =
                pitch.note &&
                pcMatches(pitch.note, n) &&
                pitch.stable >= profile.stabilityRequired &&
                Math.abs(pitch.cents) <= profile.centTolerance;
              return (
                <div key={i} className={`rounded-xl border p-3 ${colors[i]} ${hit ? 'ring-2 ring-[#ffcc33]' : ''}`}>
                  <div className="text-xs text-white/70">{labels[i]}</div>
                  <div className="text-2xl font-bold">{n}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onStartGame}
            className="block w-full rounded-xl bg-gradient-to-r from-[#ff8a1f] to-[#ff3b4d] py-4 text-center font-semibold"
          >
            {t('calibration.next')}
          </button>
        </div>
      )}

      <div className="mt-8 text-xs text-white/40">{t('calibration.tip')}</div>
    </div>
  );
}
