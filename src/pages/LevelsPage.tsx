import { useState, useEffect } from 'react';
import { LevelSidebar } from '@/components/levels/LevelSidebar';
import { SectionRow } from '@/components/levels/SectionRow';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Video, Level, Section } from '@/types';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LevelsPageProps {
  onStarEarned: () => void;
}

export function LevelsPage({ onStarEarned }: LevelsPageProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    setIsLoading(true);
    try {
      // Fetch active levels
      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (levelsError) throw levelsError;

      // Fetch sections for all levels
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch active videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (videosError) throw videosError;

      // Transform data to match Level type
      const transformedLevels: Level[] = (levelsData || []).map((level) => {
        const levelSections = (sectionsData || []).filter(s => s.level_id === level.id);
        const levelVideos = (videosData || []).filter(v => v.level_id === level.id);

        // Group videos by section, or create a default "Alle Videos" section
        const sections: Section[] = levelSections.length > 0
          ? levelSections.map((section) => ({
              id: section.id,
              title: section.title,
              videos: levelVideos
                .filter(v => v.section_id === section.id)
                .map((video) => ({
                  id: video.id,
                  title: video.title,
                  thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
                  duration: video.duration_seconds || 0,
                  vimeoId: video.vimeo_video_id,
                  completions: 0, // TODO: Fetch from video_completions
                })),
            }))
          : [{
              id: `${level.id}-default`,
              title: 'Alle Videos',
              videos: levelVideos.map((video) => ({
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
                duration: video.duration_seconds || 0,
                vimeoId: video.vimeo_video_id,
                completions: 0,
              })),
            }];

        return {
          id: level.id,
          title: level.title,
          showcaseId: level.vimeo_showcase_id,
          totalStars: 0, // TODO: Calculate from completions
          sections,
        };
      });

      setLevels(transformedLevels);
      if (transformedLevels.length > 0 && !activeLevel) {
        setActiveLevel(transformedLevels[0].id);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const currentLevel = levels.find(l => l.id === activeLevel);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
        <p className="text-muted-foreground mb-4">Keine Levels verfügbar.</p>
        <p className="text-sm text-muted-foreground">
          Importiere zuerst Showcases im Admin-Bereich.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <LevelSidebar
        levels={levels}
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
                  <Button variant="outline" className="gap-2" onClick={fetchLevels}>
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
