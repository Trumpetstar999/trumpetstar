import { useState, useEffect, useMemo } from 'react';
import { LevelSidebar } from '@/components/levels/LevelSidebar';
import { SectionRow } from '@/components/levels/SectionRow';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { VideoCard } from '@/components/levels/VideoCard';
import { Level, Section } from '@/types';
import { PlanKey } from '@/types/plans';
import { Loader2, Search, X, Film, Clock, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useMembership } from '@/hooks/useMembership';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, useLocalizedContent, Language } from '@/hooks/useLanguage';
import { LanguageTabs } from '@/components/common/LanguageTabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LevelsPageProps {
  onStarEarned: () => void;
}

type Difficulty = 'basics' | 'beginner' | 'easy' | 'medium' | 'advanced';

// Extended Level type with new plan key and difficulty
interface LevelWithPlan extends Omit<Level, 'requiredPlan'> {
  requiredPlanKey: PlanKey;
  difficulty?: Difficulty;
}

// Extended Video type with localization fields
interface LocalizedVideo {
  id: string;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  thumbnail: string;
  duration: number;
  vimeoId: string;
  vimeoPlayerUrl?: string;
  completions: number;
}

interface RecentVideo extends LocalizedVideo {
  watchedAt: string;
  levelTitle: string;
}

interface LocalizedSection {
  id: string;
  title: string;
  videos: LocalizedVideo[];
}

interface LocalizedLevel extends Omit<Level, 'sections'> {
  requiredPlanKey: PlanKey;
  difficulty?: Difficulty;
  sections: LocalizedSection[];
}

interface SelectedVideo {
  video: LocalizedVideo;
  levelId?: string;
  levelTitle?: string;
}

export function LevelsPage({ onStarEarned }: LevelsPageProps) {
  const [levels, setLevels] = useState<LocalizedLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>('recent'); // Default to 'recent'
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [contentLanguage, setContentLanguage] = useState<Language>('de');
  const { setIsVideoPlaying } = useVideoPlayer();
  const { canAccessLevel } = useMembership();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { getLocalizedField } = useLocalizedContent();

  // Difficulty options with translations
  const DIFFICULTY_OPTIONS: { value: Difficulty | 'all'; label: string }[] = [
    { value: 'all', label: t('levels.difficulty.all') },
    { value: 'basics', label: t('levels.difficulty.basics') },
    { value: 'beginner', label: t('levels.difficulty.beginner') },
    { value: 'easy', label: t('levels.difficulty.easy') },
    { value: 'medium', label: t('levels.difficulty.medium') },
    { value: 'advanced', label: t('levels.difficulty.advanced') },
  ];

  // Update video playing state when video is selected/closed
  useEffect(() => {
    setIsVideoPlaying(selectedVideo !== null);
  }, [selectedVideo, setIsVideoPlaying]);
  
  useEffect(() => {
    fetchLevels();
  }, []);

  // Fetch recent videos when user is available - no dependency on levels
  useEffect(() => {
    if (user) {
      fetchRecentVideos();
    }
  }, [user]);

  async function fetchRecentVideos() {
    if (!user) {
      console.log('[RecentVideos] No user, skipping fetch');
      return;
    }
    
    console.log('[RecentVideos] Fetching for user:', user.id);
    
    try {
      // Get recently watched videos from progress table (includes partially watched)
      const { data: progressData, error: progressError } = await supabase
        .from('user_video_progress')
        .select('video_id, updated_at, progress_percent')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      console.log('[RecentVideos] Progress data:', progressData, 'Error:', progressError);

      if (progressError) throw progressError;
      if (!progressData || progressData.length === 0) {
        console.log('[RecentVideos] No progress data found, setting empty array');
        setRecentVideos([]);
        return;
      }

      // Fetch video details directly from database for the watched video IDs
      const videoIds = progressData.map(p => p.video_id);
      console.log('[RecentVideos] Fetching videos for IDs:', videoIds);
      
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*, levels!inner(title)')
        .in('id', videoIds)
        .eq('is_active', true);

      console.log('[RecentVideos] Videos data:', videosData, 'Error:', videosError);

      if (videosError) throw videosError;

      // Map progress data to videos with level info
      const recentVids: RecentVideo[] = [];
      progressData.forEach(progress => {
        const video = videosData?.find(v => v.id === progress.video_id);
        console.log('[RecentVideos] Mapping progress:', progress.video_id, 'Found video:', !!video);
        if (video) {
          recentVids.push({
            id: video.id,
            title: video.title,
            title_en: video.title_en,
            title_es: video.title_es,
            thumbnail: video.thumbnail_url || 'https://images.unsplash.com/video-thumbnail.jpg',
            duration: video.duration_seconds || 0,
            vimeoId: video.vimeo_video_id,
            vimeoPlayerUrl: video.vimeo_player_url || undefined,
            completions: 0,
            watchedAt: progress.updated_at,
            levelTitle: (video.levels as any)?.title || 'Unbekannt',
          });
        }
      });

      console.log('[RecentVideos] Final recentVids:', recentVids.length, recentVids);
      setRecentVideos(recentVids.slice(0, 12)); // Max 12 recent videos
    } catch (error) {
      console.error('[RecentVideos] Error fetching recent videos:', error);
    }
  }

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

      // Transform data to match LocalizedLevel type
      const transformedLevels: LocalizedLevel[] = (levelsData || []).map((level) => {
        const levelSections = (sectionsData || []).filter(s => s.level_id === level.id);
        const levelVideos = (videosData || []).filter(v => v.level_id === level.id);

        // Helper to map video data with localized fields
        const mapVideo = (video: any): LocalizedVideo => ({
          id: video.id,
          title: video.title,
          title_en: video.title_en,
          title_es: video.title_es,
          thumbnail: video.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=225&fit=crop',
          duration: video.duration_seconds || 0,
          vimeoId: video.vimeo_video_id,
          vimeoPlayerUrl: video.vimeo_player_url || undefined,
          completions: 0,
        });

        // Group videos by section, or create a default "Alle Videos" section
        const sections: LocalizedSection[] = levelSections.length > 0
          ? levelSections.map((section) => ({
              id: section.id,
              title: section.title,
              videos: levelVideos
                .filter(v => v.section_id === section.id)
                .map(mapVideo),
            }))
          : [{
              id: `${level.id}-default`,
              title: 'Alle Videos',
              videos: levelVideos.map(mapVideo),
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
          difficulty: (level.difficulty as Difficulty) || 'beginner',
        };
      });

      setLevels(transformedLevels);
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Search through all videos across all levels
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const results: { video: LocalizedVideo; levelTitle: string; sectionTitle: string; levelId: string }[] = [];
    
    levels.forEach(level => {
      level.sections.forEach(section => {
        section.videos.forEach(video => {
          if (video.title.toLowerCase().includes(query)) {
            results.push({
              video,
              levelTitle: level.title,
              sectionTitle: section.title,
              levelId: level.id,
            });
          }
        });
      });
    });
    
    return results;
  }, [searchQuery, levels]);

  // Filter levels by difficulty and content language
  const filteredLevels = useMemo(() => {
    let filtered = levels;
    
    // Filter by content language
    if (contentLanguage !== 'de') {
      // When filtering for EN/ES, only show levels tagged with that language or 'all'
      filtered = filtered.filter(l => {
        // For now show all levels since we don't have separate showcases yet
        // This will be enhanced when content is added per language
        return true;
      });
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(l => l.difficulty === difficultyFilter);
    }
    
    return filtered;
  }, [levels, difficultyFilter, contentLanguage]);

  const currentLevel = filteredLevels.find(l => l.id === activeLevel) || (filteredLevels.length > 0 ? filteredLevels[0] : null);
  const isSearching = searchQuery.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <p className="text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
        <div className="glass-strong rounded-lg p-8 max-w-md">
          <p className="text-white mb-4">{t('levels.noLevels')}</p>
          <p className="text-sm text-white/60">
            {t('levels.importShowcases')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 animate-fade-in flex-wrap">
        <h2 className="text-lg font-semibold text-white shrink-0">{t('levels.title')}</h2>
        
        {/* Language Tabs */}
        <LanguageTabs
          selectedLanguage={contentLanguage}
          onLanguageChange={setContentLanguage}
          variant="compact"
        />
        
        {/* Difficulty Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/50" />
          <Select
            value={difficultyFilter}
            onValueChange={(value) => setDifficultyFilter(value as Difficulty | 'all')}
          >
            <SelectTrigger className="w-36 h-9 bg-white/10 border-white/20 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search Field - compact */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder={t('levels.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-8 bg-white/10 border-white/20 text-white text-sm placeholder:text-white/40 rounded-lg focus:bg-white/15 focus:border-white/30 transition-all duration-200"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search results count */}
        {isSearching && (
          <span className="text-sm text-white/60 animate-fade-in">
            {t('common.resultsCount', { count: searchResults.length })}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden when searching */}
        {!isSearching && (
          <LevelSidebar
            levels={filteredLevels}
            activeLevel={activeLevel}
            onLevelSelect={setActiveLevel}
          />
        )}
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto relative">
          {isSearching ? (
            /* Search Results - Grid Layout */
            <div className="p-6">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-white/40" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">Keine Videos gefunden</h3>
                  <p className="text-sm text-white/50 mb-4">
                    Versuche einen anderen Suchbegriff
                  </p>
                  <Button 
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Suche zurücksetzen
                  </Button>
                </div>
              ) : (
                <>
                  {/* Group results by level */}
                  {Object.entries(
                    searchResults.reduce<Record<string, { levelTitle: string; videos: typeof searchResults }>>((acc, result) => {
                      if (!acc[result.levelId]) {
                        acc[result.levelId] = { levelTitle: result.levelTitle, videos: [] };
                      }
                      acc[result.levelId].videos.push(result);
                      return acc;
                    }, {})
                  ).map(([levelId, { levelTitle, videos }]) => (
                    <div key={levelId} className="mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                      <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3 px-1">
                        {levelTitle}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map(({ video, levelId, levelTitle }, videoIndex) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onClick={() => setSelectedVideo({ video, levelId, levelTitle })}
                            index={videoIndex}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : activeLevel === 'recent' ? (
            /* Recent Videos View */
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center animate-float">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Zuletzt angesehen</h3>
                  <p className="text-sm text-white/60">Deine kürzlich geschauten Videos</p>
                </div>
              </div>
              
              {recentVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4 animate-float">
                    <Film className="w-7 h-7 text-white/40" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">Noch keine Videos angesehen</h3>
                  <p className="text-sm text-white/50 mb-4">
                    Wähle ein Level aus und starte mit dem Lernen
                  </p>
                  <Button 
                    onClick={() => levels.length > 0 && setActiveLevel(levels[0].id)}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 gap-2 hover:scale-105 transition-all duration-200"
                  >
                    Zum ersten Level
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recentVideos.map((video, index) => (
                    <div 
                      key={`${video.id}-${video.watchedAt}`} 
                      className="relative opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                    >
                      <VideoCard
                        video={video}
                        onClick={() => setSelectedVideo({ video, levelTitle: video.levelTitle })}
                        index={0}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-xs text-white/80 backdrop-blur-sm">
                        {video.levelTitle}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentLevel && (
            <>
              {/* Lock Overlay if user can't access */}
              {currentLevel.requiredPlanKey && currentLevel.requiredPlanKey !== 'FREE' && !canAccessLevel(currentLevel.requiredPlanKey) && (
                <PremiumLockOverlay 
                  requiredPlanKey={currentLevel.requiredPlanKey} 
                  title={currentLevel.title} 
                />
              )}
              
              {/* Sections */}
              <div className="p-6">
                {currentLevel.sections.map((section, sectionIndex) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    onVideoClick={(video) => setSelectedVideo({ 
                      video, 
                      levelId: currentLevel.id, 
                      levelTitle: currentLevel.title 
                    })}
                    sectionIndex={sectionIndex}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Video Player Overlay */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo.video}
          levelId={selectedVideo.levelId}
          levelTitle={selectedVideo.levelTitle}
          onClose={() => setSelectedVideo(null)}
          onComplete={onStarEarned}
        />
      )}
    </div>
  );
}
