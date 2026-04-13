import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoResult {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  level_title: string;
  level_id: string;
}

interface PlaylistVideoSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVideoIds: string[];
  onAddVideo: (videoId: string) => Promise<boolean>;
}

export function PlaylistVideoSearch({ open, onOpenChange, existingVideoIds, onAddVideo }: PlaylistVideoSearchProps) {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [levels, setLevels] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchLevels();
    fetchVideos();
  }, [open]);

  async function fetchLevels() {
    const { data } = await supabase
      .from('levels')
      .select('id, title')
      .eq('is_active', true)
      .order('sort_order');
    setLevels(data || []);
  }

  async function fetchVideos() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, thumbnail_url, duration_seconds, level_id, levels!inner(title)')
      .eq('is_active', true)
      .order('title');

    if (!error && data) {
      setVideos(data.map((v: any) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        duration_seconds: v.duration_seconds || 0,
        level_title: v.levels?.title || '',
        level_id: v.level_id,
      })));
    }
    setIsLoading(false);
  }

  const filtered = useMemo(() => {
    let result = videos;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(q));
    }
    if (levelFilter !== 'all') {
      result = result.filter(v => v.level_id === levelFilter);
    }
    return result.slice(0, 50);
  }, [videos, query, levelFilter]);

  const handleAdd = async (videoId: string) => {
    setAddingId(videoId);
    await onAddVideo(videoId);
    setAddingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Video hinzufügen</DialogTitle>
          <DialogDescription>Suche nach Videos für deine Playlist</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Titel suchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-background border-border"
              autoFocus
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40 bg-background border-border">
              <SelectValue placeholder="Alle Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Levels</SelectItem>
              {levels.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Videos gefunden</p>
          ) : (
            filtered.map(video => {
              const isAdded = existingVideoIds.includes(video.id);
              return (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <img
                    src={video.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=80&h=45&fit=crop'}
                    alt={video.title}
                    className="w-16 h-9 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.level_title}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'ghost' : 'default'}
                    disabled={isAdded || addingId === video.id}
                    onClick={() => handleAdd(video.id)}
                    className="flex-shrink-0 gap-1"
                  >
                    {isAdded ? (
                      <><Check className="w-3.5 h-3.5" /> Drin</>
                    ) : addingId === video.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Hinzufügen</>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
