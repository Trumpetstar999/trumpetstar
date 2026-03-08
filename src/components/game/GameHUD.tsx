import { useState, useEffect, useRef } from 'react';
import { Heart, Mic, MicOff, Activity, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameState } from '@/hooks/useGameLoop';
import logoImg from '@/assets/logo-trumpetstar-game.png';
import { useLanguage } from '@/hooks/useLanguage';

interface GameHUDProps {
  gameState: GameState;
  micActivated?: boolean;
  isListening?: boolean;
  isMicActive?: boolean;
  showDebug?: boolean;
  onToggleDebug?: () => void;
  debugInfo?: Record<string, unknown>;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [pop, setPop] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setPop(true);
      setDisplay(value);
      prevRef.current = value;
      const t = setTimeout(() => setPop(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={cn(
        'inline-block transition-transform duration-300',
        pop && 'animate-[bounce_0.4s_ease-out]',
        className
      )}
    >
      {display}
    </span>
  );
}

function HeartIcon({ active, lost }: { active: boolean; lost: boolean }) {
  const [shake, setShake] = useState(false);
  const prevActive = useRef(active);

  useEffect(() => {
    // Animate only when a life is lost (active goes from true → false)
    if (prevActive.current && !active) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      prevActive.current = active;
      return () => clearTimeout(t);
    }
    prevActive.current = active;
  }, [active]);

  return (
    <Heart
      className={cn(
        'w-6 h-6 transition-all duration-500 drop-shadow-md',
        active
          ? 'text-red-400 fill-red-400'
          : 'text-white/20 fill-white/10 scale-75',
        shake && 'animate-[bounce_0.6s_ease-out]'
      )}
    />
  );
}

export function GameHUD({
  gameState,
  micActivated,
  isListening,
  isMicActive,
  showDebug,
  onToggleDebug,
  debugInfo,
}: GameHUDProps) {
  const { language } = useLanguage();
  const isDE = language === 'de';

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 glass">
        {/* Left: Logo + Level */}
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="TrumpetStar" className="w-10 h-10 object-contain" />
          <span className="text-white font-bold text-sm">
            Level {gameState.level}
          </span>
        </div>

        {/* Center: Score + Streak */}
        <div className="flex items-center gap-4 text-center">
          <div>
            <div className="text-[10px] text-white/60 uppercase tracking-wider">
              {isDE ? 'Punkte' : 'Score'}
            </div>
            <AnimatedNumber value={gameState.score} className="text-white font-bold text-lg leading-tight" />
          </div>
          <div>
            <div className="text-[10px] text-white/60 uppercase tracking-wider">
              {isDE ? 'Treffer-Serie' : 'Streak'}
            </div>
            <AnimatedNumber value={gameState.streak} className="text-gold-gradient font-bold text-lg leading-tight" />
          </div>
        </div>

        {/* Right: Hearts + Mic indicator */}
        <div className="flex items-center gap-2">
          {/* Hearts */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <HeartIcon
                key={i}
                active={i < gameState.lives}
                lost={false}
              />
            ))}
          </div>

          {/* Mic status — only when activated */}
          {micActivated && (
            <div className="flex items-center gap-1 ml-1 bg-black/40 rounded-full px-2 py-1">
              {isListening ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              )}
              <Activity
                className={cn('w-3.5 h-3.5', isMicActive ? 'text-emerald-400' : 'text-white/30')}
              />
              <button onClick={onToggleDebug} className="ml-0.5">
                <Bug className={cn('w-3.5 h-3.5', showDebug ? 'text-amber-400' : 'text-white/30')} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debug panel below HUD */}
      {showDebug && micActivated && debugInfo && (
        <div className="absolute top-16 right-3 z-30 bg-black/80 rounded-lg p-3 text-xs font-mono text-white/80 space-y-1 min-w-[220px]">
          <div>🔊 Ctx: <span className={(debugInfo.audioContextState as string) === 'running' ? 'text-emerald-400' : 'text-red-400'}>{debugInfo.audioContextState as string}</span></div>
          <div>📊 Rate: {debugInfo.sampleRate as number}Hz</div>
          <div>🎤 Track: <span className={(debugInfo.trackState as string) === 'live' ? 'text-emerald-400' : 'text-red-400'}>{debugInfo.trackState as string}</span> {debugInfo.trackMuted ? '🔇' : ''}</div>
          <div>📈 RMS: {(debugInfo.rms as number).toFixed(4)}</div>
          <div>🎵 Freq: {(debugInfo.frequency as number).toFixed(1)}Hz</div>
          <div>🔢 Frames: {debugInfo.frameCount as number}</div>
        </div>
      )}
    </>
  );
}
