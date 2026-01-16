import { useState, useEffect } from 'react';
import { LevelSidebar } from '@/components/levels/LevelSidebar';
import { SectionRow } from '@/components/levels/SectionRow';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { Video, Level, Section } from '@/types';
import { PlanKey } from '@/types/plans';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useMembership } from '@/hooks/useMembership';

interface LevelsPageProps {
  onStarEarned: () => void;
}

// Extended Level type with new plan key
interface LevelWithPlan extends Omit<Level, 'requiredPlan'> {
  requiredPlanKey: PlanKey;
}

export function LevelsPage({ onStarEarned }: LevelsPageProps) {
  const [levels, setLevels] = useState<LevelWithPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { setIsVideoPlaying } = useVideoPlayer();
  const { canAccessLevel } = useMembership();

  // Update video playing state when video is selected/closed
  useEffect(() => {
    setIsVideoPlaying(selectedVideo !== null);
  }, [selectedVideo, setIsVideoPlaying]);
  
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
      const transformedLevels: LevelWithPlan[] = (levelsData || []).map((level) => {
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
                  vimeoPlayerUrl: video.vimeo_player_url || undefined,
                  completions: 0,
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
                vimeoPlayerUrl: video.vimeo_player_url || undefined,
                completions: 0,
              })),
            }];

        // Use new required_plan_key field, fallback to mapping from old field
        const requiredPlanKey: PlanKey = 
          (level.required_plan_key as PlanKey) || 
          (level.required_plan === 'PLAN_A' ? 'BASIC' : 
           level.required_plan === 'PLAN_B' ? 'PREMIUM' : 'FREE');

        return {
          id: level.id,
          title: level.title,
          showcaseId: level.vimeo_showcase_id,
          totalStars: 0,
          sections,
          requiredPlanKey,
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
  const videoCount = currentLevel?.sections.reduce((acc, s) => acc + s.videos.length, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <p className="text-white/70">Lade Levels...</p>
        </div>
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
        <div className="glass-strong rounded-lg p-8 max-w-md">
          <p className="text-white mb-4">Keine Levels verfügbar.</p>
          <p className="text-sm text-white/60">
            Importiere zuerst Showcases im Admin-Bereich.
          </p>
        </div>
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
      <div className="flex-1 overflow-y-auto relative">
        {currentLevel && (
          <>
            {/* Lock Overlay if user can't access */}
            {currentLevel.requiredPlanKey && currentLevel.requiredPlanKey !== 'FREE' && !canAccessLevel(currentLevel.requiredPlanKey) && (
              <PremiumLockOverlay 
                requiredPlanKey={currentLevel.requiredPlanKey} 
                title={currentLevel.title} 
              />
            )}
            
            {/* Sections - 3 column grid for iPad Landscape */}
            <div className="p-6">
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
