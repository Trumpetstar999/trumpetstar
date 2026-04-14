import { useState, useEffect, useCallback } from 'react';
import { X, SkipBack, SkipForward, CheckCircle2 } from 'lucide-react';
import { PlaylistWithItems } from '@/hooks/usePlaylists';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  vimeoId: string;
  vimeoPlayerUrl?: string;
  completions: number;
}

interface PlaylistPlayerOverlayProps {
  playlist: PlaylistWithItems;
  onClose: () => void;
  onStarEarned: () => void;
}

export function PlaylistPlayerOverlay({ playlist, onClose, onStarEarned }: PlaylistPlayerOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadVideos() {
      const videoIds = playlist.items.map(i => i.video_id);
      if (videoIds.length === 0) { onClose(); return; }

      const { data } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, duration_seconds, vimeo_video_id, vimeo_player_url')
        .in('id', videoIds);

      if (data) {
        // Maintain playlist order
        const ordered = playlist.items.map(item => {
          const v = data.find((d: any) => d.id === item.video_id);
          if (!v) return null;
          return {
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail_url || '',
            duration: v.duration_seconds || 0,
            vimeoId: v.vimeo_video_id,
            vimeoPlayerUrl: v.vimeo_player_url || undefined,
            completions: 0,
          } as VideoInfo;
        }).filter(Boolean) as VideoInfo[];
        setVideos(ordered);
      }
      setIsLoading(false);
    }
    loadVideos();
  }, [playlist]);

  const handleVideoComplete = useCallback(() => {
    onStarEarned();
  }, [onStarEarned]);

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentIndex, videos.length]);

  if (isLoading || videos.length === 0) return null;

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in">
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-white">Playlist abgeschlossen! 🎉</h2>
          <p className="text-white/60">{playlist.name} – alle {videos.length} Videos geschafft</p>
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
            Fertig
          </Button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];
  const progressPercent = ((currentIndex + 1) / videos.length) * 100;

  return (
    <div className="fixed inset-0 z-[200]" style={{ isolation: 'isolate' }}>
      {/* Progress bar top - must be above VideoPlayer z-[100] */}
      <div className="absolute top-0 left-0 right-0 z-[130] bg-black/80 backdrop-blur-sm px-4 py-2 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>{playlist.name}</span>
            <span>{currentIndex + 1} / {videos.length}</span>
          </div>
          <Progress value={progressPercent} className="h-1 bg-white/20" />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayer
        key={currentVideo.id}
        video={currentVideo}
        onClose={onClose}
        onComplete={handleVideoComplete}
      />
    </div>
  );
}
