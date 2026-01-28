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
import { MultilingualInput } from './MultilingualInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, ChevronRight, Crown, Lock, Save, Loader2, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';

type Difficulty = 'basics' | 'beginner' | 'easy' | 'medium' | 'advanced';

interface Level {
  id: string;
  title: string;
  title_en: string | null;
  title_es: string | null;
  description: string | null;
  description_en: string | null;
  description_es: string | null;
  vimeo_showcase_id: string;
  sort_order: number;
  is_active: boolean;
  required_plan_key: PlanKey;
  difficulty: Difficulty;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'basics', label: 'Basics' },
  { value: 'beginner', label: 'Anfänger' },
  { value: 'easy', label: 'Einfach' },
  { value: 'medium', label: 'Mittel' },
  { value: 'advanced', label: 'Anspruchsvoll' },
];

const DIFFICULTY_BADGE_COLORS: Record<Difficulty, string> = {
  basics: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  easy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface LevelManagerProps {
  onSelectLevel: (levelId: string) => void;
}

const PLAN_OPTIONS: { value: PlanKey; label: string }[] = [
  { value: 'FREE', label: 'Free (alle)' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
];

const PLAN_BADGE_COLORS: Record<PlanKey, string> = {
  FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PREMIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export function LevelManager({ onSelectLevel }: LevelManagerProps) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [originalLevels, setOriginalLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    title: '', title_en: '', title_es: '',
    description: '', description_en: '', description_es: '',
    required_plan_key: 'FREE' as PlanKey, difficulty: 'basics' as Difficulty, sort_order: 0 
  });
  const [newLevel, setNewLevel] = useState({ 
    title: '', title_en: '', title_es: '',
    vimeo_showcase_id: '', required_plan_key: 'FREE' as PlanKey, difficulty: 'basics' as Difficulty, sort_order: 0 
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(levels) !== JSON.stringify(originalLevels);

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
      // Map data with default plan key and difficulty
      const mappedLevels = (data || []).map(level => ({
        ...level,
        required_plan_key: (level.required_plan_key as PlanKey) || 'FREE',
        difficulty: (level.difficulty as Difficulty) || 'beginner',
      }));
      setLevels(mappedLevels);
      setOriginalLevels(mappedLevels);
    }
    setIsLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = levels.findIndex((l) => l.id === active.id);
      const newIndex = levels.findIndex((l) => l.id === over.id);

      const newLevels = arrayMove(levels, oldIndex, newIndex).map((level, index) => ({
        ...level,
        sort_order: index,
      }));
      setLevels(newLevels);
      // Don't save immediately - user will click Save button
    }
  }

  async function handleSaveAll() {
    setIsSaving(true);
    
    try {
      console.log('Saving levels:', levels.map(l => ({ 
        id: l.id, 
        title: l.title,
        sort_order: l.sort_order, 
        difficulty: l.difficulty, 
        required_plan_key: l.required_plan_key 
      })));

      let savedCount = 0;
      const errors: string[] = [];

      // Save all levels with their current state
      for (const level of levels) {
        const updateData = {
          sort_order: level.sort_order,
          difficulty: level.difficulty,
          required_plan_key: level.required_plan_key,
        };
        
        console.log(`Updating level ${level.id} (${level.title}):`, updateData);
        
        const { data, error } = await supabase
          .from('levels')
          .update(updateData)
          .eq('id', level.id)
          .select();
        
        if (error) {
          console.error('Error saving level:', level.id, error);
          errors.push(`${level.title}: ${error.message}`);
        } else {
          console.log(`Level ${level.id} saved successfully:`, data);
          savedCount++;
        }
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} Fehler beim Speichern: ${errors[0]}`);
      } else {
        toast.success(`${savedCount} Levels erfolgreich gespeichert`);
        setOriginalLevels([...levels]);
      }
    } catch (error) {
      console.error('Failed to save levels:', error);
      toast.error('Fehler beim Speichern: ' + (error instanceof Error ? error.message : 'Unbekannt'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleSortOrderChange(levelId: string, newSortOrder: number) {
    // Update local state only - save with Save button
    setLevels(prev => prev.map(l => 
      l.id === levelId ? { ...l, sort_order: newSortOrder } : l
    ));
  }

  async function handleAddLevel() {
    if (!newLevel.title || !newLevel.vimeo_showcase_id) {
      toast.error('Titel und Vimeo Showcase ID sind erforderlich');
      return;
    }

    const sortOrder = newLevel.sort_order || levels.length;

    const { error } = await supabase.from('levels').insert({
      title: newLevel.title,
      title_en: newLevel.title_en || null,
      title_es: newLevel.title_es || null,
      vimeo_showcase_id: newLevel.vimeo_showcase_id,
      sort_order: sortOrder,
      required_plan_key: newLevel.required_plan_key,
      difficulty: newLevel.difficulty,
    });

    if (error) {
      toast.error('Fehler beim Erstellen des Levels');
      console.error(error);
    } else {
      toast.success('Level erstellt');
      setNewLevel({ title: '', title_en: '', title_es: '', vimeo_showcase_id: '', required_plan_key: 'FREE', difficulty: 'basics', sort_order: 0 });
      setIsAdding(false);
      fetchLevels();
    }
  }

  async function handleUpdateLevel(id: string) {
    const { error } = await supabase
      .from('levels')
      .update({
        title: editForm.title,
        title_en: editForm.title_en || null,
        title_es: editForm.title_es || null,
        description: editForm.description || null,
        description_en: editForm.description_en || null,
        description_es: editForm.description_es || null,
        required_plan_key: editForm.required_plan_key,
        difficulty: editForm.difficulty,
        sort_order: editForm.sort_order,
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

  function handlePlanChange(levelId: string, planKey: PlanKey) {
    // Update local state only - save with Save button
    setLevels(prev => prev.map(l => 
      l.id === levelId ? { ...l, required_plan_key: planKey } : l
    ));
  }

  function startEditing(level: Level) {
    setEditingId(level.id);
    setEditForm({ 
      title: level.title, 
      title_en: level.title_en || '',
      title_es: level.title_es || '',
      description: level.description || '',
      description_en: level.description_en || '',
      description_es: level.description_es || '',
      required_plan_key: level.required_plan_key,
      difficulty: level.difficulty,
      sort_order: level.sort_order,
    });
  }

  function handleDifficultyChange(levelId: string, difficulty: Difficulty) {
    // Update local state only - save with Save button
    setLevels(prev => prev.map(l => 
      l.id === levelId ? { ...l, difficulty } : l
    ));
  }

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Levels</h2>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Ungespeicherte Änderungen
            </span>
          )}
          <Button 
            onClick={handleSaveAll} 
            disabled={!hasUnsavedChanges || isSaving}
            variant={hasUnsavedChanges ? "default" : "outline"}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Alle speichern
          </Button>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Level
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          <MultilingualInput
            label="Level Titel"
            valueDE={newLevel.title}
            valueEN={newLevel.title_en}
            valueES={newLevel.title_es}
            onChangeDE={(v) => setNewLevel({ ...newLevel, title: v })}
            onChangeEN={(v) => setNewLevel({ ...newLevel, title_en: v })}
            onChangeES={(v) => setNewLevel({ ...newLevel, title_es: v })}
            placeholder="Level Titel"
            required
          />
          <Input
            placeholder="Vimeo Showcase ID (z.B. 8414886)"
            value={newLevel.vimeo_showcase_id}
            onChange={(e) => setNewLevel({ ...newLevel, vimeo_showcase_id: e.target.value })}
          />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Benötigter Plan:</span>
              <Select
                value={newLevel.required_plan_key}
                onValueChange={(value) => setNewLevel({ ...newLevel, required_plan_key: value as PlanKey })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Schwierigkeit:</span>
              <Select
                value={newLevel.difficulty}
                onValueChange={(value) => setNewLevel({ ...newLevel, difficulty: value as Difficulty })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Reihenfolge:</span>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={newLevel.sort_order}
                onChange={(e) => setNewLevel({ ...newLevel, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
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
                    <div className="space-y-4">
                      <MultilingualInput
                        label="Titel"
                        valueDE={editForm.title}
                        valueEN={editForm.title_en}
                        valueES={editForm.title_es}
                        onChangeDE={(v) => setEditForm({ ...editForm, title: v })}
                        onChangeEN={(v) => setEditForm({ ...editForm, title_en: v })}
                        onChangeES={(v) => setEditForm({ ...editForm, title_es: v })}
                        required
                      />
                      <MultilingualInput
                        label="Beschreibung"
                        valueDE={editForm.description}
                        valueEN={editForm.description_en}
                        valueES={editForm.description_es}
                        onChangeDE={(v) => setEditForm({ ...editForm, description: v })}
                        onChangeEN={(v) => setEditForm({ ...editForm, description_en: v })}
                        onChangeES={(v) => setEditForm({ ...editForm, description_es: v })}
                        multiline
                        rows={2}
                      />
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Benötigter Plan:</span>
                          <Select
                            value={editForm.required_plan_key}
                            onValueChange={(value) => setEditForm({ ...editForm, required_plan_key: value as PlanKey })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLAN_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Schwierigkeit:</span>
                          <Select
                            value={editForm.difficulty}
                            onValueChange={(value) => setEditForm({ ...editForm, difficulty: value as Difficulty })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DIFFICULTY_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Reihenfolge:</span>
                          <Input
                            type="number"
                            min={0}
                            className="w-20"
                            value={editForm.sort_order}
                            onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{level.title}</span>
                        {(level.title_en || level.title_es) && (
                          <span title="Übersetzungen vorhanden">
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        )}
                        {!level.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                        <Badge className={`${DIFFICULTY_BADGE_COLORS[level.difficulty]}`}>
                          {DIFFICULTY_OPTIONS.find(d => d.value === level.difficulty)?.label || 'Anfänger'}
                        </Badge>
                        {level.required_plan_key !== 'FREE' && (
                          <Badge className={`${PLAN_BADGE_COLORS[level.required_plan_key]} gap-1`}>
                            {level.required_plan_key === 'PREMIUM' ? (
                              <Crown className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            {PLAN_DISPLAY_NAMES[level.required_plan_key]}
                          </Badge>
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

                <div className="flex items-center gap-1">
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
                      {/* Sort Order Input */}
                      <Input
                        type="number"
                        min={0}
                        className="w-16 h-8 text-xs text-center"
                        value={level.sort_order}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          handleSortOrderChange(level.id, newValue);
                        }}
                      />
                      {/* Inline Difficulty Selector */}
                      <Select
                        value={level.difficulty}
                        onValueChange={(value) => handleDifficultyChange(level.id, value as Difficulty)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Inline Plan Selector */}
                      <Select
                        value={level.required_plan_key}
                        onValueChange={(value) => handlePlanChange(level.id, value as PlanKey)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
