import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LevelsPage } from './LevelsPage';
import { PdfsPage } from './PdfsPage';
import { MusicXMLPage } from './MusicXMLPage';
import { PracticePage } from './PracticePage';
import { RecordingsPage } from './RecordingsPage';
import { ChatsPage } from './ChatsPage';
import { ClassroomPage } from './ClassroomPage';
import { ProfilePage } from './ProfilePage';
import { GamePage } from './GamePage';
import { MetronomePage } from './MetronomePage';
import { TabId } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useMiniMode } from '@/hooks/useMiniMode';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';
import { LanguageSelectionDialog } from '@/components/onboarding/LanguageSelectionDialog';
import { WelcomeSlideshow } from '@/components/onboarding/WelcomeSlideshow';
import { cn } from '@/lib/utils';

// Define tab order for determining slide direction
const tabOrder: TabId[] = ['levels', 'pdfs', 'musicxml', 'practice', 'recordings', 'game', 'metronome', 'chats', 'classroom', 'profile'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [totalStars, setTotalStars] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const previousTabRef = useRef<TabId>('levels');
  const { user, loading } = useAuth();
  const { t, isLoading: languageLoading, hasCompletedLanguageSetup, hasSeenWelcome, completeWelcome } = useLanguage();
  const isMiniMode = useMiniMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab titles from translation
  const getTabTitle = (tab: TabId): string => {
    return t(`navigation.${tab}`);
  };

  // Handle navigation state (e.g., from MusicXML viewer returning)
  useEffect(() => {
    const state = location.state as { activeTab?: TabId } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect to auth if not logged in, or to mobile if mini mode
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && isMiniMode) {
      navigate('/mobile/home', { replace: true });
    }
  }, [user, loading, navigate, isMiniMode]);

  // Fetch user's total stars
  useEffect(() => {
    if (user) {
      const fetchStars = async () => {
        const { count } = await supabase
          .from('video_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setTotalStars(count || 0);
      };
      fetchStars();
    }
  }, [user]);

  const handleTabChange = (newTab: TabId) => {
    if (newTab === activeTab) return;
    
    // Determine slide direction based on tab order
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setSlideDirection(newIndex > currentIndex ? 'left' : 'right');
    
    // Start transition
    setIsTransitioning(true);
    previousTabRef.current = activeTab;
    
    // Change tab after a brief delay for exit animation
    setTimeout(() => {
      setActiveTab(newTab);
      // End transition after enter animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  const handleStarEarned = () => {
    setTotalStars(prev => prev + 1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not logged in (redirect will happen)
  if (!user) {
    return null;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'levels':
        return <LevelsPage onStarEarned={handleStarEarned} />;
      case 'pdfs':
        return <PdfsPage />;
      case 'musicxml':
        return <MusicXMLPage />;
      case 'practice':
        return <PracticePage />;
      case 'recordings':
        return <RecordingsPage />;
      case 'game':
        return <GamePage />;
      case 'metronome':
        return <MetronomePage />;
      case 'chats':
        return <ChatsPage />;
      case 'classroom':
        return <ClassroomPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <LevelsPage onStarEarned={handleStarEarned} />;
    }
  };

  return (
    <>
      <TabNavigationProvider activeTab={activeTab} onTabChange={handleTabChange}>
        <AppShell
          activeTab={activeTab}
          onTabChange={handleTabChange}
          title={getTabTitle(activeTab)}
          stars={totalStars}
        >
          <div 
            className={cn(
              "h-full transition-all duration-300 ease-out",
              isTransitioning && slideDirection === 'left' && "opacity-0 translate-x-[-20px]",
              isTransitioning && slideDirection === 'right' && "opacity-0 translate-x-[20px]",
              !isTransitioning && "opacity-100 translate-x-0"
            )}
          >
            {renderPage()}
          </div>
        </AppShell>
      </TabNavigationProvider>

      {/* Language Selection Dialog for first-time users */}
      <LanguageSelectionDialog 
        open={!languageLoading && !hasCompletedLanguageSetup} 
      />

      {/* Welcome Slideshow after onboarding is complete */}
      <WelcomeSlideshow
        open={!languageLoading && hasCompletedLanguageSetup && !hasSeenWelcome}
        onComplete={completeWelcome}
      />
    </>
  );
};

export default Index;
