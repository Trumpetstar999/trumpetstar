import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { Header } from './Header';
import { TabId } from '@/types';

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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} stars={stars} isOffline={isOffline} />
      
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
