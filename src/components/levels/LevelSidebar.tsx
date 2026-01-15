import { Level } from '@/types';
import { Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelSidebarProps {
  levels: Level[];
  activeLevel: string | null;
  onLevelSelect: (levelId: string) => void;
}

export function LevelSidebar({ levels, activeLevel, onLevelSelect }: LevelSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Alle Levels
        </h2>
        
        <nav className="space-y-1">
          {levels.map((level, index) => {
            const isActive = activeLevel === level.id;
            
            return (
              <button
                key={level.id}
                onClick={() => onLevelSelect(level.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>
                  <span className="font-medium truncate max-w-[120px]">
                    {level.title}
                  </span>
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
