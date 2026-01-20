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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hide header in fullscreen mode for maximum video space */}
      {!isFullscreen && (
        <Header 
          title={title} 
          stars={stars} 
          isOffline={isOffline} 
          videoCount={videoCount}
        />
      )}
      
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isFullscreen ? "pb-0" : "pb-24"
      )}>
        {children}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={onTabChange} hidden={isFullscreen} />
    </div>
  );
}
