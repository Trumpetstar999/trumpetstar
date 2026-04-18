import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import type { Video } from '@/types';

interface VideoContent {
  type: 'video';
  video: Video;
  levelId?: string;
  levelTitle?: string;
}

interface AudioContent {
  type: 'audio';
  url: string;
  title: string;
}

type Content = VideoContent | AudioContent;

export default function QRRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(`/auth?redirect=/qr/${code}`, { replace: true });
      return;
    }

    if (!code) {
      setError('Kein QR-Code angegeben.');
      return;
    }

    (async () => {
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Ungültiger oder inaktiver QR-Code.');
        return;
      }

      if (data.content_type === 'video' && data.video_id) {
        const { data: video } = await supabase
          .from('videos')
          .select('id, title, thumbnail_url, duration_seconds, vimeo_video_id, vimeo_player_url, level_id')
          .eq('id', data.video_id)
          .single();

        if (video?.vimeo_video_id) {
          let levelTitle: string | undefined;
          if (video.level_id) {
            const { data: lvl } = await supabase
              .from('levels')
              .select('title')
              .eq('id', video.level_id)
              .maybeSingle();
            levelTitle = lvl?.title ?? undefined;
          }
          setContent({
            type: 'video',
            video: {
              id: video.id,
              title: video.title,
              thumbnail: video.thumbnail_url || '',
              duration: video.duration_seconds || 0,
              vimeoId: video.vimeo_video_id,
              vimeoPlayerUrl: video.vimeo_player_url || undefined,
              completions: 0,
            },
            levelId: video.level_id || undefined,
            levelTitle,
          });
        } else {
          setError('Video nicht gefunden.');
        }
      } else if (data.content_type === 'audio' && data.audio_id) {
        const { data: audio } = await supabase
          .from('audio_files')
          .select('storage_url, display_name')
          .eq('id', data.audio_id)
          .single();

        if (audio?.storage_url) {
          setContent({
            type: 'audio',
            url: audio.storage_url,
            title: audio.display_name,
          });
        } else {
          setError('Audio nicht gefunden.');
        }
      } else {
        setError('Kein Inhalt verknüpft.');
      }
    })();
  }, [user, authLoading, code, navigate]);

  // Try to autoplay audio after content loads (may be blocked by browser)
  useEffect(() => {
    if (content?.type === 'audio' && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked — user must press play
          setIsPlaying(false);
        });
    }
  }, [content]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <p className="text-lg text-destructive font-medium">{error}</p>
          <Button onClick={() => navigate('/app')} variant="outline">
            Zur App
          </Button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (content.type === 'video') {
    // Vimeo iframe with autoplay + fullscreen — counted as user gesture from QR-link click
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <div className="flex items-center justify-between p-3 bg-black/80 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zur App
          </Button>
          <h1 className="text-sm font-medium truncate max-w-[60%]">{content.title}</h1>
          <div className="w-24" />
        </div>
        <div className="flex-1 relative">
          <iframe
            src={`https://player.vimeo.com/video/${content.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={content.title}
          />
        </div>
      </div>
    );
  }

  // Audio
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
          </button>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{content.title}</h1>
          <p className="text-sm text-slate-500 mt-1">QR-Code: {code}</p>
        </div>
        <audio
          ref={audioRef}
          src={content.url}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="w-full"
        />
        <Button variant="outline" onClick={() => navigate('/app')} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur App
        </Button>
      </div>
    </div>
  );
}
