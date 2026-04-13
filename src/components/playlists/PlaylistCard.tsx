import { ListMusic, Play, ChevronRight } from 'lucide-react';
import { PlaylistWithItems } from '@/hooks/usePlaylists';
import { Progress } from '@/components/ui/progress';

interface PlaylistCardProps {
  playlist: PlaylistWithItems;
  completedVideoIds: string[];
  onEdit: () => void;
  onStart: () => void;
}

export function PlaylistCard({ playlist, completedVideoIds, onEdit, onStart }: PlaylistCardProps) {
  const totalVideos = playlist.items.length;
  const completedCount = playlist.items.filter(i => completedVideoIds.includes(i.video_id)).length;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  return (
    <div className="group relative rounded-xl bg-card/80 border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <button onClick={onEdit} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ListMusic className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-card-foreground truncate">{playlist.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalVideos} {totalVideos === 1 ? 'Video' : 'Videos'}
              {completedCount > 0 && ` · ${completedCount} erledigt`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
        </div>

        {totalVideos > 0 && (
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1.5 bg-muted" />
            <p className="text-[11px] text-muted-foreground mt-1">{progressPercent}% abgeschlossen</p>
          </div>
        )}
      </button>

      {totalVideos > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <Play className="w-4 h-4" />
            Üben starten
          </button>
        </div>
      )}
    </div>
  );
}
