import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LevelsPage } from './LevelsPage';
import { PracticePage } from './PracticePage';
import { RecordingsPage } from './RecordingsPage';
import { ClassroomPage } from './ClassroomPage';
import { ProfilePage } from './ProfilePage';
import { TabId } from '@/types';
import { mockStats } from '@/data/mockData';

const tabTitles: Record<TabId, string> = {
  levels: 'Levels',
  practice: 'Üben',
  recordings: 'Aufnahmen',
  classroom: 'Klassenzimmer',
  profile: 'Profil',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('levels');
  const [totalStars, setTotalStars] = useState(mockStats.totalStars);

  const handleStarEarned = () => {
    setTotalStars(prev => prev + 1);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'levels':
        return <LevelsPage onStarEarned={handleStarEarned} />;
      case 'practice':
        return <PracticePage />;
      case 'recordings':
        return <RecordingsPage />;
      case 'classroom':
        return <ClassroomPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <LevelsPage onStarEarned={handleStarEarned} />;
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={tabTitles[activeTab]}
      stars={totalStars}
    >
      {renderPage()}
    </AppShell>
  );
};

export default Index;
