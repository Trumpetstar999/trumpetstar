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
import { Plus, Trash2, Edit2, Check, X, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Level {
  id: string;
  title: string;
  description: string | null;
  vimeo_showcase_id: string;
  sort_order: number;
  is_active: boolean;
}

interface LevelManagerProps {
  onSelectLevel: (levelId: string) => void;
}

export function LevelManager({ onSelectLevel }: LevelManagerProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [newLevel, setNewLevel] = useState({ title: '', vimeo_showcase_id: '' });
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('sort_order');

    if (error) {
      toast.error('Fehler beim Laden der Levels');
      console.error(error);
    } else {
      setLevels(data || []);
    }
    setIsLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = levels.findIndex((l) => l.id === active.id);
      const newIndex = levels.findIndex((l) => l.id === over.id);

      const newLevels = arrayMove(levels, oldIndex, newIndex);
      setLevels(newLevels);

      // Update sort_order in database
      const updates = newLevels.map((level, index) => ({
        id: level.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('levels')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      toast.success('Reihenfolge aktualisiert');
    }
  }

  async function handleAddLevel() {
    if (!newLevel.title || !newLevel.vimeo_showcase_id) {
      toast.error('Titel und Vimeo Showcase ID sind erforderlich');
      return;
    }

    const { error } = await supabase.from('levels').insert({
      title: newLevel.title,
      vimeo_showcase_id: newLevel.vimeo_showcase_id,
      sort_order: levels.length,
    });

    if (error) {
      toast.error('Fehler beim Erstellen des Levels');
      console.error(error);
    } else {
      toast.success('Level erstellt');
      setNewLevel({ title: '', vimeo_showcase_id: '' });
      setIsAdding(false);
      fetchLevels();
    }
  }

  async function handleUpdateLevel(id: string) {
    const { error } = await supabase
      .from('levels')
      .update({
        title: editForm.title,
        description: editForm.description || null,
      })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    } else {
      toast.success('Level aktualisiert');
      setEditingId(null);
      fetchLevels();
    }
  }

  async function handleDeleteLevel(id: string) {
    if (!confirm('Level wirklich löschen? Alle Sections und Videos werden ebenfalls gelöscht.')) {
      return;
    }

    const { error } = await supabase.from('levels').delete().eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    } else {
      toast.success('Level gelöscht');
      fetchLevels();
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('levels')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      fetchLevels();
    }
  }

  function startEditing(level: Level) {
    setEditingId(level.id);
    setEditForm({ title: level.title, description: level.description || '' });
  }

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Levels</h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Level
        </Button>
      </div>

      {isAdding && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          <Input
            placeholder="Level Titel"
            value={newLevel.title}
            onChange={(e) => setNewLevel({ ...newLevel, title: e.target.value })}
          />
          <Input
            placeholder="Vimeo Showcase ID (z.B. 8414886)"
            value={newLevel.vimeo_showcase_id}
            onChange={(e) => setNewLevel({ ...newLevel, vimeo_showcase_id: e.target.value })}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddLevel}>Erstellen</Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={levels.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {levels.map((level) => (
              <SortableItem key={level.id} id={level.id}>
                <div className="flex-1">
                  {editingId === level.id ? (
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
                        <span className="font-medium">{level.title}</span>
                        {!level.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                      {level.description && (
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Showcase: {level.vimeo_showcase_id}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === level.id ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdateLevel(level.id)}
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
                        onClick={() => startEditing(level)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(level.id, level.is_active)}
                      >
                        {level.is_active ? '👁️' : '👁️‍🗨️'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteLevel(level.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectLevel(level.id)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {levels.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Levels vorhanden. Erstelle dein erstes Level!
        </div>
      )}
    </div>
  );
}
