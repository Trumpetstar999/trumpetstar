import { TabId } from '@/types';
import { Layers, Music, Video, Users, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hidden?: boolean;
}

const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'practice', label: 'Üben', icon: Music },
  { id: 'recordings', label: 'Aufnahmen', icon: Video },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'classroom', label: 'Klasse', icon: Users },
  { id: 'profile', label: 'Profil', icon: User },
];

export function TabBar({ activeTab, onTabChange, hidden = false }: TabBarProps) {
  if (hidden) {
    return null;
  }

  return (
    <nav className="tab-bar z-50">
      <div className="flex items-center justify-around px-4 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 px-6 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-white bg-white/15 glow-blue' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
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
                isActive && 'text-white'
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
