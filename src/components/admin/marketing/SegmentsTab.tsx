import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Segment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export function SegmentsTab() {
  const { data: segments, loading, refetch } = useRealtimeTable<Segment>('lead_segments');
  const [creating, setCreating] = useState(false);
  const [newSeg, setNewSeg] = useState({ code: '', name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', description: '' });

  async function createSegment() {
    if (!newSeg.code.trim() || !newSeg.name.trim()) { toast.error('Code und Name erforderlich'); return; }
    const { error } = await supabase.from('lead_segments').insert({
      code: newSeg.code.trim(),
      name: newSeg.name.trim(),
      description: newSeg.description || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Segment erstellt');
    setNewSeg({ code: '', name: '', description: '' });
    setCreating(false);
    refetch();
  }

  async function updateSegment(id: string) {
    const { error } = await supabase.from('lead_segments').update({
      name: editValues.name,
      description: editValues.description || null,
    }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    setEditingId(null);
    refetch();
  }

  async function deleteSegment(id: string) {
    if (!confirm('Segment wirklich löschen?')) return;
    const { error } = await supabase.from('lead_segments').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Lead-Segmente definieren und verwalten.</p>
        <button onClick={() => setCreating(!creating)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neues Segment
        </button>
      </div>

      {creating && (
        <div className="admin-card p-4 space-y-3 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Neues Segment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Code (eindeutig)</label>
              <input className="admin-input w-full" placeholder="z.B. adult_beginner" value={newSeg.code} onChange={e => setNewSeg({ ...newSeg, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input className="admin-input w-full" placeholder="Erwachsene Anfänger" value={newSeg.name} onChange={e => setNewSeg({ ...newSeg, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea className="admin-input w-full h-16 resize-none" placeholder="Optional..." value={newSeg.description} onChange={e => setNewSeg({ ...newSeg, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={createSegment} className="admin-btn-primary">Erstellen</button>
            <button onClick={() => setCreating(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Code', 'Name', 'Beschreibung', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segments.map(seg => (
                <tr key={seg.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">{seg.code}</td>
                  <td className="px-4 py-3">
                    {editingId === seg.id ? (
                      <input className="admin-input w-full text-sm" value={editValues.name} onChange={e => setEditValues({ ...editValues, name: e.target.value })} />
                    ) : (
                      <span className="text-sm font-medium text-slate-900">{seg.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === seg.id ? (
                      <input className="admin-input w-full text-sm" value={editValues.description} onChange={e => setEditValues({ ...editValues, description: e.target.value })} />
                    ) : (
                      <span className="text-sm text-slate-500">{seg.description || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {editingId === seg.id ? (
                        <>
                          <button onClick={() => updateSegment(seg.id)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(seg.id); setEditValues({ name: seg.name, description: seg.description || '' }); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteSegment(seg.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {segments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">Noch keine Segmente definiert</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
