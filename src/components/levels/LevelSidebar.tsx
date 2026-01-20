import { Level } from '@/types';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';
import { Star, Lock, Crown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'basics' | 'beginner' | 'easy' | 'medium' | 'advanced';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  basics: 'Basics',
  beginner: 'Anfänger',
  easy: 'Einfach',
  medium: 'Mittel',
  advanced: 'Anspruchsvoll',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  basics: 'text-purple-400',
  beginner: 'text-green-400',
  easy: 'text-blue-400',
  medium: 'text-orange-400',
  advanced: 'text-red-400',
};

// Extended interface for levels with new plan key
interface LevelWithPlan extends Omit<Level, 'requiredPlan'> {
  requiredPlanKey: PlanKey;
  difficulty?: Difficulty;
}

interface LevelSidebarProps {
  levels: LevelWithPlan[];
  activeLevel: string | null;
  onLevelSelect: (levelId: string) => void;
  showRecent?: boolean;
}

export function LevelSidebar({ levels, activeLevel, onLevelSelect, showRecent = true }: LevelSidebarProps) {
  const { canAccessLevel } = useMembership();

  return (
    <aside className="w-[260px] glass-strong h-full overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {/* Recent Videos Button */}
        {showRecent && (
          <>
            <button
              onClick={() => onLevelSelect('recent')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-full transition-all duration-200 mb-4',
                activeLevel === 'recent' 
                  ? 'bg-white/18 glow-blue' 
                  : 'hover:bg-white/10'
              )}
            >
              <span className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                activeLevel === 'recent' 
                  ? 'bg-white text-brand-blue-mid' 
                  : 'bg-white/15 text-white'
              )}>
                <Clock className="w-5 h-5" />
              </span>
              <span className={cn(
                'font-medium',
                activeLevel === 'recent' ? 'text-white' : 'text-white/90'
              )}>
                Zuletzt angesehen
              </span>
            </button>
            
            <div className="border-t border-white/10 mb-4" />
          </>
        )}
        
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 px-2">
          Alle Levels
        </h2>
        
        <nav className="space-y-2">
          {levels.map((level, index) => {
            const isActive = activeLevel === level.id;
            const isLocked = level.requiredPlanKey !== 'FREE' && !canAccessLevel(level.requiredPlanKey);
            const isPremiumLevel = level.requiredPlanKey === 'PREMIUM';
            
            return (
              <button
                key={level.id}
                onClick={() => onLevelSelect(level.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-full transition-all duration-200',
                  isActive 
                    ? 'bg-white/18 glow-blue' 
                    : 'hover:bg-white/10',
                  isLocked && !isActive && 'opacity-70'
                )}
              >
                {/* Number badge */}
                <span className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  isActive 
                    ? 'bg-white text-brand-blue-mid' 
                    : isLocked
                      ? 'bg-white/10 text-white/60'
                      : 'bg-white/15 text-white'
                )}>
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                
                {/* Title and plan indicator */}
                <div className="flex-1 min-w-0 text-left">
                  <span className={cn(
                    'block font-medium truncate',
                    isActive ? 'text-white' : 'text-white/90'
                  )}>
                    {level.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {level.difficulty && (
                      <span className={cn(DIFFICULTY_COLORS[level.difficulty])}>
                        {DIFFICULTY_LABELS[level.difficulty]}
                      </span>
                    )}
                    {isLocked && (
                      <span className={cn(
                        'flex items-center gap-1',
                        isPremiumLevel 
                          ? 'text-reward-gold' 
                          : 'text-brand-blue-start'
                      )}>
                        {isPremiumLevel && <Crown className="w-3 h-3" />}
                        {PLAN_DISPLAY_NAMES[level.requiredPlanKey]}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Stars earned */}
                {level.totalStars > 0 && (
                  <div className={cn(
                    'flex items-center gap-1 text-sm flex-shrink-0',
                    isActive ? 'text-reward-gold' : 'text-reward-gold/80'
                  )}>
                    <Star className="w-4 h-4 fill-current" />
                    {level.totalStars}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
