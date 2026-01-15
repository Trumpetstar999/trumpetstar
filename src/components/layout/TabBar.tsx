import { TabId } from '@/types';
import { Layers, Music, Video, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'practice', label: 'Üben', icon: Music },
  { id: 'recordings', label: 'Aufnahmen', icon: Video },
  { id: 'classroom', label: 'Klassenzimmer', icon: Users },
  { id: 'profile', label: 'Profil', icon: User },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary bg-secondary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon 
                className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} 
              />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'text-primary'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
