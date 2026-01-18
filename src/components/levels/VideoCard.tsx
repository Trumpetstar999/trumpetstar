import { Play, Star, Clock } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  index?: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoCard({ video, onClick, index = 0 }: VideoCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-lg overflow-hidden card-glass focus:outline-none focus:ring-2 focus:ring-reward-gold focus:ring-offset-2 focus:ring-offset-transparent opacity-0 animate-fade-in hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
      style={{ 
        animationDelay: `${index * 60}ms`, 
        animationFillMode: 'forwards' 
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Play button - Hero style with gold ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="play-button-hero scale-90 opacity-80 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium transition-transform duration-300 group-hover:scale-105">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(video.duration)}
        </div>
        
        {/* Stars earned */}
        {video.completions > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-reward-gold text-black text-sm font-bold animate-bounce-gentle">
            <Star className="w-4 h-4 fill-current" />
            {video.completions}
          </div>
        )}
      </div>
      
      {/* Title */}
      <div className="p-4 bg-white">
        <h3 className="text-base font-medium text-gray-900 text-left line-clamp-2 group-hover:text-brand-blue-mid transition-colors duration-200">
          {video.title}
        </h3>
      </div>
    </button>
  );
}
