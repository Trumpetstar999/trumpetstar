import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Play, Plus, Trash2, GripVertical, Video, FileText, Timer, Search, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_SECTIONS, type PracticeSessionItem } from '@/types/sessions';
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

  // Load existing session for edit
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

  // Library search
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-card/50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1 truncate">{editId ? 'Session bearbeiten' : 'Neue Übesession'}</h1>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Library */}
        <div className="w-64 border-r border-border/50 flex flex-col bg-card/30">
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Video oder PDF suchen…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'video', 'pdf'] as const).map(f => (
                <Button key={f} size="sm" variant={typeFilter === f ? 'default' : 'outline'} className="text-xs flex-1" onClick={() => setTypeFilter(f)}>
                  {f === 'all' ? 'Alle' : f === 'video' ? 'Videos' : 'PDFs'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {libraryItems.map(lib => (
              <button
                key={lib.id}
                onClick={() => addLibraryItem(lib)}
                className="w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm"
              >
                {lib.type === 'video' ? <Video className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-gold shrink-0" />}
                <span className="truncate flex-1">{lib.title}</span>
                {lib.duration && <span className="text-xs text-muted-foreground shrink-0">{Math.floor(lib.duration / 60)}m</span>}
              </button>
            ))}
            {libraryItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Keine Ergebnisse</p>}
          </div>
        </div>

        {/* CENTER: Sections */}
        <div className="w-56 border-r border-border/50 flex flex-col bg-card/20">
          <div className="p-3 border-b border-border/30">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rubriken</h2>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map(s => s.tempId)} strategy={verticalListSortingStrategy}>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
          <div className="p-2 border-t border-border/30">
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={addSection}>
              <Plus className="w-3 h-3" /> Neue Rubrik
            </Button>
          </div>
        </div>

        {/* RIGHT: Items */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {selectedSection?.title || 'Rubrik wählen'} <span className="text-muted-foreground font-normal">({selectedSection?.items.length || 0} Items)</span>
            </h2>
            <Button variant="outline" size="sm" className="gap-1" onClick={addPause}>
              <Timer className="w-3 h-3" /> Pause einfügen
            </Button>
          </div>
          {selectedSection && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={selectedSection.items.map(i => i.tempId)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {selectedSection.items.map(item => (
                    <SortableItemCard
                      key={item.tempId}
                      id={item.tempId}
                      item={item}
                      onRemove={() => removeItem(item.tempId)}
                      onDurationChange={(s) => updateItemDuration(item.tempId, s)}
                    />
                  ))}
                  {selectedSection.items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Klicke links auf ein Video/PDF, um es hier hinzuzufügen
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Bottom Settings Bar */}
      <div className="border-t border-border/50 p-3 bg-card/50 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium whitespace-nowrap">Session Name:</label>
          <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="z.B. Tägliches Warmup" className="h-9 max-w-xs" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Auto-Pause:</label>
          <Switch checked={breakEnabled} onCheckedChange={setBreakEnabled} />
          {breakEnabled && (
            <Input type="number" min={0} max={180} value={breakSeconds} onChange={e => setBreakSeconds(Number(e.target.value))} className="w-16 h-9" />
          )}
          {breakEnabled && <span className="text-xs text-muted-foreground">Sek.</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> Speichern
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Play className="w-4 h-4 mr-1" /> Speichern & Starten
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sortable Section Item
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
        'flex items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-accent/30'
      )}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {editing ? (
        <Input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={() => { onRename(editTitle); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onRename(editTitle); setEditing(false); }}}
          className="h-7 text-sm flex-1"
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm flex-1 truncate" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}>{title}</span>
      )}
      <span className="text-xs text-muted-foreground">{itemCount}</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

// Sortable Item Card
function SortableItemCard({ id, item, onRemove, onDurationChange }: {
  id: string; item: LocalItem; onRemove: () => void; onDurationChange: (s: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const icon = item.item_type === 'vimeo_video' ? <Video className="w-4 h-4 text-primary" /> :
    item.item_type === 'pdf' ? <FileText className="w-4 h-4 text-gold" /> :
    <Timer className="w-4 h-4 text-accent" />;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/50 group">
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {icon}
      <span className="text-sm flex-1 truncate">{item.title_cache || item.item_type}</span>
      {(item.item_type === 'pdf' || item.item_type === 'pause') && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={10}
            max={600}
            value={item.duration_seconds || 60}
            onChange={e => onDurationChange(Number(e.target.value))}
            className="w-16 h-7 text-xs"
            onClick={e => e.stopPropagation()}
          />
          <span className="text-xs text-muted-foreground">s</span>
        </div>
      )}
      {item.item_type === 'vimeo_video' && (
        <span className="text-xs text-muted-foreground">bis Ende</span>
      )}
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
