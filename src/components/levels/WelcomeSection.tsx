import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, useLocalizedContent } from '@/hooks/useLanguage';
import { Play, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeVideo {
  id: string;
  title: string;
  title_en: string | null;
  title_es: string | null;
  vimeo_video_id: string;
  vimeo_player_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  sort_order: number;
}

interface WelcomeProgress {
  welcome_video_id: string;
  watched: boolean;
}

export function WelcomeSection() {
  const [videos, setVideos] = useState<WelcomeVideo[]>([]);
  const [progress, setProgress] = useState<WelcomeProgress[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { getLocalizedField } = useLocalizedContent();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user]);

  async function fetchVideos() {
    const { data } = await supabase
      .from('welcome_videos')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (data && data.length > 0) {
      setVideos(data);
      setActiveVideoId(data[0].id);
    }
    setIsLoading(false);
  }

  async function fetchProgress() {
    if (!user) return;
    const { data } = await supabase
      .from('welcome_video_progress')
      .select('welcome_video_id, watched')
      .eq('user_id', user.id);
    if (data) setProgress(data);
  }

  async function markWatched(videoId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('welcome_video_progress')
      .upsert({
        user_id: user.id,
        welcome_video_id: videoId,
        watched: true,
        watched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,welcome_video_id' });
    if (!error) {
      setProgress(prev => {
        const existing = prev.find(p => p.welcome_video_id === videoId);
        if (existing) return prev.map(p => p.welcome_video_id === videoId ? { ...p, watched: true } : p);
        return [...prev, { welcome_video_id: videoId, watched: true }];
      });
    }
  }

  const isWatched = (videoId: string) => progress.some(p => p.welcome_video_id === videoId && p.watched);
  const allWatched = videos.length > 0 && videos.every(v => isWatched(v.id));
  const activeVideo = videos.find(v => v.id === activeVideoId);

  const getTitle = (video: WelcomeVideo) => {
    if (language === 'en' && video.title_en) return video.title_en;
    if (language === 'es' && video.title_es) return video.title_es;
    return video.title;
  };

  if (isLoading || videos.length === 0) return null;

  const welcomeTitle = language === 'en' ? 'How to learn successfully' : language === 'es' ? 'Cómo aprender con éxito' : 'So lernst du erfolgreich';
  const watchedLabel = language === 'en' ? 'Videos watched' : language === 'es' ? 'Videos vistos' : 'Videos angesehen';

  return (
    <div className="mx-4 mb-4 rounded-xl glass-strong overflow-hidden animate-fade-in" style={{ animationFillMode: 'forwards' }}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-base font-semibold text-white">{welcomeTitle}</h3>
        <div className="flex items-center gap-3">
          {allWatched && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {watchedLabel}
            </span>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronUp className="w-5 h-5 text-white/60" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="flex flex-col md:flex-row gap-0 border-t border-white/10">
          {/* Video list */}
          <div className="md:w-[280px] lg:w-[320px] flex-shrink-0 border-r border-white/10">
            <nav className="p-3 space-y-1">
              {videos.map((video, index) => {
                const active = video.id === activeVideoId;
                const watched = isWatched(video.id);
                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideoId(video.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                      active ? 'bg-white/15' : 'hover:bg-white/8'
                    )}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 text-xs font-bold',
                      watched ? 'bg-green-500/20 text-green-400' : active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                    )}>
                      {watched ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3 h-3" />}
                    </span>
                    <span className={cn(
                      'text-sm font-medium truncate',
                      active ? 'text-white' : 'text-white/80'
                    )}>
                      {`${index + 1}. ${getTitle(video)}`}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Watched checkbox */}
            <div className="px-4 pb-3 pt-1">
              <label className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer hover:text-white/90 transition-colors">
                <input
                  type="checkbox"
                  checked={allWatched}
                  readOnly
                  className="rounded border-white/30 bg-white/10 text-brand-blue-mid w-4 h-4"
                />
                {watchedLabel}
              </label>
            </div>
          </div>

          {/* Video player */}
          <div className="flex-1 p-4">
            {activeVideo && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={activeVideo.vimeo_player_url || `https://player.vimeo.com/video/${activeVideo.vimeo_video_id}?autoplay=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  onLoad={() => {
                    // Mark as watched when the video loads/plays
                    if (activeVideo) markWatched(activeVideo.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
