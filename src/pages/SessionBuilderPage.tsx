import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Save, Play, Plus, Trash2, GripVertical,
  Video, FileText, Timer, Search, X, Music, Clock,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_SECTIONS } from '@/types/sessions';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface LocalSection {
  tempId: string;
  title: string;
  section_key: string;
  items: LocalItem[];
}

interface LocalItem {
  tempId: string;
  item_type: 'vimeo_video' | 'pdf' | 'pause';
  ref_id: string | null;
  title_cache: string | null;
  duration_mode: 'until_end' | 'timer';
  duration_seconds: number | null;
}

interface LibraryItem {
  id: string;
  title: string;
  type: 'video' | 'pdf';
  duration?: number | null;
  level_title?: string;
}

function genId() {
  return crypto.randomUUID();
}

export default function SessionBuilderPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { createSession, updateSession, fetchSessionById } = usePracticeSessions();

  const [sessionName, setSessionName] = useState('');
  const [breakEnabled, setBreakEnabled] = useState(true);
  const [breakSeconds, setBreakSeconds] = useState(60);
  const [sections, setSections] = useState<LocalSection[]>(
    DEFAULT_SECTIONS.map(s => ({ tempId: genId(), title: s.title, section_key: s.section_key, items: [] }))
  );
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'pdf'>('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      fetchSessionById(editId).then(s => {
        if (s) {
          setSessionName(s.name);
          setBreakEnabled(s.break_enabled);
          setBreakSeconds(s.break_seconds_default);
          setSections(s.sections.map(sec => ({
            tempId: genId(),
            title: sec.title,
            section_key: sec.section_key,
            items: sec.items.map(it => ({
              tempId: genId(),
              item_type: it.item_type,
              ref_id: it.ref_id,
              title_cache: it.title_cache,
              duration_mode: it.duration_mode,
              duration_seconds: it.duration_seconds,
            })),
          })));
        }
      });
    }
  }, [editId, fetchSessionById]);

  const { data: libraryItems = [] } = useQuery({
    queryKey: ['session-library', searchQuery, typeFilter],
    queryFn: async (): Promise<LibraryItem[]> => {
      const results: LibraryItem[] = [];
      if (typeFilter !== 'pdf') {
        let q = (supabase as any).from('videos').select('id, title, duration_seconds, level_id').eq('is_active', true);
        if (searchQuery) q = q.ilike('title', `%${searchQuery}%`);
        const { data } = await q.limit(50);
        if (data) results.push(...data.map((v: any) => ({ id: v.id, title: v.title, type: 'video' as const, duration: v.duration_seconds })));
      }
      if (typeFilter !== 'video') {
        let q = (supabase as any).from('pdf_documents').select('id, title').eq('is_active', true);
        if (searchQuery) q = q.ilike('title', `%${searchQuery}%`);
        const { data } = await q.limit(50);
        if (data) results.push(...data.map((p: any) => ({ id: p.id, title: p.title, type: 'pdf' as const })));
      }
      return results;
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const selectedSection = sections[selectedSectionIdx];

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.tempId === active.id);
    const newIdx = sections.findIndex(s => s.tempId === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      setSections(arrayMove(sections, oldIdx, newIdx));
      if (selectedSectionIdx === oldIdx) setSelectedSectionIdx(newIdx);
    }
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedSection) return;
    const items = [...selectedSection.items];
    const oldIdx = items.findIndex(i => i.tempId === active.id);
    const newIdx = items.findIndex(i => i.tempId === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      const newItems = arrayMove(items, oldIdx, newIdx);
      setSections(prev => prev.map((s, i) => i === selectedSectionIdx ? { ...s, items: newItems } : s));
    }
  };

  const addLibraryItem = (lib: LibraryItem) => {
    if (!selectedSection) return;
    const newItem: LocalItem = {
      tempId: genId(),
      item_type: lib.type === 'video' ? 'vimeo_video' : 'pdf',
      ref_id: lib.id,
      title_cache: lib.title,
      duration_mode: lib.type === 'video' ? 'until_end' : 'timer',
      duration_seconds: lib.type === 'pdf' ? 120 : null,
    };
    setSections(prev => prev.map((s, i) => i === selectedSectionIdx ? { ...s, items: [...s.items, newItem] } : s));
  };

  const addPause = () => {
    if (!selectedSection) return;
    const newItem: LocalItem = {
      tempId: genId(),
      item_type: 'pause',
      ref_id: null,
      title_cache: 'Pause',
      duration_mode: 'timer',
      duration_seconds: 60,
    };
    setSections(prev => prev.map((s, i) => i === selectedSectionIdx ? { ...s, items: [...s.items, newItem] } : s));
  };

  const removeItem = (tempId: string) => {
    setSections(prev => prev.map((s, i) => i === selectedSectionIdx ? { ...s, items: s.items.filter(it => it.tempId !== tempId) } : s));
  };

  const updateItemDuration = (tempId: string, seconds: number) => {
    setSections(prev => prev.map((s, i) => i === selectedSectionIdx ? {
      ...s,
      items: s.items.map(it => it.tempId === tempId ? { ...it, duration_seconds: seconds } : it)
    } : s));
  };

  const addSection = () => {
    setSections(prev => [...prev, { tempId: genId(), title: 'Neue Rubrik', section_key: 'custom', items: [] }]);
    setSelectedSectionIdx(sections.length);
  };

  const removeSection = (idx: number) => {
    if (sections[idx].items.length > 0 && !confirm('Rubrik mit Items löschen?')) return;
    setSections(prev => prev.filter((_, i) => i !== idx));
    if (selectedSectionIdx >= sections.length - 1) setSelectedSectionIdx(Math.max(0, sections.length - 2));
  };

  const renameSection = (idx: number, title: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s));
  };

  const handleSave = async (andStart = false) => {
    if (!sessionName.trim()) {
      toast({ title: 'Bitte gib einen Session-Namen ein', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: sessionName,
        break_enabled: breakEnabled,
        break_seconds_default: breakSeconds,
        sections: sections.map(s => ({
          title: s.title,
          section_key: s.section_key,
          items: s.items.map(it => ({
            order_index: 0,
            item_type: it.item_type,
            ref_id: it.ref_id,
            title_cache: it.title_cache,
            duration_mode: it.duration_mode,
            duration_seconds: it.duration_seconds,
          })),
        })),
      };

      if (editId) {
        await updateSession.mutateAsync({ id: editId, ...payload });
        toast({ title: 'Session gespeichert' });
        if (andStart) navigate(`/practice/sessions/${editId}/play`);
        else navigate('/practice/sessions');
      } else {
        const session = await createSession.mutateAsync(payload);
        toast({ title: 'Session erstellt' });
        if (andStart) navigate(`/practice/sessions/${session.id}/play`);
        else navigate('/practice/sessions');
      }
    } catch (e: any) {
      toast({ title: 'Fehler beim Speichern', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalItems = sections.reduce((a, s) => a + s.items.length, 0);

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
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {editId ? 'Session bearbeiten' : 'Neue Übesession'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'} in {sections.length} Rubriken
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
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 font-semibold shadow-lg"
            style={{ boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)' }}
          >
            <Play className="w-4 h-4" /> Starten
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden gap-px">
        {/* LEFT: Library */}
        <div className="w-72 flex flex-col glass">
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Video oder PDF suchen…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'video', 'pdf'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    typeFilter === f
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary text-foreground/80 hover:bg-secondary/80'
                  )}
                >
                  {f === 'all' ? 'Alle' : f === 'video' ? 'Videos' : 'PDFs'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {libraryItems.map(lib => (
              <button
                key={lib.id}
                onClick={() => addLibraryItem(lib)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center gap-3 group"
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  lib.type === 'video' ? 'bg-primary/20' : 'bg-gold/20'
                )}>
                  {lib.type === 'video'
                    ? <Video className="w-4 h-4 text-primary-foreground" />
                    : <FileText className="w-4 h-4 text-foreground" />
                  }
                </div>
                <span className="text-sm truncate flex-1 text-foreground">{lib.title}</span>
                {lib.duration && (
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {Math.floor(lib.duration / 60)}m
                  </span>
                )}
                <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
            {libraryItems.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">Keine Ergebnisse</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Sections */}
        <div className="w-64 flex flex-col glass">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Rubriken</h2>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map(s => s.tempId)} strategy={verticalListSortingStrategy}>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sections.map((sec, idx) => (
                  <SortableSectionItem
                    key={sec.tempId}
                    id={sec.tempId}
                    title={sec.title}
                    itemCount={sec.items.length}
                    isSelected={idx === selectedSectionIdx}
                    onClick={() => setSelectedSectionIdx(idx)}
                    onRename={(t) => renameSection(idx, t)}
                    onDelete={() => removeSection(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={addSection}
            >
              <Plus className="w-4 h-4" /> Neue Rubrik
            </Button>
          </div>
        </div>

        {/* RIGHT: Items */}
        <div className="flex-1 flex flex-col glass">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {selectedSection?.title || 'Rubrik wählen'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedSection?.items.length || 0} Items
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border bg-secondary text-foreground hover:bg-secondary/80 rounded-xl"
              onClick={addPause}
            >
              <Timer className="w-4 h-4" /> Pause einfügen
            </Button>
          </div>
          {selectedSection && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={selectedSection.items.map(i => i.tempId)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {selectedSection.items.map((item, idx) => (
                    <SortableItemCard
                      key={item.tempId}
                      id={item.tempId}
                      item={item}
                      index={idx + 1}
                      onRemove={() => removeItem(item.tempId)}
                      onDurationChange={(s) => updateItemDuration(item.tempId, s)}
                    />
                  ))}
                  {selectedSection.items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Music className="w-8 h-8 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Noch keine Items</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Klicke links auf ein Video oder PDF, um es dieser Rubrik hinzuzufügen
                      </p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Bottom Settings Bar */}
      <div className="glass-strong px-5 py-3 flex items-center gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">Session Name</label>
          <Input
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="z.B. Tägliches Warmup"
            className="h-10 max-w-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-foreground whitespace-nowrap">Auto-Pause</label>
          <Switch checked={breakEnabled} onCheckedChange={setBreakEnabled} />
          {breakEnabled && (
            <div className="flex items-center gap-1.5 bg-secondary rounded-xl px-2">
              <Input
                type="number"
                min={0}
                max={180}
                value={breakSeconds}
                onChange={e => setBreakSeconds(Number(e.target.value))}
                className="w-14 h-8 text-sm text-center border-0 bg-transparent text-foreground p-0"
              />
              <span className="text-xs text-muted-foreground pr-1">Sek.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable Section Item ─── */
function SortableSectionItem({ id, title, itemCount, isSelected, onClick, onRename, onDelete }: {
  id: string; title: string; itemCount: number; isSelected: boolean;
  onClick: () => void; onRename: (t: string) => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all group',
        isSelected
          ? 'bg-foreground/15 shadow-sm'
          : 'hover:bg-secondary/60'
      )}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {editing ? (
        <Input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={() => { onRename(editTitle); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onRename(editTitle); setEditing(false); } }}
          className="h-7 text-sm flex-1 bg-secondary border-border text-foreground rounded-lg"
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="text-sm flex-1 truncate font-medium text-foreground"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        >
          {title}
        </span>
      )}
      <span className={cn(
        'text-xs tabular-nums min-w-[20px] text-center rounded-full px-1.5 py-0.5',
        itemCount > 0 ? 'bg-foreground/10 text-foreground font-medium' : 'text-muted-foreground'
      )}>
        {itemCount}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-accent" />
      </button>
    </div>
  );
}

/* ─── Sortable Item Card ─── */
function SortableItemCard({ id, item, index, onRemove, onDurationChange }: {
  id: string; item: LocalItem; index: number; onRemove: () => void; onDurationChange: (s: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isVideo = item.item_type === 'vimeo_video';
  const isPdf = item.item_type === 'pdf';
  const isPause = item.item_type === 'pause';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-2xl card-glass group transition-all',
        isPause && 'bg-accent/5 border border-accent/20'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
        <GripVertical className="w-5 h-5 text-card-foreground/30" />
      </div>

      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        isVideo && 'bg-primary/10',
        isPdf && 'bg-gold/10',
        isPause && 'bg-accent/10'
      )}>
        {isVideo && <Video className="w-4 h-4 text-primary" />}
        {isPdf && <FileText className="w-4 h-4" style={{ color: 'hsl(48, 100%, 40%)' }} />}
        {isPause && <Timer className="w-4 h-4 text-accent" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">
          {item.title_cache || item.item_type}
        </p>
        <p className="text-xs text-card-foreground/50">
          {isVideo && 'Spielt bis Ende'}
          {isPdf && 'Timer-Modus'}
          {isPause && 'Pause'}
        </p>
      </div>

      {/* Duration Control */}
      {(isPdf || isPause) && (
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center bg-muted/50 rounded-xl border border-border/50 overflow-hidden">
            <Input
              type="number"
              min={10}
              max={600}
              value={item.duration_seconds || 60}
              onChange={e => onDurationChange(Number(e.target.value))}
              className="w-16 h-9 text-sm text-center border-0 bg-transparent text-card-foreground font-medium tabular-nums p-0"
              onClick={e => e.stopPropagation()}
            />
            <div className="flex flex-col border-l border-border/50">
              <button
                onClick={(e) => { e.stopPropagation(); onDurationChange(Math.min(600, (item.duration_seconds || 60) + 10)); }}
                className="px-1.5 py-0 hover:bg-accent/10 transition-colors"
              >
                <ChevronUp className="w-3 h-3 text-card-foreground/50" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDurationChange(Math.max(10, (item.duration_seconds || 60) - 10)); }}
                className="px-1.5 py-0 hover:bg-accent/10 transition-colors"
              >
                <ChevronDown className="w-3 h-3 text-card-foreground/50" />
              </button>
            </div>
          </div>
          <span className="text-xs text-card-foreground/40 ml-0.5">s</span>
        </div>
      )}

      {isVideo && (
        <span className="text-xs text-card-foreground/40 bg-muted/30 px-2.5 py-1 rounded-lg shrink-0">
          bis Ende
        </span>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-accent/10 shrink-0"
      >
        <Trash2 className="w-4 h-4 text-card-foreground/30 hover:text-accent" />
      </button>
    </div>
  );
}
