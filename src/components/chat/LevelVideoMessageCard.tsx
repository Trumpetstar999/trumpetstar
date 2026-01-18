import { useState } from 'react';
import { Play, Film } from 'lucide-react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Video } from '@/types';

interface LevelVideoData {
  type: 'level_video';
  id: string;
  title: string;
  thumbnail: string | null;
  levelTitle: string;
  vimeoId: string;
}

interface LevelVideoMessageCardProps {
  data: LevelVideoData;
}

export function LevelVideoMessageCard({ data }: LevelVideoMessageCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  // Convert to Video type for VideoPlayer
  const videoForPlayer: Video = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail || '',
    duration: 0,
    vimeoId: data.vimeoId,
    completions: 0,
  };

  const handleClick = () => {
    setShowPlayer(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full text-left block group"
      >
        {/* Thumbnail with play overlay */}
        <div className="relative w-[260px] h-[146px] bg-black rounded-t overflow-hidden">
          {data.thumbnail ? (
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <Film className="w-12 h-12 text-white/50" />
            </div>
          )}
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-purple-600 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Level badge */}
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded">
            {data.levelTitle}
          </div>
        </div>

        {/* Title area */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-b">
          <p className="text-[13px] font-medium truncate">{data.title}</p>
          <p className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5">
            <Film className="w-3 h-3" />
            Video ansehen
          </p>
        </div>
      </button>

      {/* Fullscreen Video Player */}
      {showPlayer && (
        <VideoPlayer
          video={videoForPlayer}
          onClose={() => setShowPlayer(false)}
          onComplete={() => {}}
        />
      )}
    </>
  );
}

// Helper to check if content is a level video JSON
export function isLevelVideoContent(content: string): LevelVideoData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === 'level_video' && parsed.id) {
      return parsed as LevelVideoData;
    }
  } catch {
    // Not JSON, just regular text
  }
  return null;
}
