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
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, ChevronRight, ArrowLeft } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  level_id: string;
  sort_order: number;
}

interface SectionManagerProps {
  levelId: string;
  levelTitle: string;
  onBack: () => void;
  onSelectSection: (sectionId: string) => void;
}

export function SectionManager({ levelId, levelTitle, onBack, onSelectSection }: SectionManagerProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSections();
  }, [levelId]);

  async function fetchSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('level_id', levelId)
      .order('sort_order');

    if (error) {
      toast.error('Fehler beim Laden der Sections');
      console.error(error);
    } else {
      setSections(data || []);
    }
    setIsLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);

      const updates = newSections.map((section, index) => ({
        id: section.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('sections')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      toast.success('Reihenfolge aktualisiert');
    }
  }

  async function handleAddSection() {
    if (!newTitle) {
      toast.error('Titel ist erforderlich');
      return;
    }

    const { error } = await supabase.from('sections').insert({
      title: newTitle,
      level_id: levelId,
      sort_order: sections.length,
    });

    if (error) {
      toast.error('Fehler beim Erstellen der Section');
      console.error(error);
    } else {
      toast.success('Section erstellt');
      setNewTitle('');
      setIsAdding(false);
      fetchSections();
    }
  }

  async function handleUpdateSection(id: string) {
    const { error } = await supabase
      .from('sections')
      .update({ title: editTitle })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    } else {
      toast.success('Section aktualisiert');
      setEditingId(null);
      fetchSections();
    }
  }

  async function handleDeleteSection(id: string) {
    if (!confirm('Section wirklich löschen? Alle Videos werden ebenfalls entfernt.')) {
      return;
    }

    const { error } = await supabase.from('sections').delete().eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    } else {
      toast.success('Section gelöscht');
      fetchSections();
    }
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
          <h2 className="text-xl font-semibold">Sections</h2>
          <p className="text-sm text-muted-foreground">{levelTitle}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Section
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          <Input
            placeholder="Section Titel"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddSection}>Erstellen</Button>
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
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableItem key={section.id} id={section.id}>
                <div className="flex-1">
                  {editingId === section.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{section.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === section.id ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdateSection(section.id)}
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
                          setEditingId(section.id);
                          setEditTitle(section.title);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectSection(section.id)}
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

      {sections.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Sections vorhanden. Erstelle deine erste Section!
        </div>
      )}
    </div>
  );
}
