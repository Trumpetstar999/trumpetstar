import { Play, Star, Clock } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-[280px] rounded-xl overflow-hidden bg-card hover-lift focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
          </div>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-sm">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(video.duration)}
        </div>
        
        {/* Stars earned */}
        {video.completions > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gold/90 text-gold-foreground text-sm font-medium">
            <Star className="w-4 h-4 fill-current" />
            {video.completions}
          </div>
        )}
      </div>
      
      {/* Title */}
      <div className="p-4">
        <h3 className="text-base font-medium text-card-foreground text-left line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
      </div>
    </button>
  );
}
