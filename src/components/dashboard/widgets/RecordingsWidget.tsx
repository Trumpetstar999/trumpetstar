import { useRecordings } from '@/hooks/useRecordings';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';
import { Video, Plus, Eye, Mic } from 'lucide-react';

export function RecordingsWidget() {
  const { recordings, loading } = useRecordings();
  const { navigateToTab } = useTabNavigation();

  const latestRecording = recordings[0];
  const recordingsCount = recordings.length;

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
          <div className="relative aspect-video rounded-xl overflow-hidden bg-white/10 mb-2">
            {/* Thumbnail placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-6 h-6 text-white/70" />
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
              {formatDuration(latestRecording.duration)}
            </div>
          </div>
          <p className="text-white text-sm truncate">{latestRecording.title}</p>
          <p className="text-white/70 text-xs">{formatDate(latestRecording.createdAt)}</p>
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white/50" />
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
