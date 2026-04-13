import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Save, Play, Plus, Trash2, GripVertical,
  Video, Search, Music, Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface LibraryVideo {
  id: string;
  title: string;
  duration_seconds: number | null;
  level_id: string;
  thumbnail_url: string | null;
  sort_order: number;
}

interface LocalPlaylistItem {
  tempId: string;
  video_id: string;
  title: string;
  thumbnail?: string | null;
  duration?: number | null;
}

export default function PlaylistBuilderPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultLevelId = searchParams.get('levelId') || '';
  const { user } = useAuth();
  const { language } = useLanguage();
  const { playlists, createPlaylist, refreshPlaylists } = usePlaylists();

  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState(defaultLevelId);
  const [items, setItems] = useState<LocalPlaylistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(editId || null);

  // Language filter
  const langFilter = useMemo(() => {
    if (language === 'en') return 'en';
    if (language === 'es') return 'es';
    return 'de';
  }, [language]);

  // Load levels filtered by language
  const { data: levels = [] } = useQuery({
    queryKey: ['playlist-levels', langFilter],
    queryFn: async () => {
      const { data } = await supabase
        .from('levels')
        .select('id, title')
        .eq('is_active', true)
        .or(`language.eq.${langFilter},language.eq.all,language.is.null`)
        .order('sort_order');
      return data || [];
    },
  });

  // Load ALL videos for these levels
  const { data: allVideos = [] } = useQuery({
    queryKey: ['playlist-all-videos', levels.map(l => l.id).join(',')],
    queryFn: async (): Promise<LibraryVideo[]> => {
      const levelIds = levels.map(l => l.id);
      if (levelIds.length === 0) return [];
      const { data } = await supabase
        .from('videos')
        .select('id, title, duration_seconds, level_id, thumbnail_url, sort_order')
        .eq('is_active', true)
        .in('level_id', levelIds)
        .order('sort_order');
      return (data as LibraryVideo[]) || [];
    },
    enabled: levels.length > 0,
  });

  // Filter videos by selected level + search
  const filteredVideos = useMemo(() => {
    let vids = allVideos;
    if (selectedLevelId) {
      vids = vids.filter(v => v.level_id === selectedLevelId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      vids = vids.filter(v => v.title.toLowerCase().includes(q));
    }
    return vids;
  }, [allVideos, selectedLevelId, searchQuery]);

  // Load existing playlist for editing
  useEffect(() => {
    if (editId) {
      const existing = playlists.find(p => p.id === editId);
      if (existing) {
        setPlaylistName(existing.name);
        setDescription(existing.description || '');
        setSelectedLevelId(existing.level_id || '');
        setPlaylistId(existing.id);
        loadPlaylistItems(existing.items.map(i => i.video_id), existing.items);
      }
    }
  }, [editId, playlists]);

  async function loadPlaylistItems(videoIds: string[], orderedItems: { id: string; video_id: string; order_index: number }[]) {
    if (videoIds.length === 0) return;
    const { data } = await supabase.from('videos').select('id, title, thumbnail_url, duration_seconds').in('id', videoIds);
    if (data) {
      const sorted = [...orderedItems].sort((a, b) => a.order_index - b.order_index);
      setItems(sorted.map(item => {
        const video = data.find((v: any) => v.id === item.video_id);
        return {
          tempId: item.id,
          video_id: item.video_id,
          title: video?.title || 'Video',
          thumbnail: video?.thumbnail_url,
          duration: video?.duration_seconds,
        };
      }));
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.tempId === active.id);
    const newIdx = items.findIndex(i => i.tempId === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      setItems(arrayMove(items, oldIdx, newIdx));
    }
  };

  const addVideo = (video: LibraryVideo) => {
    if (items.some(i => i.video_id === video.id)) {
      toast({ title: 'Video ist bereits in der Playlist' });
      return;
    }
    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      video_id: video.id,
      title: video.title,
      thumbnail: video.thumbnail_url,
      duration: video.duration_seconds,
    }]);
  };

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleSave = async () => {
    if (!playlistName.trim()) {
      toast({ title: 'Bitte gib einen Namen ein', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let pid = playlistId;

      if (!pid) {
        const result = await createPlaylist(playlistName.trim(), description.trim() || undefined, selectedLevelId || undefined);
        if (!result) { setSaving(false); return; }
        pid = result.id;
        setPlaylistId(pid);
      } else {
        await supabase.from('playlists').update({
          name: playlistName.trim(),
          description: description.trim() || null,
          level_id: selectedLevelId || null,
        }).eq('id', pid);
      }

      await supabase.from('playlist_items').delete().eq('playlist_id', pid);
      if (items.length > 0) {
        await supabase.from('playlist_items').insert(
          items.map((item, idx) => ({
            playlist_id: pid!,
            video_id: item.video_id,
            order_index: idx,
          }))
        );
      }

      await refreshPlaylists();
      toast({ title: editId ? 'Playlist gespeichert' : 'Playlist erstellt!' });
      navigate(-1);
    } catch (e: any) {
      toast({ title: 'Fehler beim Speichern', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isAdded = (videoId: string) => items.some(i => i.video_id === videoId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-strong flex items-center gap-4 px-5 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app', { state: { activeTab: 'levels' } })}
          className="text-foreground hover:bg-secondary rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <input
            value={playlistName}
            onChange={e => setPlaylistName(e.target.value)}
            placeholder={editId ? 'Playlist-Name…' : 'Neue Playlist…'}
            className="bg-transparent text-lg font-bold text-foreground tracking-tight w-full outline-none placeholder:text-muted-foreground/60 border-b border-transparent focus:border-primary/40 transition-colors pb-0.5"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? 'Video' : 'Videos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="border-border bg-secondary text-foreground hover:bg-secondary/80 gap-1.5"
          >
            <Save className="w-4 h-4" /> Speichern
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 font-semibold shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)' }}
          >
            <Play className="w-4 h-4" /> Speichern & Zurück
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden gap-px">
        {/* LEFT: Levels */}
        <div className="w-56 flex flex-col glass">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Levels</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              onClick={() => setSelectedLevelId('')}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                !selectedLevelId
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-foreground/70 hover:bg-secondary/40'
              )}
            >
              Alle Videos
            </button>
            {levels.map((level: any) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm font-medium flex items-center justify-between',
                  selectedLevelId === level.id
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-foreground/70 hover:bg-secondary/40'
                )}
              >
                <span className="truncate">{level.title}</span>
                <span className={cn(
                  'text-[10px] tabular-nums rounded-full px-1.5 py-0.5',
                  selectedLevelId === level.id ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-muted-foreground'
                )}>
                  {allVideos.filter(v => v.level_id === level.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Videos */}
        <div className="flex flex-col glass shrink-0" style={{ width: '470px' }}>
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Video suchen…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 pt-2">
            {filteredVideos.map(video => {
              const added = isAdded(video.id);
              return (
                <button
                  key={video.id}
                  onClick={() => !added && addVideo(video)}
                  disabled={added}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group',
                    added ? 'opacity-50 cursor-default' : 'hover:bg-secondary/80 active:scale-[0.98]'
                  )}
                >
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="w-10 h-7 rounded-md object-cover shrink-0 bg-secondary" />
                  ) : (
                    <div className="w-10 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary/20">
                      <Video className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block text-foreground">{video.title}</span>
                    {!selectedLevelId && (
                      <span className="text-[10px] text-muted-foreground">
                        {levels.find((l: any) => l.id === video.level_id)?.title}
                      </span>
                    )}
                  </div>
                  {video.duration_seconds && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {Math.floor(video.duration_seconds / 60)}m
                    </span>
                  )}
                  {added ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              );
            })}
            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">Keine Videos gefunden</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Playlist Items */}
        <div className="flex-1 flex flex-col glass">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full shrink-0 bg-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {playlistName || 'Deine Playlist'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} Videos
                </p>
              </div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.tempId)} strategy={verticalListSortingStrategy}>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {items.map((item, idx) => (
                  <SortablePlaylistItem
                    key={item.tempId}
                    id={item.tempId}
                    item={item}
                    index={idx + 1}
                    onRemove={() => removeItem(item.tempId)}
                  />
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                      <Music className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Noch keine Videos</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      Klicke in der Mitte auf ein Video, um es hinzuzufügen
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable Playlist Item ─── */
function SortablePlaylistItem({ id, item, index, onRemove }: {
  id: string; item: LocalPlaylistItem; index: number; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all border-l-[3px] border-l-primary bg-card/40 backdrop-blur-sm hover:bg-card/60"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
        <GripVertical className="w-4 h-4 text-foreground" />
      </div>

      <span className="text-[10px] font-bold tabular-nums shrink-0 w-4 text-center text-primary">
        {index}
      </span>

      {item.thumbnail ? (
        <img src={item.thumbnail} alt="" className="w-10 h-7 rounded-md object-cover shrink-0 shadow-sm" />
      ) : (
        <div className="w-10 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary/10 border border-border/30">
          <Video className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        {item.duration && (
          <p className="text-[11px] text-muted-foreground">
            {Math.floor(item.duration / 60)}:{((item.duration % 60) || 0).toString().padStart(2, '0')}
          </p>
        )}
      </div>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-foreground/5 shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
