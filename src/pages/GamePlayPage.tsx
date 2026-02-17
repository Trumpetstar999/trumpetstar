import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useGamePitchDetection, isIOSDevice } from '@/hooks/useGamePitchDetection';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameHUD } from '@/components/game/GameHUD';
import { GameStatusBar } from '@/components/game/GameStatusBar';
import { GameSettingsOverlay } from '@/components/game/GameSettingsOverlay';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { CONFIDENCE_THRESHOLDS } from '@/components/game/constants';
import { Loader2, Mic, MicOff, Activity, Bug } from 'lucide-react';

const IS_IOS = isIOSDevice();

export default function GamePlayPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { settings, updateSettings } = useGameSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micActivated, setMicActivated] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const threshold = CONFIDENCE_THRESHOLDS[settings.confidenceThreshold];
  const { isListening, isMicActive, pitchData, error, debugInfo, startListening, stopListening } =
    useGamePitchDetection(settings.calibrationCents, threshold);
  const { gameState, notesRef, particlesRef, startGame, stopGame, pauseGame, resumeGame, checkHit } =
    useGameLoop(settings);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Check hits when pitch data changes
  useEffect(() => {
    if (pitchData && gameState.isRunning) {
      checkHit(pitchData.writtenMidi);
    }
  }, [pitchData, gameState.isRunning, checkHit]);

  // Save highscore on game over
  useEffect(() => {
    if (gameState.isGameOver && user) {
      const accuracy =
        gameState.totalCount > 0
          ? Math.round((gameState.correctCount / gameState.totalCount) * 100)
          : 0;

      supabase
        .from('game_highscores')
        .insert({
          user_id: user.id,
          score: gameState.score,
          best_streak: gameState.bestStreak,
          level_reached: gameState.level,
          accuracy,
          notes_correct: gameState.correctCount,
          notes_total: gameState.totalCount,
          scale_key: settings.key,
          scale_type: settings.scaleType,
          accidental_mode: settings.accidentalMode,
          range_min: settings.rangeMin,
          range_max: settings.rangeMax,
        })
        .then(() => {});

      supabase
        .from('video_completions')
        .insert({ user_id: user.id, video_id: null, playback_speed: 1 })
        .then(() => {});
    }
  }, [gameState.isGameOver, user, gameState, settings]);

  // -----------------------------------------------------------------------
  // Mic activation handler
  // -----------------------------------------------------------------------
  const handleActivateMic = useCallback(async () => {
    await startListening();
    setMicActivated(true);
    startGame();
  }, [startListening, startGame]);

  // -----------------------------------------------------------------------
  // Dual touchend + click listeners for iOS compatibility
  // -----------------------------------------------------------------------
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    const btn = micButtonRef.current;
    if (!btn || micActivated) return;

    const handler = async (e: Event) => {
      e.preventDefault();
      if (handledRef.current) return;
      handledRef.current = true;
      await handleActivateMic();
    };

    btn.addEventListener('touchend', handler, { once: true });
    btn.addEventListener('click', handler, { once: true });

    return () => {
      btn.removeEventListener('touchend', handler);
      btn.removeEventListener('click', handler);
    };
  }, [micActivated, handleActivateMic]);

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleBack = useCallback(() => {
    stopListening();
    stopGame();
    navigate('/', { state: { activeTab: 'game' } });
  }, [navigate, stopListening, stopGame]);

  const handleTogglePause = useCallback(() => {
    if (gameState.isGameOver) return;
    if (gameState.isRunning) pauseGame();
    else resumeGame();
  }, [gameState.isRunning, gameState.isGameOver, pauseGame, resumeGame]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[hsl(222,86%,29%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Mic Activation Overlay – touchend + click via useEffect */}
      {!micActivated && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 gap-6 px-6 text-center">
          <button
            ref={micButtonRef}
            className="w-28 h-28 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/40"
          >
            <Mic className="w-12 h-12 text-white" />
          </button>
          <p className="text-white text-lg font-medium">
            🎤 Mikrofon aktivieren – Tippen zum Start
          </p>
          {IS_IOS && (
            <p className="text-white/60 text-sm max-w-xs">
              iPad benötigt einen Tipp, um das Mikrofon zu aktivieren
            </p>
          )}
          {IS_IOS && settings.sfxEnabled && (
            <p className="text-amber-400/80 text-xs max-w-xs">
              Für beste Erkennung auf iPad: Soundeffekte deaktivieren
            </p>
          )}
        </div>
      )}

      {/* Mic status indicator (top-right) */}
      {micActivated && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          {isListening ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <Activity
            className={`w-3.5 h-3.5 ${isMicActive ? 'text-emerald-400' : 'text-white/30'}`}
          />
          {/* Debug toggle button */}
          <button
            onClick={() => setShowDebug(prev => !prev)}
            className="ml-1"
          >
            <Bug className={`w-3.5 h-3.5 ${showDebug ? 'text-amber-400' : 'text-white/30'}`} />
          </button>
        </div>
      )}

      {/* Debug overlay */}
      {showDebug && micActivated && (
        <div className="absolute top-12 right-3 z-30 bg-black/80 rounded-lg p-3 text-xs font-mono text-white/80 space-y-1 min-w-[200px]">
          <div>🔊 Ctx: <span className={debugInfo.audioContextState === 'running' ? 'text-emerald-400' : 'text-red-400'}>{debugInfo.audioContextState}</span></div>
          <div>📊 Rate: {debugInfo.sampleRate}Hz</div>
          <div>🎤 Track: <span className={debugInfo.trackState === 'live' ? 'text-emerald-400' : 'text-red-400'}>{debugInfo.trackState}</span> {debugInfo.trackMuted ? '🔇' : ''}</div>
          <div>📈 RMS: {debugInfo.rms.toFixed(4)}</div>
          <div>🎵 Freq: {debugInfo.frequency.toFixed(1)}Hz</div>
          <div>🔢 Frames: {debugInfo.frameCount}</div>
          <div>📱 Platform: {IS_IOS ? 'iOS' : 'Desktop'}</div>
        </div>
      )}

      <GameHUD gameState={gameState} />

      <GameCanvas notesRef={notesRef} particlesRef={particlesRef} isRunning={gameState.isRunning} />

      <GameStatusBar
        sfxEnabled={settings.sfxEnabled}
        isPaused={!gameState.isRunning && !gameState.isGameOver}
        onToggleSfx={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
        onTogglePause={handleTogglePause}
        onQuit={handleBack}
      />

      {error && (
        <div className="absolute top-16 left-4 right-4 z-20 glass rounded-xl p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={startListening} className="text-white/70 text-xs underline mt-1">
            Erneut versuchen
          </button>
        </div>
      )}

      <GameSettingsOverlay
        open={settingsOpen}
        settings={settings}
        onUpdate={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <GameOverOverlay gameState={gameState} onRestart={handleRestart} onBack={handleBack} />
    </div>
  );
}
