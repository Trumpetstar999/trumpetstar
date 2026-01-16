import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LevelsPage } from './LevelsPage';
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
import { AssistantButton } from '@/components/assistant/AssistantButton';

const tabTitles: Record<TabId, string> = {
  levels: 'Levels',
  practice: 'Üben',
  recordings: 'Aufnahmen',
  chats: 'Chats',
  classroom: 'Klassenzimmer',
  profile: 'Profil',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [totalStars, setTotalStars] = useState(0);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
    <TabNavigationProvider activeTab={activeTab} onTabChange={setActiveTab}>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title={tabTitles[activeTab]}
        stars={totalStars}
      >
        {renderPage()}
      </AppShell>
      <AssistantButton />
    </TabNavigationProvider>
  );
};

export default Index;
