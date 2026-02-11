import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useGamePitchDetection } from '@/hooks/useGamePitchDetection';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameHUD } from '@/components/game/GameHUD';
import { GameStatusBar } from '@/components/game/GameStatusBar';
import { GameSettingsOverlay } from '@/components/game/GameSettingsOverlay';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { CONFIDENCE_THRESHOLDS } from '@/components/game/constants';
import { Loader2 } from 'lucide-react';

export default function GamePlayPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { settings, updateSettings } = useGameSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const threshold = CONFIDENCE_THRESHOLDS[settings.confidenceThreshold];
  const { isListening, pitchData, error, startListening, stopListening } = useGamePitchDetection(
    settings.calibrationCents, threshold
  );
  const { gameState, notesRef, particlesRef, startGame, stopGame, pauseGame, resumeGame, checkHit } = useGameLoop(settings);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Start mic + game on mount
  useEffect(() => {
    startListening().then(() => {
      startGame();
    });
    return () => {
      stopListening();
      stopGame();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check hits when pitch data changes
  useEffect(() => {
    if (pitchData && gameState.isRunning) {
      checkHit(pitchData.writtenMidi);
    }
  }, [pitchData, gameState.isRunning, checkHit]);

  // Save highscore on game over
  useEffect(() => {
    if (gameState.isGameOver && user) {
      const accuracy = gameState.totalCount > 0
        ? Math.round((gameState.correctCount / gameState.totalCount) * 100)
        : 0;

      supabase.from('game_highscores').insert({
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
      }).then(() => {});

      // Award a star for playing a game
      supabase.from('video_completions').insert({
        user_id: user.id,
        video_id: null,
        playback_speed: 1,
      }).then(() => {});
    }
  }, [gameState.isGameOver, user, gameState, settings]);

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleBack = useCallback(() => {
    stopListening();
    stopGame();
    navigate('/', { state: { activeTab: 'game' } });
  }, [navigate, stopListening, stopGame]);

  const handleToggleMic = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

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
      <GameHUD gameState={gameState} />

      <GameCanvas
        notesRef={notesRef}
        particlesRef={particlesRef}
        isRunning={gameState.isRunning}
      />

      <GameStatusBar
        isListening={isListening}
        detectedNote={pitchData ? `${pitchData.concertNote}${pitchData.concertOctave}` : null}
        mappedNote={pitchData ? `${pitchData.writtenNote}${pitchData.writtenOctave}` : null}
        confidence={pitchData?.confidence ?? 0}
        sfxEnabled={settings.sfxEnabled}
        isPaused={!gameState.isRunning && !gameState.isGameOver}
        onToggleMic={handleToggleMic}
        onToggleSfx={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
        onOpenSettings={() => setSettingsOpen(true)}
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

      <GameOverOverlay
        gameState={gameState}
        onRestart={handleRestart}
        onBack={handleBack}
      />
    </div>
  );
}
