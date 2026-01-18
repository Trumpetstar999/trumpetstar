import { TabId } from '@/types';
import { Layers, Music, Video, Users, User, MessageSquare, FileText, FileMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hidden?: boolean;
}

const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'pdfs', label: 'Noten', icon: FileText },
  { id: 'musicxml', label: 'MusicXML', icon: FileMusic },
  { id: 'practice', label: 'Üben', icon: Music },
  { id: 'recordings', label: 'Aufnahmen', icon: Video },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'classroom', label: 'Klasse', icon: Users },
  { id: 'profile', label: 'Profil', icon: User },
];

export function TabBar({ activeTab, onTabChange, hidden = false }: TabBarProps) {
  const unreadCount = useUnreadMessages();

  if (hidden) {
    return null;
  }

  return (
    <nav className="tab-bar z-50">
      <div className="flex items-center justify-around px-4 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'chats' && unreadCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1.5 px-6 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-white bg-white/15 glow-blue' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    'w-6 h-6 transition-transform duration-200',
                    isActive && 'scale-110'
                  )} 
                />
                {showBadge && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#25D366] text-white text-[10px] font-bold rounded-full shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
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
