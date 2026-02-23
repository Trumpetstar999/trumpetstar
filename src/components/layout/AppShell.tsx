import { ReactNode, useState, useEffect } from 'react';
import { TabBar } from './TabBar';
import { Header } from './Header';
import { TabId } from '@/types';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { usePdfViewer } from '@/hooks/usePdfViewer';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { ReviewPromptDialog } from '@/components/review/ReviewPromptDialog';
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
  const { shouldShowPrompt, markPromptShown } = useReviewPrompt();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  const isFullscreen = isVideoPlaying || isPdfViewerOpen;

  // Show review prompt after a short delay when conditions are met
  useEffect(() => {
    if (shouldShowPrompt && !reviewDialogOpen) {
      const timer = setTimeout(() => {
        setReviewDialogOpen(true);
        markPromptShown();
      }, 3000); // 3 second delay for non-intrusive UX
      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt]);

  return (
    <div className={cn(
      "flex flex-col",
      isFullscreen ? "h-screen" : "min-h-screen"
    )}>
      {!isFullscreen && (
        <Header 
          title={title} 
          stars={stars} 
          isOffline={isOffline} 
          videoCount={videoCount}
        />
      )}
      
      <main className={cn(
        "flex-1 overflow-auto",
        isFullscreen ? "p-0" : "pb-24"
      )}>
        {children}
      </main>
      
      {!isFullscreen && (
        <TabBar activeTab={activeTab} onTabChange={onTabChange} hidden={false} />
      )}

      <ReviewPromptDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      />
    </div>
  );
}
