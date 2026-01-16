import { Level } from '@/types';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { useMembership } from '@/hooks/useMembership';
import { Star, ChevronRight, Lock, Crown } from 'lucide-react';
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
    <aside className="w-64 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Alle Levels
        </h2>
        
        <nav className="space-y-1">
          {levels.map((level, index) => {
            const isActive = activeLevel === level.id;
            const isLocked = level.requiredPlanKey !== 'FREE' && !canAccessLevel(level.requiredPlanKey);
            const isPremiumLevel = level.requiredPlanKey === 'PREMIUM';
            const isBasicLevel = level.requiredPlanKey === 'BASIC';
            
            return (
              <button
                key={level.id}
                onClick={() => onLevelSelect(level.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-foreground hover:bg-secondary',
                  isLocked && !isActive && 'opacity-75'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : isLocked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium truncate max-w-[120px]">
                      {level.title}
                    </span>
                    {isLocked && (
                      <span className={cn(
                        'text-xs flex items-center gap-1',
                        isPremiumLevel 
                          ? 'text-amber-500' 
                          : 'text-blue-500'
                      )}>
                        {isPremiumLevel && <Crown className="w-3 h-3" />}
                        {PLAN_DISPLAY_NAMES[level.requiredPlanKey]}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {level.totalStars > 0 && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm',
                      isActive ? 'text-primary-foreground/80' : 'text-gold'
                    )}>
                      <Star className="w-4 h-4 fill-current" />
                      {level.totalStars}
                    </div>
                  )}
                  <ChevronRight className={cn(
                    'w-4 h-4',
                    isActive ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
