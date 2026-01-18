import { useState, useMemo } from 'react';
import { TabId } from '@/types';
import { Layers, Music, Video, Users, User, MessageSquare, FileText, FileMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import toniAvatar from '@/assets/toni-coach.png';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hidden?: boolean;
}

// Map TabId to feature flag key
const tabToFlagKey: Record<TabId, string> = {
  levels: 'menu_levels',
  pdfs: 'menu_pdfs',
  musicxml: 'menu_musicxml',
  practice: 'menu_practice',
  recordings: 'menu_recordings',
  chats: 'menu_chats',
  classroom: 'menu_classroom',
  profile: 'menu_profile',
};

const allTabs: { id: TabId; label: string; icon: typeof Layers }[] = [
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();

  // Filter tabs based on feature flags
  const tabs = useMemo(() => {
    if (flagsLoading) return allTabs; // Show all while loading
    return allTabs.filter(tab => isEnabled(tabToFlagKey[tab.id]));
  }, [isEnabled, flagsLoading]);

  if (hidden) {
    return null;
  }

  // Split tabs for left and right of center button
  const midpoint = Math.ceil(tabs.length / 2);
  const leftTabs = tabs.slice(0, midpoint);
  const rightTabs = tabs.slice(midpoint);

  return (
    <>
      <nav className="tab-bar z-50">
        <div className="flex items-center justify-between px-2 py-2">
          {/* Left tabs */}
          <div className="flex items-center justify-around flex-1">
            {leftTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showBadge = tab.id === 'chats' && unreadCount > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'text-white bg-white/15 glow-blue' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  <div className="relative">
                    <Icon 
                      className={cn(
                        'w-5 h-5 transition-transform duration-200',
                        isActive && 'scale-110'
                      )} 
                    />
                    {showBadge && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-[#25D366] text-white text-[9px] font-bold rounded-full shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive && 'text-white'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center Assistant Button - elevated and prominent */}
          <div className="relative -mt-6 mx-2">
            <button
              onClick={() => setAssistantOpen(true)}
              className={cn(
                'relative h-14 w-14 rounded-full shadow-xl',
                'bg-[#25D366] hover:bg-[#1DAF5A]',
                'transition-all duration-300 hover:scale-110',
                'flex items-center justify-center overflow-hidden',
                'border-4 border-background ring-2 ring-[#25D366]/30'
              )}
            >
              <img 
                src={toniAvatar} 
                alt="Toni - Trompeten-Coach" 
                className="h-full w-full object-cover"
              />
            </button>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-[#25D366]/20 blur-md -z-10 animate-pulse" />
          </div>

          {/* Right tabs */}
          <div className="flex items-center justify-around flex-1">
            {rightTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showBadge = tab.id === 'chats' && unreadCount > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
                    isActive 
                      ? 'text-white bg-white/15 glow-blue' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  <div className="relative">
                    <Icon 
                      className={cn(
                        'w-5 h-5 transition-transform duration-200',
                        isActive && 'scale-110'
                      )} 
                    />
                    {showBadge && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-[#25D366] text-white text-[9px] font-bold rounded-full shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive && 'text-white'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Assistant Panel Backdrop */}
      {assistantOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setAssistantOpen(false)}
        />
      )}

      {/* Assistant Panel */}
      <AssistantPanel isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
}
