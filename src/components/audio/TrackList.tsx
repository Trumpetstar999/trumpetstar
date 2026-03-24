import { Music2 } from 'lucide-react';
import { formatTime } from '@/lib/formatTime';

interface Track {
  id: string;
  display_name: string;
  storage_url: string;
  duration_seconds?: number;
  position?: number;
}

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string | null;
  onTrackSelect: (track: Track) => void;
  isLoading?: boolean;
}

export function TrackList({ tracks, currentTrackId, onTrackSelect, isLoading }: TrackListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="track-item animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-secondary-white">
        <Music2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center">Keine Tracks in diesem Level</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tracks.map((track, index) => (
        <button
          key={track.id}
          onClick={() => onTrackSelect(track)}
          className={`track-item text-left ${currentTrackId === track.id ? 'track-item-active' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              currentTrackId === track.id ? 'bg-primary' : 'bg-muted'
            }`}>
              <span className="text-sm font-bold">
                {(track.position ?? index) + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.display_name}</p>
              {track.duration_seconds && (
                <p className="text-sm text-secondary-white">{formatTime(track.duration_seconds)}</p>
              )}
            </div>
            {currentTrackId === track.id && (
              <div className="flex gap-0.5">
                <div className="w-1 h-4 bg-accent rounded-full animate-pulse" />
                <div className="w-1 h-3 bg-accent rounded-full animate-pulse delay-75" />
                <div className="w-1 h-5 bg-accent rounded-full animate-pulse delay-150" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
