import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalEntryCard } from '@/components/practice/JournalEntry';
import { TodoItem } from '@/components/practice/TodoItem';
import { JournalEntryDialog } from '@/components/practice/JournalEntryDialog';
import { TodoDialog } from '@/components/practice/TodoDialog';
import { mockJournalEntries, mockTodos } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, CheckSquare, Play, Edit, Copy, Trash2, Share2, Clock, Music, Video, FileText, Timer, ListMusic } from 'lucide-react';
import { JournalEntry, Todo } from '@/types';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SessionWithDetails } from '@/types/sessions';
import { ShareSessionDialog } from '@/components/sessions/ShareSessionDialog';

// ─── Session Card (inline) ────────────────────────────────────────────────────
function SessionCard({ session, index, thumbnails, onPlay, onEdit, onDuplicate, onShare, onDelete }: {
  session: SessionWithDetails;
  index: number;
  thumbnails: Record<string, string>;
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return m < 60 ? `~${m} Min.` : `~${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const videoThumbs = useMemo(() => {
    const thumbs: string[] = [];
    for (const sec of session.sections) {
      for (const item of sec.items) {
        if (item.item_type === 'vimeo_video' && item.ref_id && thumbnails[item.ref_id] && !thumbs.includes(thumbnails[item.ref_id])) {
          thumbs.push(thumbnails[item.ref_id]);
          if (thumbs.length >= 4) return thumbs;
        }
      }
    }
    return thumbs;
  }, [session, thumbnails]);

  const videoCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'vimeo_video').length, 0);
  const pdfCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'pdf').length, 0);
  const pauseCount = session.sections.reduce((a, s) => a + s.items.filter(i => i.item_type === 'pause').length, 0);
  const nonEmptySections = session.sections.filter(s => s.items.length > 0);

  return (
    <div className="group relative bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-stretch">
        {/* Thumbnail — height-filling left column */}
        <div className="relative w-36 sm:w-44 shrink-0 self-stretch bg-slate-900 min-h-[120px]">
          {videoThumbs.length > 0 ? (
            <>
              {videoThumbs.length === 1 ? (
                <img src={videoThumbs[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="relative overflow-hidden">
                      {videoThumbs[i] ? (
                        <img src={videoThumbs[i]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-slate-800" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onPlay}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 text-slate-900 ml-0.5" />
                </div>
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <Music className="w-8 h-8 text-slate-500" />
            </div>
          )}
          {/* Index badge */}
          <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">#{index + 1}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{session.name}</h3>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDuration(session.estimatedDuration)}
              </span>
              {videoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-slate-400" />{videoCount}
                </span>
              )}
              {pdfCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />{pdfCount}
                </span>
              )}
              {pauseCount > 0 && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-slate-400" />{pauseCount}
                </span>
              )}
            </div>

            {/* Section tags */}
            {nonEmptySections.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {nonEmptySections.slice(0, 4).map(sec => (
                  <span key={sec.id} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                    {sec.title} ({sec.items.length})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              {session.last_used_at
                ? `Zuletzt: ${new Date(session.last_used_at).toLocaleDateString('de')}`
                : 'Noch nicht gespielt'}
            </span>
            <div className="flex gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={onPlay} title="Abspielen">
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={onEdit} title="Bearbeiten">
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={onDuplicate} title="Duplizieren">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={onShare} title="Teilen">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={onDelete} title="Löschen">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PracticePage() {
  const navigate = useNavigate();

  // Sessions
  const { sessions, isLoading: sessionsLoading, deleteSession, duplicateSession } = usePracticeSessions();
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);

  const videoRefIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessions) {
      for (const sec of s.sections) {
        for (const item of sec.items) {
          if (item.item_type === 'vimeo_video' && item.ref_id) ids.add(item.ref_id);
        }
      }
    }
    return Array.from(ids);
  }, [sessions]);

  const { data: thumbnails = {} } = useQuery({
    queryKey: ['session-thumbnails', videoRefIds],
    queryFn: async () => {
      if (videoRefIds.length === 0) return {};
      const { data } = await (supabase as any).from('videos').select('id, thumbnail_url').in('id', videoRefIds);
      const map: Record<string, string> = {};
      if (data) for (const v of data) { if (v.thumbnail_url) map[v.id] = v.thumbnail_url; }
      return map;
    },
    enabled: videoRefIds.length > 0,
  });

  // Journal & Todos
  const [activeJournalTab, setActiveJournalTab] = useState('journal');
  const [journalEntries, setJournalEntries] = useState(mockJournalEntries);
  const [todos, setTodos] = useState(mockTodos);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);

  const toggleTodo = (id: string) => setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const handleAddJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    setJournalEntries(prev => [{ ...entry, id: `journal-${Date.now()}` }, ...prev]);
  };

  const handleAddTodo = (todo: Omit<Todo, 'id' | 'completed'>) => {
    setTodos(prev => [{ ...todo, id: `todo-${Date.now()}`, completed: false }, ...prev]);
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── LEFT: Übesessions (prominent) ─────────────────────────────── */}
        <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <ListMusic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground">Übesessions</h2>
                <p className="text-xs text-muted-foreground">
                  {sessions.length > 0
                    ? `${sessions.length} ${sessions.length === 1 ? 'Session' : 'Sessions'}`
                    : 'Strukturierte Übungs-Playlists'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/app/practice/sessions/new')}
              className="gap-2 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Neue Session</span>
            </Button>
          </div>

          {/* Sessions list */}
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-float">
                <Music className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Noch keine Sessions</h3>
              <p className="text-muted-foreground text-sm mb-6">Erstelle deine erste Übesession und starte strukturiert mit dem Üben!</p>
              <Button onClick={() => navigate('/app/practice/sessions/new')} className="gap-2 rounded-xl hover:scale-105 transition-transform duration-200">
                <Plus className="w-4 h-4" /> Erste Session erstellen
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                >
                  <SessionCard
                    session={session}
                    index={i}
                    thumbnails={thumbnails}
                    onPlay={() => navigate(`/app/practice/sessions/${session.id}/play`)}
                    onEdit={() => navigate(`/app/practice/sessions/${session.id}/edit`)}
                    onDuplicate={() => duplicateSession.mutate(session.id)}
                    onShare={() => setShareSessionId(session.id)}
                    onDelete={() => { if (confirm('Session löschen?')) deleteSession.mutate(session.id); }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Journal & Todos ─────────────────────────────────────── */}
        <div
          className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg opacity-0 animate-fade-in lg:sticky lg:top-6"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <Tabs value={activeJournalTab} onValueChange={setActiveJournalTab} className="w-full">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-slate-100">
              <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="journal"
                  className="gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Journal
                </TabsTrigger>
                <TabsTrigger
                  value="todos"
                  className="gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Aufgaben
                  {activeTodos.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                      {activeTodos.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => activeJournalTab === 'journal' ? setJournalDialogOpen(true) : setTodoDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{activeJournalTab === 'journal' ? 'Eintrag' : 'Aufgabe'}</span>
              </Button>
            </div>

            {/* Journal */}
            <TabsContent value="journal" className="p-4 space-y-3 m-0 max-h-[70vh] overflow-y-auto">
              {journalEntries.length > 0 ? (
                journalEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                  >
                    <JournalEntryCard entry={entry} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm">Noch keine Einträge</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setJournalDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> Ersten Eintrag erstellen
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Todos */}
            <TabsContent value="todos" className="p-4 m-0 max-h-[70vh] overflow-y-auto">
              {todos.length > 0 ? (
                <div className="space-y-5">
                  {activeTodos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offen ({activeTodos.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {activeTodos.map(todo => (
                          <TodoItem key={todo.id} todo={todo} onToggle={() => toggleTodo(todo.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {completedTodos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Erledigt ({completedTodos.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {completedTodos.map(todo => (
                          <TodoItem key={todo.id} todo={todo} onToggle={() => toggleTodo(todo.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm">Keine Aufgaben</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setTodoDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> Aufgabe erstellen
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <JournalEntryDialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen} onSave={handleAddJournalEntry} />
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} onSave={handleAddTodo} />
      {shareSessionId && <ShareSessionDialog sessionId={shareSessionId} onClose={() => setShareSessionId(null)} />}
    </div>
  );
}
