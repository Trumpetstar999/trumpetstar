import { useState, useRef, useEffect } from 'react';
import { VideoChat, useChatMessages } from '@/hooks/useVideoChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatVideoPanelProps {
  chat: VideoChat;
  onTimeUpdate: (time: number) => void;
  currentTime: number;
}

export function ChatVideoPanel({ chat, onTimeUpdate, currentTime }: ChatVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { messages } = useChatMessages(chat.id);
  const [pingTime, setPingTime] = useState<number | null>(null);

  // Get markers from messages
  const markers = messages.filter(m => m.message_type === 'marker' && m.timestamp_seconds !== null);

  // Fetch video URL
  useEffect(() => {
    async function fetchVideoUrl() {
      if (!chat.reference_video?.storage_path) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from('recordings')
          .createSignedUrl(chat.reference_video.storage_path, 3600);

        if (error) throw error;
        setVideoUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError('Video konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    fetchVideoUrl();
  }, [chat.reference_video?.storage_path]);

  // Sync video time with external changes
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 1) {
      videoRef.current.currentTime = currentTime;
      // Show ping animation
      setPingTime(currentTime);
      setTimeout(() => setPingTime(null), 500);
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const seekToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      onTimeUpdate(seconds);
      // Show ping animation
      setPingTime(seconds);
      setTimeout(() => setPingTime(null), 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    return videoRef.current?.currentTime || 0;
  };

  if (!chat.reference_video) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <Video className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Kein Video verknüpft</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Context bar */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {chat.reference_video.title || 'Video'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              const time = getCurrentTime();
              // This will be handled by the message panel
              window.dispatchEvent(new CustomEvent('add-marker', { detail: { time } }));
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            Marker setzen
          </Button>
        </div>
      </div>

      {/* Video player */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
        
        {error && (
          <div className="text-center text-white p-4">
            <p>{error}</p>
          </div>
        )}

        {/* Ping animation */}
        {pingTime !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-24 h-24 rounded-full bg-primary/30 animate-ping" />
          </div>
        )}

        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>

      {/* Marker bar */}
      {markers.length > 0 && (
        <div className="border-t border-border p-2 bg-muted/20">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  onClick={() => seekToTime(marker.timestamp_seconds!)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium',
                    'bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30',
                    'hover:bg-[#FFCC00]/30 transition-colors',
                    'flex items-center gap-1.5'
                  )}
                >
                  <span className="font-mono">{formatTime(marker.timestamp_seconds!)}</span>
                  {marker.content && (
                    <span className="max-w-[120px] truncate">{marker.content}</span>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
