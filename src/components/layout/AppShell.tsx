import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { Header } from './Header';
import { TabId } from '@/types';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  title: string;
  stars: number;
  isOffline?: boolean;
}

const tabTitles: Record<TabId, string> = {
  levels: 'Levels',
  practice: 'Üben',
  recordings: 'Aufnahmen',
  classroom: 'Klassenzimmer',
  profile: 'Profil',
};

export function AppShell({ 
  children, 
  activeTab, 
  onTabChange, 
  title,
  stars,
  isOffline 
}: AppShellProps) {
  const { isVideoPlaying } = useVideoPlayer();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} stars={stars} isOffline={isOffline} />
      
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isVideoPlaying ? "pb-0" : "pb-24"
      )}>
        {children}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={onTabChange} hidden={isVideoPlaying} />
    </div>
  );
}
