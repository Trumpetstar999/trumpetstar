import { useRecordings } from '@/hooks/useRecordings';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';
import { Video, Plus, Eye, Play } from 'lucide-react';
import { useRef, useEffect } from 'react';

export function RecordingsWidget() {
  const { recordings, loading } = useRecordings();
  const { navigateToTab } = useTabNavigation();
  const videoRef = useRef<HTMLVideoElement>(null);

  const latestRecording = recordings[0];
  const recordingsCount = recordings.length;

  // Pause video at a specific time to show as thumbnail
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !latestRecording?.url) return;

    const handleLoadedMetadata = () => {
      video.currentTime = 0.5; // Seek to 0.5 seconds for preview frame
    };

    const handleSeeked = () => {
      video.pause();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [latestRecording?.url]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Meine Aufnahmen</h3>
        </div>
        <span className="text-white/70 text-sm">{recordingsCount} Videos</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : latestRecording ? (
        <div className="mb-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 mb-3">
            {/* Video as thumbnail - paused at 0.5s */}
            <video
              ref={videoRef}
              src={latestRecording.url}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
              {formatDuration(latestRecording.duration)}
            </div>
          </div>
          {/* Text with better contrast */}
          <div className="bg-gray-800/60 rounded-lg px-3 py-2">
            <p className="text-white font-medium text-sm truncate">{latestRecording.title}</p>
            <p className="text-gray-300 text-xs">{formatDate(latestRecording.createdAt)}</p>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
            <Video className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-white/70 text-sm">Noch keine Aufnahmen</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => navigateToTab('recordings')}
          variant="ghost"
          size="sm"
          className="flex-1 text-white hover:text-white hover:bg-white/20 bg-white/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Aufnahme
        </Button>
        {recordingsCount > 0 && (
          <Button
            onClick={() => navigateToTab('recordings')}
            variant="ghost"
            size="sm"
            className="text-white hover:text-white hover:bg-white/20 bg-white/10"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
