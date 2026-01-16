import { Video } from '@/types';
import { VideoCard } from './VideoCard';
import { Search, X, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
  video: Video;
  levelTitle: string;
  sectionTitle: string;
  levelId: string;
}

interface VideoSearchResultsProps {
  results: SearchResult[];
  query: string;
  onVideoClick: (video: Video) => void;
  onClearSearch: () => void;
}

export function VideoSearchResults({ results, query, onVideoClick, onClearSearch }: VideoSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-white/50" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Keine Videos gefunden</h3>
        <p className="text-white/60 mb-6 max-w-sm">
          Keine Videos für "{query}" gefunden. Versuche einen anderen Suchbegriff.
        </p>
        <Button 
          onClick={onClearSearch}
          variant="outline"
          className="gap-2 rounded-xl border-white/20 text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
          Suche zurücksetzen
        </Button>
      </div>
    );
  }

  // Group results by level
  const groupedResults = results.reduce<Record<string, { levelTitle: string; videos: SearchResult[] }>>((acc, result) => {
    if (!acc[result.levelId]) {
      acc[result.levelId] = {
        levelTitle: result.levelTitle,
        videos: [],
      };
    }
    acc[result.levelId].videos.push(result);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {results.length} {results.length === 1 ? 'Video' : 'Videos'} gefunden
            </h2>
            <p className="text-sm text-white/60">Suchergebnisse für "{query}"</p>
          </div>
        </div>
        <Button 
          onClick={onClearSearch}
          variant="ghost"
          size="sm"
          className="gap-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <X className="w-4 h-4" />
          Zurücksetzen
        </Button>
      </div>

      {/* Results grouped by level */}
      <div className="space-y-8">
        {Object.entries(groupedResults).map(([levelId, { levelTitle, videos }]) => (
          <div key={levelId}>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              {levelTitle} ({videos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map(({ video, sectionTitle }) => (
                <div key={video.id} className="relative group">
                  <VideoCard
                    video={video}
                    onClick={() => onVideoClick(video)}
                  />
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-block px-2 py-1 rounded-md bg-black/70 text-white/80 text-xs truncate max-w-full">
                      {sectionTitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
