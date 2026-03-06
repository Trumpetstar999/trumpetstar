import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, Check, X, Search, Filter, ChevronDown,
  Globe, Target, FileText, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface SeoItem {
  id: string;
  title: string;
  cluster: string | null;
  keyword: string | null;
  intent: string | null;
  content_type: string | null;
  status: string | null;
  priority: string | null;
  target_url: string | null;
  publish_date: string | null;
  quality_score: number | null;
  outline: string | null;
  llm_prompt: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-slate-100 text-slate-600',
  planned: 'bg-blue-100 text-blue-700',
  writing: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUSES = ['idea', 'planned', 'writing', 'review', 'published', 'archived'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const INTENTS = ['informational', 'commercial', 'transactional', 'navigational'];
const CONTENT_TYPES = ['article', 'landing_page', 'faq', 'guide', 'comparison'];

export function KeywordMap() {
  const { data: items, loading, refetch } = useRealtimeTable<SeoItem>('seo_content_items');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SeoItem>>({});
  const [newItem, setNewItem] = useState({
    title: '', cluster: '', keyword: '', intent: 'informational',
    content_type: 'article', status: 'idea', priority: 'medium',
    target_url: '', llm_prompt: '',
  });

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.keyword || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.cluster || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || item.status === filterStatus;
    const matchPriority = !filterPriority || item.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  async function createItem() {
    if (!newItem.title.trim()) { toast.error('Titel erforderlich'); return; }
    const { error } = await supabase.from('seo_content_items').insert(newItem as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Content-Item erstellt');
    setCreating(false);
    setNewItem({ title: '', cluster: '', keyword: '', intent: 'informational', content_type: 'article', status: 'idea', priority: 'medium', target_url: '', llm_prompt: '' });
    refetch();
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from('seo_content_items').update({ ...editValues, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    setEditingId(null);
    refetch();
  }

  async function deleteItem(id: string) {
    if (!confirm('Wirklich löschen?')) return;
    const { error } = await supabase.from('seo_content_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  async function quickUpdateStatus(id: string, status: string) {
    const { error } = await supabase.from('seo_content_items').update({ status } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    refetch();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="admin-input pl-9 w-full" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Alle Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="admin-input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Alle Prioritäten</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setCreating(!creating)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STATUSES.map(s => (
          <div key={s} className={`px-3 py-2 rounded-lg text-center cursor-pointer transition-all ${STATUS_COLORS[s]} ${filterStatus === s ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}>
            <div className="text-lg font-bold">{items.filter(i => i.status === s).length}</div>
            <div className="text-[10px] capitalize">{s}</div>
          </div>
        ))}
      </div>

      {creating && (
        <div className="admin-card p-5 space-y-4 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Neues Content-Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Titel</label>
              <input className="admin-input w-full" placeholder="Trumpete lernen für Anfänger" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hauptkeyword</label>
              <input className="admin-input w-full" placeholder="trumpete lernen" value={newItem.keyword} onChange={e => setNewItem({ ...newItem, keyword: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cluster</label>
              <input className="admin-input w-full" placeholder="Anfänger" value={newItem.cluster} onChange={e => setNewItem({ ...newItem, cluster: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Intent</label>
              <select className="admin-input w-full" value={newItem.intent} onChange={e => setNewItem({ ...newItem, intent: e.target.value })}>
                {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Typ</label>
              <select className="admin-input w-full" value={newItem.content_type} onChange={e => setNewItem({ ...newItem, content_type: e.target.value })}>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select className="admin-input w-full" value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Priorität</label>
              <select className="admin-input w-full" value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Ziel-URL</label>
              <input className="admin-input w-full" placeholder="https://trumpetstar.com/trumpete-lernen" value={newItem.target_url} onChange={e => setNewItem({ ...newItem, target_url: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createItem} className="admin-btn-primary">Erstellen</button>
            <button onClick={() => setCreating(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Titel / Keyword', 'Cluster', 'Intent', 'Status', 'Priorität', 'Score', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="font-medium text-sm text-slate-900 truncate">{item.title}</div>
                    {item.keyword && <div className="text-xs text-slate-400 truncate">{item.keyword}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.cluster || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.intent || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[item.status || 'idea']}`}
                      value={item.status || 'idea'}
                      onChange={e => quickUpdateStatus(item.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority || 'medium']}`}>
                      {item.priority || 'medium'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.quality_score || 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{item.quality_score || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {item.target_url && (
                        <a href={item.target_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => { setEditingId(item.id); setEditValues({ ...item }); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Keine Content-Items gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Content-Item bearbeiten</h2>
              <button onClick={() => setEditingId(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Titel</label>
                <input className="admin-input w-full" value={editValues.title || ''} onChange={e => setEditValues({ ...editValues, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Keyword</label>
                  <input className="admin-input w-full" value={editValues.keyword || ''} onChange={e => setEditValues({ ...editValues, keyword: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cluster</label>
                  <input className="admin-input w-full" value={editValues.cluster || ''} onChange={e => setEditValues({ ...editValues, cluster: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select className="admin-input w-full" value={editValues.status || 'idea'} onChange={e => setEditValues({ ...editValues, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Priorität</label>
                  <select className="admin-input w-full" value={editValues.priority || 'medium'} onChange={e => setEditValues({ ...editValues, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ziel-URL</label>
                <input className="admin-input w-full" value={editValues.target_url || ''} onChange={e => setEditValues({ ...editValues, target_url: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Outline</label>
                <textarea className="admin-input w-full h-32 resize-none" value={editValues.outline || ''} onChange={e => setEditValues({ ...editValues, outline: e.target.value })} placeholder="H1, H2, H3 Struktur..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">LLM Prompt</label>
                <textarea className="admin-input w-full h-24 resize-none font-mono text-xs" value={editValues.llm_prompt || ''} onChange={e => setEditValues({ ...editValues, llm_prompt: e.target.value })} placeholder="Schreibe einen SEO-Artikel über..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => saveEdit(editingId)} className="admin-btn-primary flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Speichern</button>
                <button onClick={() => setEditingId(null)} className="admin-btn">Abbrechen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
