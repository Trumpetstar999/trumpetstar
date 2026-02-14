import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, X, Music, Film, Search, GripVertical } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  level_title: string;
  duration_seconds: number | null;
}

interface SelectedItem {
  type: 'vimeo_video';
  ref_id: string;
  title: string;
  thumbnail_url: string | null;
}

interface CreateSessionChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (session: { name: string; items: SelectedItem[] }) => void;
  sending?: boolean;
}

export function CreateSessionChatDialog({ open, onOpenChange, onSend, sending }: CreateSessionChatDialogProps) {
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setSelectedItems([]);
    setSearch('');
    loadVideos();
  }, [open]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data: levels } = await supabase
        .from('levels')
        .select('id, title')
        .eq('is_active', true)
        .order('sort_order');

      const { data: vids } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, level_id, duration_seconds')
        .eq('is_active', true)
        .order('sort_order');

      if (vids && levels) {
        const levelMap = Object.fromEntries(levels.map(l => [l.id, l.title]));
        setVideos(vids.map(v => ({
          ...v,
          level_title: levelMap[v.level_id] || '',
        })));
      }
    } finally {
      setLoadingVideos(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.title.toLowerCase().includes(q) || v.level_title.toLowerCase().includes(q);
  });

  const addItem = (video: VideoItem) => {
    if (selectedItems.some(i => i.ref_id === video.id)) return;
    setSelectedItems(prev => [...prev, {
      type: 'vimeo_video',
      ref_id: video.id,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
    }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!name.trim() || selectedItems.length === 0) return;
    onSend({ name: name.trim(), items: selectedItems });
  };

  const canSend = name.trim().length > 0 && selectedItems.length > 0 && !sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#25D366]" />
            Übesession erstellen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Session Name */}
          <Input
            placeholder="Name der Übesession..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="font-medium"
          />

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Ausgewählt ({selectedItems.length})
              </p>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.ref_id}-${index}`}
                    className="flex items-center gap-2 bg-[#DCF8C6] rounded-lg px-3 py-1.5 text-sm"
                  >
                    <GripVertical className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate flex-1 text-[#111B21]">{item.title}</span>
                    <button
                      onClick={() => removeItem(index)}
                      className="shrink-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Videos durchsuchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Video Library */}
          <ScrollArea className="flex-1 min-h-0 max-h-[250px] border rounded-lg">
            {loadingVideos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredVideos.map(video => {
                  const isSelected = selectedItems.some(i => i.ref_id === video.id);
                  return (
                    <button
                      key={video.id}
                      onClick={() => addItem(video)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-[#DCF8C6]/50 opacity-60'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-12 h-8 rounded bg-gray-200 overflow-hidden shrink-0">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{video.title}</p>
                        <p className="text-[11px] text-muted-foreground">{video.level_title}</p>
                      </div>
                      {!isSelected && (
                        <Plus className="w-4 h-4 text-[#25D366] shrink-0" />
                      )}
                      {isSelected && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">✓</Badge>
                      )}
                    </button>
                  );
                })}
                {filteredVideos.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Keine Videos gefunden</p>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full bg-[#25D366] hover:bg-[#1DAF5A] text-white"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Music className="w-4 h-4 mr-2" />
            )}
            Session senden ({selectedItems.length} Videos)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
