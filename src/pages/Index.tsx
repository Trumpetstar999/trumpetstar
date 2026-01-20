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
import { TabId } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';
import { cn } from '@/lib/utils';


const tabTitles: Record<TabId, string> = {
  levels: 'Levels',
  pdfs: 'Notenhefte',
  musicxml: 'MusicXML Noten',
  practice: 'Üben',
  recordings: 'Aufnahmen',
  chats: 'Chats',
  classroom: 'Klassenzimmer',
  profile: 'Profil',
};

// Define tab order for determining slide direction
const tabOrder: TabId[] = ['levels', 'pdfs', 'musicxml', 'practice', 'recordings', 'chats', 'classroom', 'profile'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [totalStars, setTotalStars] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const previousTabRef = useRef<TabId>('levels');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation state (e.g., from MusicXML viewer returning)
  useEffect(() => {
    const state = location.state as { activeTab?: TabId } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
    <TabNavigationProvider activeTab={activeTab} onTabChange={handleTabChange}>
      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title={tabTitles[activeTab]}
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
  );
};

export default Index;
