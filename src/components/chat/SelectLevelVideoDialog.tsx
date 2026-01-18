import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Clock, Check, Search, X } from 'lucide-react';

interface LevelVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  vimeo_video_id: string;
  level_title: string;
}

interface SelectLevelVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (video: LevelVideo) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SelectLevelVideoDialog({ open, onOpenChange, onSelect }: SelectLevelVideoDialogProps) {
  const [videos, setVideos] = useState<LevelVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchVideos();
    }
  }, [open]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, duration_seconds, vimeo_video_id, levels!inner(title)')
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) throw error;

      const transformedVideos: LevelVideo[] = (data || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        duration_seconds: video.duration_seconds,
        vimeo_video_id: video.vimeo_video_id,
        level_title: video.levels?.title || 'Unbekannt',
      }));

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(query) ||
        video.level_title.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const handleConfirm = () => {
    const selected = videos.find((v) => v.id === selectedId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelectedId(null);
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedId(null);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Video aus Levels auswählen</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Video oder Level suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'Keine Videos gefunden' : 'Keine Videos vorhanden'}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground/70 mt-1">
                Versuche einen anderen Suchbegriff
              </p>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[400px] -mx-6 px-6">
              <div className="space-y-2 pb-4">
                {filteredVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedId(video.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedId === video.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Play className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate max-w-[150px]">{video.level_title}</span>
                        {video.duration_seconds && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDuration(video.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedId === video.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {filteredVideos.length} Video{filteredVideos.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Abbrechen
                </Button>
                <Button onClick={handleConfirm} disabled={!selectedId}>
                  Senden
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
