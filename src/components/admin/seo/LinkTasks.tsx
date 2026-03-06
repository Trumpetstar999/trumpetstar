import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, Link2, ExternalLink } from 'lucide-react';

interface LinkTask {
  id: string;
  from_url: string;
  to_url: string;
  anchor_text: string | null;
  reason: string | null;
  status: string | null;
  content_item_id: string | null;
  created_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-red-100 text-red-500',
};

export function LinkTasks() {
  const { data: tasks, loading, refetch } = useRealtimeTable<LinkTask>('seo_link_tasks');
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ from_url: '', to_url: '', anchor_text: '', reason: '', status: 'todo' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LinkTask>>({});

  async function createTask() {
    if (!newTask.from_url.trim() || !newTask.to_url.trim()) { toast.error('Von- und Ziel-URL erforderlich'); return; }
    const { error } = await supabase.from('seo_link_tasks').insert(newTask as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Link-Task erstellt');
    setCreating(false);
    setNewTask({ from_url: '', to_url: '', anchor_text: '', reason: '', status: 'todo' });
    refetch();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('seo_link_tasks').update({ status } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    refetch();
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from('seo_link_tasks').update(editValues as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    setEditingId(null);
    refetch();
  }

  async function deleteTask(id: string) {
    if (!confirm('Wirklich löschen?')) return;
    const { error } = await supabase.from('seo_link_tasks').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-600">Interne Verlinkungsaufgaben verwalten.</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">{todoCount} offen</span>
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">{doneCount} erledigt</span>
          </div>
        </div>
        <button onClick={() => setCreating(!creating)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neue Aufgabe
        </button>
      </div>

      {creating && (
        <div className="admin-card p-4 space-y-3 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Neuer Link-Task</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Von URL</label>
              <input className="admin-input w-full" placeholder="https://trumpetstar.com/..." value={newTask.from_url} onChange={e => setNewTask({ ...newTask, from_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nach URL</label>
              <input className="admin-input w-full" placeholder="https://trumpetstar.com/..." value={newTask.to_url} onChange={e => setNewTask({ ...newTask, to_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ankertext</label>
              <input className="admin-input w-full" placeholder="Trumpete lernen" value={newTask.anchor_text} onChange={e => setNewTask({ ...newTask, anchor_text: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Begründung</label>
              <input className="admin-input w-full" placeholder="Warum dieser Link?" value={newTask.reason} onChange={e => setNewTask({ ...newTask, reason: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createTask} className="admin-btn-primary">Erstellen</button>
            <button onClick={() => setCreating(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="admin-card p-4">
              {editingId === task.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Von URL</label>
                      <input className="admin-input w-full text-sm" value={editValues.from_url || ''} onChange={e => setEditValues({ ...editValues, from_url: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Nach URL</label>
                      <input className="admin-input w-full text-sm" value={editValues.to_url || ''} onChange={e => setEditValues({ ...editValues, to_url: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Ankertext</label>
                      <input className="admin-input w-full text-sm" value={editValues.anchor_text || ''} onChange={e => setEditValues({ ...editValues, anchor_text: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Begründung</label>
                      <input className="admin-input w-full text-sm" value={editValues.reason || ''} onChange={e => setEditValues({ ...editValues, reason: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(task.id)} className="admin-btn-primary flex items-center gap-1 text-sm"><Check className="w-3.5 h-3.5" /> Speichern</button>
                    <button onClick={() => setEditingId(null)} className="admin-btn text-sm">Abbrechen</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <Link2 className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={task.from_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[200px]">{task.from_url}</a>
                      <span className="text-slate-400 text-xs">→</span>
                      <a href={task.to_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[200px]">{task.to_url}</a>
                    </div>
                    {task.anchor_text && <div className="text-xs text-slate-500 mt-1">Ankertext: <span className="font-medium">{task.anchor_text}</span></div>}
                    {task.reason && <div className="text-xs text-slate-400 mt-0.5">{task.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[task.status || 'todo']}`}
                      value={task.status || 'todo'}
                      onChange={e => updateStatus(task.id, e.target.value)}
                    >
                      {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => { setEditingId(task.id); setEditValues({ ...task }); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="admin-card p-12 text-center text-slate-400 text-sm">Keine Link-Tasks</div>
          )}
        </div>
      )}
    </div>
  );
}
