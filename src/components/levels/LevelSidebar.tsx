import { Level } from '@/types';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';
import { Star, Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extended interface for levels with new plan key
interface LevelWithPlan extends Omit<Level, 'requiredPlan'> {
  requiredPlanKey: PlanKey;
}

interface LevelSidebarProps {
  levels: LevelWithPlan[];
  activeLevel: string | null;
  onLevelSelect: (levelId: string) => void;
}

export function LevelSidebar({ levels, activeLevel, onLevelSelect }: LevelSidebarProps) {
  const { canAccessLevel } = useMembership();

  return (
    <aside className="w-[260px] glass-strong h-full overflow-y-auto flex-shrink-0">
      <div className="p-4">
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
                  {isLocked && (
                    <span className={cn(
                      'text-xs flex items-center gap-1',
                      isPremiumLevel 
                        ? 'text-reward-gold' 
                        : 'text-brand-blue-start'
                    )}>
                      {isPremiumLevel && <Crown className="w-3 h-3" />}
                      {PLAN_DISPLAY_NAMES[level.requiredPlanKey]}
                    </span>
                  )}
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
