import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Play, Music } from 'lucide-react';
import { PlaylistVideoSearch } from './PlaylistVideoSearch';
import { PlaylistWithItems } from '@/hooks/usePlaylists';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

interface PlaylistEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: PlaylistWithItems;
  onAddVideo: (playlistId: string, videoId: string) => Promise<boolean>;
  onRemoveVideo: (itemId: string) => Promise<void>;
  onReorder: (playlistId: string, orderedItemIds: string[]) => Promise<void>;
  onDelete: (playlistId: string) => Promise<void>;
  onStartPlaylist?: (playlist: PlaylistWithItems) => void;
}

function SortableVideoItem({ 
  item, 
  video, 
  onRemove 
}: { 
  item: { id: string; video_id: string }; 
  video?: VideoInfo; 
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg bg-background border border-border ${isDragging ? 'opacity-50 shadow-lg z-10' : ''}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <img
        src={video?.thumbnail_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=80&h=45&fit=crop'}
        alt={video?.title || ''}
        className="w-14 h-8 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{video?.title || 'Laden...'}</p>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PlaylistEditor({ 
  open, onOpenChange, playlist, onAddVideo, onRemoveVideo, onReorder, onDelete, onStartPlaylist 
}: PlaylistEditorProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [videoInfos, setVideoInfos] = useState<Record<string, VideoInfo>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Fetch video details for items
  useEffect(() => {
    if (!open || playlist.items.length === 0) return;
    const ids = playlist.items.map(i => i.video_id).filter(id => !videoInfos[id]);
    if (ids.length === 0) return;

    supabase
      .from('videos')
      .select('id, title, thumbnail_url, duration_seconds')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, VideoInfo> = { ...videoInfos };
          data.forEach((v: any) => { map[v.id] = v; });
          setVideoInfos(map);
        }
      });
  }, [open, playlist.items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = playlist.items.findIndex(i => i.id === active.id);
    const newIndex = playlist.items.findIndex(i => i.id === over.id);
    const newOrder = arrayMove(playlist.items, oldIndex, newIndex);
    onReorder(playlist.id, newOrder.map(i => i.id));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] bg-card border-border flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Music className="w-5 h-5 text-primary" />
              {playlist.name}
            </DialogTitle>
            <DialogDescription>{playlist.description || `${playlist.items.length} Videos`}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Video hinzufügen
            </Button>
            {playlist.items.length > 0 && onStartPlaylist && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { onStartPlaylist(playlist); onOpenChange(false); }}
                className="gap-1.5"
              >
                <Play className="w-4 h-4" /> Starten
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mt-2">
            {playlist.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Music className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Noch keine Videos</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Füge Videos hinzu, um deinen Übeplan zu starten</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={playlist.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {playlist.items.map(item => (
                    <SortableVideoItem
                      key={item.id}
                      item={item}
                      video={videoInfos[item.video_id]}
                      onRemove={() => onRemoveVideo(item.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onDelete(playlist.id); onOpenChange(false); }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Playlist löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PlaylistVideoSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        existingVideoIds={playlist.items.map(i => i.video_id)}
        onAddVideo={(videoId) => onAddVideo(playlist.id, videoId)}
      />
    </>
  );
}
