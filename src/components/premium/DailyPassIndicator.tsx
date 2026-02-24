import { Film, Gamepad2 } from 'lucide-react';
import { useDailyUsage } from '@/hooks/useDailyUsage';

export function DailyPassIndicator() {
  const { videosUsed, gamesUsed, videoLimit, gameLimit, isFreeUser, isLoading } = useDailyUsage();

  if (!isFreeUser || isLoading) return null;

  const videosLeft = videoLimit - videosUsed;
  const gamesLeft = gameLimit - gamesUsed;

  // Micro-teaser messages
  const showVideoTeaser = videosLeft === 1;
  const showGameTeaser = gamesLeft === 1;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs">
        <span className="flex items-center gap-1 text-white/80">
          <Film className="w-3.5 h-3.5" />
          {videosUsed}/{videoLimit}
        </span>
        <span className="w-px h-3 bg-white/20" />
        <span className="flex items-center gap-1 text-white/80">
          <Gamepad2 className="w-3.5 h-3.5" />
          {gamesUsed}/{gameLimit}
        </span>
      </div>

      {/* Micro-teasers */}
      {showVideoTeaser && (
        <span className="text-[11px] text-[hsl(var(--reward-gold))] hidden sm:inline animate-fade-in">
          Noch 1 Video frei heute!
        </span>
      )}
      {showGameTeaser && !showVideoTeaser && (
        <span className="text-[11px] text-[hsl(var(--reward-gold))] hidden sm:inline animate-fade-in">
          Noch 1 Game frei heute!
        </span>
      )}
    </div>
  );
}
