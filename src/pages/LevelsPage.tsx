import { useState } from 'react';
import { LevelSidebar } from '@/components/levels/LevelSidebar';
import { SectionRow } from '@/components/levels/SectionRow';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { mockLevels } from '@/data/mockData';
import { Video, Level } from '@/types';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LevelsPageProps {
  onStarEarned: () => void;
}

export function LevelsPage({ onStarEarned }: LevelsPageProps) {
  const [activeLevel, setActiveLevel] = useState<string>(mockLevels[0]?.id || '');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  const currentLevel = mockLevels.find(l => l.id === activeLevel);

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <LevelSidebar
        levels={mockLevels}
        activeLevel={activeLevel}
        onLevelSelect={setActiveLevel}
      />
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {currentLevel && (
          <>
            {/* Level header */}
            <div className="sticky top-0 z-10 glass border-b border-border">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{currentLevel.title}</h2>
                  <p className="text-muted-foreground mt-1">
                    {currentLevel.sections.reduce((acc, s) => acc + s.videos.length, 0)} Videos
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync
                  </Button>
                  <Button variant="secondary" className="gap-2">
                    <Download className="w-4 h-4" />
                    Inhalte laden
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Sections */}
            <div className="py-4">
              {currentLevel.sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  onVideoClick={setSelectedVideo}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Video Player Overlay */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onComplete={onStarEarned}
        />
      )}
    </div>
  );
}
