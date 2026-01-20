import { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { Header } from './Header';
import { TabId } from '@/types';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { usePdfViewer } from '@/hooks/usePdfViewer';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  title: string;
  stars: number;
  isOffline?: boolean;
  videoCount?: number;
}

export function AppShell({ 
  children, 
  activeTab, 
  onTabChange, 
  title,
  stars,
  isOffline,
  videoCount
}: AppShellProps) {
  const { isVideoPlaying } = useVideoPlayer();
  const { isPdfViewerOpen } = usePdfViewer();
  
  const isFullscreen = isVideoPlaying || isPdfViewerOpen;

  // In fullscreen mode, render only children without any layout chrome
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden">
        {children}
      </div>
    );
  }

  // Normal mode with Header and TabBar
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title={title} 
        stars={stars} 
        isOffline={isOffline} 
        videoCount={videoCount}
      />
      
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={onTabChange} hidden={false} />
    </div>
  );
}
