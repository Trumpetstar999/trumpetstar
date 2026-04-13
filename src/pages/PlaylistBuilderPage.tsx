import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlaylists } from '@/hooks/usePlaylists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Save, Play, Plus, Trash2, GripVertical,
  Video, Search, Music, Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface LibraryItem {
  id: string;
  title: string;
  duration?: number | null;
  level_title?: string;
  thumbnail?: string | null;
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
  const { playlists, createPlaylist, addVideo, removeVideo, reorderItems, refreshPlaylists } = usePlaylists();

  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [levelId, setLevelId] = useState(defaultLevelId);
  const [items, setItems] = useState<LocalPlaylistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [playlistId, setPlaylistId] = useState<string | null>(editId || null);

  // Load levels
  const { data: levels = [] } = useQuery({
    queryKey: ['playlist-levels'],
    queryFn: async () => {
      const { data } = await supabase.from('levels').select('id, title').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  // Load library videos
  const { data: libraryItems = [] } = useQuery({
    queryKey: ['playlist-library', searchQuery],
    queryFn: async (): Promise<LibraryItem[]> => {
      let q = (supabase as any).from('videos').select('id, title, duration_seconds, level_id, thumbnail_url').eq('is_active', true);
      if (searchQuery) q = q.ilike('title', `%${searchQuery}%`);
      const { data } = await q.order('sort_order').limit(80);
      return (data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        duration: v.duration_seconds,
        thumbnail: v.thumbnail_url,
        level_title: levels.find((l: any) => l.id === v.level_id)?.title,
      }));
    },
    enabled: levels.length > 0,
  });

  // Load existing playlist for editing
  useEffect(() => {
    if (editId) {
      const existing = playlists.find(p => p.id === editId);
      if (existing) {
        setPlaylistName(existing.name);
        setDescription(existing.description || '');
        setLevelId(existing.level_id || '');
        setPlaylistId(existing.id);
        // We need video details for items
        loadPlaylistItems(existing.items.map(i => i.video_id));
      }
    }
  }, [editId, playlists]);

  async function loadPlaylistItems(videoIds: string[]) {
    if (videoIds.length === 0) return;
    const { data } = await supabase.from('videos').select('id, title, thumbnail_url, duration_seconds').in('id', videoIds);
    if (data) {
      const existing = playlists.find(p => p.id === editId);
      const ordered = existing?.items.sort((a, b) => a.order_index - b.order_index) || [];
      setItems(ordered.map(item => {
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

  const addLibraryItem = (lib: LibraryItem) => {
    if (items.some(i => i.video_id === lib.id)) {
      toast({ title: 'Video ist bereits in der Playlist' });
      return;
    }
    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      video_id: lib.id,
      title: lib.title,
      thumbnail: lib.thumbnail,
      duration: lib.duration,
    }]);
  };

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleSave = async (andStart = false) => {
    if (!playlistName.trim()) {
      toast({ title: 'Bitte gib einen Namen ein', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let pid = playlistId;

      if (!pid) {
        // Create playlist first
        const result = await createPlaylist(playlistName.trim(), description.trim() || undefined, levelId || undefined);
        if (!result) { setSaving(false); return; }
        pid = result.id;
        setPlaylistId(pid);
      } else {
        // Update name/description/level
        await supabase.from('playlists').update({
          name: playlistName.trim(),
          description: description.trim() || null,
          level_id: levelId || null,
        }).eq('id', pid);
      }

      // Sync items: delete all existing, re-insert in order
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

      if (andStart) {
        // Navigate back – the LevelPlaylistSection will handle playing
        navigate(-1);
      } else {
        navigate(-1);
      }
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
          onClick={() => navigate(-1)}
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
            onClick={() => handleSave(false)}
            disabled={saving}
            className="border-border bg-secondary text-foreground hover:bg-secondary/80 gap-1.5"
          >
            <Save className="w-4 h-4" /> Speichern
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving || items.length === 0}
            className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 font-semibold shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)' }}
          >
            <Play className="w-4 h-4" /> Speichern
          </Button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="flex-1 flex overflow-hidden gap-px">
        {/* LEFT: Library */}
        <div className="w-80 flex flex-col glass">
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Video suchen…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>
            {/* Level filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setLevelId('')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  !levelId
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-secondary text-foreground/80 hover:bg-secondary/80'
                )}
              >
                Alle Levels
              </button>
              {levels.map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => setLevelId(l.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    levelId === l.id
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary text-foreground/80 hover:bg-secondary/80'
                  )}
                >
                  {l.title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {libraryItems.map((lib: LibraryItem) => {
              const added = isAdded(lib.id);
              return (
                <button
                  key={lib.id}
                  onClick={() => !added && addLibraryItem(lib)}
                  disabled={added}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group',
                    added ? 'opacity-50 cursor-default' : 'hover:bg-secondary/80 active:scale-[0.98]'
                  )}
                >
                  {lib.thumbnail ? (
                    <img src={lib.thumbnail} alt="" className="w-10 h-7 rounded-md object-cover shrink-0 bg-secondary" />
                  ) : (
                    <div className="w-10 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary/20">
                      <Video className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block text-foreground">{lib.title}</span>
                    {lib.level_title && (
                      <span className="text-[10px] text-muted-foreground">{lib.level_title}</span>
                    )}
                  </div>
                  {lib.duration && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {Math.floor(lib.duration / 60)}m
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
            {libraryItems.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">Keine Ergebnisse</p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                      Klicke links auf ein Video, um es hinzuzufügen
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
        <img src={item.thumbnail} alt="" className="w-12 h-8 rounded-md object-cover shrink-0 shadow-sm" />
      ) : (
        <div className="w-12 h-8 rounded-md flex items-center justify-center shrink-0 bg-primary/10 border border-border/30">
          <Video className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        {item.duration && (
          <p className="text-[11px] text-muted-foreground">
            {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
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
