import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { SortableItem } from './SortableItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2, Edit2, Check, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  title: string;
  description: string | null;
  vimeo_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_active: boolean;
}

interface VideoManagerProps {
  sectionId: string;
  sectionTitle: string;
  levelId: string;
  onBack: () => void;
}

export function VideoManager({ sectionId, sectionTitle, onBack }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchVideos();
  }, [sectionId]);

  async function fetchVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order');

    if (error) {
      toast.error('Fehler beim Laden der Videos');
      console.error(error);
    } else {
      setVideos(data || []);
    }
    setIsLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      const newVideos = arrayMove(videos, oldIndex, newIndex);
      setVideos(newVideos);

      const updates = newVideos.map((video, index) => ({
        id: video.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('videos')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      toast.success('Reihenfolge aktualisiert');
    }
  }

  async function handleUpdateVideo(id: string) {
    const { error } = await supabase
      .from('videos')
      .update({
        title: editForm.title,
        description: editForm.description || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    } else {
      toast.success('Video aktualisiert');
      setEditingId(null);
      fetchVideos();
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('videos')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      fetchVideos();
    }
  }

  async function handleDeleteVideo(id: string) {
    if (!confirm('Video wirklich löschen?')) {
      return;
    }

    const { error } = await supabase.from('videos').delete().eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    } else {
      toast.success('Video gelöscht');
      fetchVideos();
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Videos</h2>
          <p className="text-sm text-muted-foreground">{sectionTitle}</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {videos.map((video) => (
              <SortableItem key={video.id} id={video.id}>
                {video.thumbnail_url && (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                )}

                <div className="flex-1 min-w-0">
                  {editingId === video.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Beschreibung"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{video.title}</span>
                        {!video.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatDuration(video.duration_seconds)}</span>
                        <span>ID: {video.vimeo_video_id}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === video.id ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdateVideo(video.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(video.id);
                          setEditForm({
                            title: video.title,
                            description: video.description || '',
                          });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(video.id, video.is_active)}
                      >
                        {video.is_active ? '👁️' : '👁️‍🗨️'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                      >
                        <a
                          href={`https://vimeo.com/${video.vimeo_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {videos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Keine Videos in dieser Section. Synchronisiere zuerst das Level mit Vimeo.
        </div>
      )}
    </div>
  );
}
