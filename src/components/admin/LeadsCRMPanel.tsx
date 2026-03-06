import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User, Phone, Target, TrendingUp, Edit2, X, Check, Plus,
  Search, List, Star, Activity, LayoutList
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  name: string | null;
  phone: string | null;
  stage: string | null;
  score: number | null;
  assignee: string | null;
  segment: string | null;
  source: string | null;
  product_interest: string | null;
  notes: string | null;
  tags: string[] | null;
  lifetime_value: number | null;
  activity_score: number | null;
  created_at: string;
  last_contact_at: string | null;
  converted_at: string | null;
}

interface LeadActivity {
  id: string;
  lead_id: string | null;
  activity_type: string;
  description: string | null;
  performed_by: string | null;
  created_at: string | null;
}

const STAGES = [
  { id: 'new', label: 'Neu', color: 'bg-slate-100 text-slate-700' },
  { id: 'contacted', label: 'Kontaktiert', color: 'bg-blue-100 text-blue-700' },
  { id: 'qualified', label: 'Qualifiziert', color: 'bg-amber-100 text-amber-700' },
  { id: 'proposal', label: 'Angebot', color: 'bg-purple-100 text-purple-700' },
  { id: 'won', label: 'Gewonnen', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'lost', label: 'Verloren', color: 'bg-red-100 text-red-700' },
];

const ACTIVITY_TYPES = ['email', 'call', 'note', 'meeting', 'task'];

export function LeadsCRMPanel() {
  const { data: leads, loading, refetch } = useRealtimeTable<Lead>('leads');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'note', description: '' });
  const [showActivityForm, setShowActivityForm] = useState(false);

  const filtered = leads.filter(l =>
    !search ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (stageId: string) => filtered.filter(l => (l.stage || 'new') === stageId);

  async function openLead(lead: Lead) {
    setSelectedLead(lead);
    setLoadingActivities(true);
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    setActivities((data || []) as LeadActivity[]);
    setLoadingActivities(false);
  }

  async function savefield(field: string, value: string) {
    if (!selectedLead) return;
    const { error } = await supabase
      .from('leads')
      .update({ [field]: value } as any)
      .eq('id', selectedLead.id);
    if (error) { toast.error('Fehler beim Speichern'); return; }
    toast.success('Gespeichert');
    setSelectedLead({ ...selectedLead, [field]: value });
    setEditingField(null);
    refetch();
  }

  async function addActivity() {
    if (!selectedLead || !newActivity.description.trim()) return;
    const { error } = await supabase.from('lead_activities').insert({
      lead_id: selectedLead.id,
      activity_type: newActivity.type,
      description: newActivity.description,
      performed_by: 'Valentin',
    });
    if (error) { toast.error('Fehler'); return; }
    toast.success('Aktivität hinzugefügt');
    setNewActivity({ type: 'note', description: '' });
    setShowActivityForm(false);
    // refresh activities
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', selectedLead.id)
      .order('created_at', { ascending: false });
    setActivities((data || []) as LeadActivity[]);
    // update last_contact_at
    await supabase.from('leads').update({ last_contact_at: new Date().toISOString() } as any).eq('id', selectedLead.id);
    refetch();
  }

  const stageInfo = (s: string | null) => STAGES.find(x => x.id === (s || 'new')) || STAGES[0];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="admin-input pl-9 w-full"
            placeholder="Leads suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: leads.length, icon: User, color: 'text-blue-600 bg-blue-50' },
          { label: 'Neu', value: leads.filter(l => (l.stage || 'new') === 'new').length, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Qualifiziert', value: leads.filter(l => l.stage === 'qualified').length, icon: Target, color: 'text-purple-600 bg-purple-50' },
          { label: 'Gewonnen', value: leads.filter(l => l.stage === 'won').length, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
        ].map(stat => (
          <div key={stat.label} className="admin-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="admin-card p-12 text-center text-slate-500">Lade Leads...</div>
      ) : viewMode === 'list' ? (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Name / E-Mail', 'Stage', 'Score', 'Segment', 'Assignee', 'Erstellt', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 text-sm">{lead.name || lead.first_name || '—'}</div>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageInfo(lead.stage).color}`}>
                      {stageInfo(lead.stage).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (lead.score || 0))}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{lead.score || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{lead.segment || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{lead.assignee || 'Valentin'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {format(new Date(lead.created_at), 'dd.MM.yy')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openLead(lead)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Keine Leads gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          {STAGES.map(stage => (
            <div key={stage.id} className="min-w-[180px]">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stage.color}`}>{stage.label}</span>
                <span className="text-xs text-slate-400">{byStage(stage.id).length}</span>
              </div>
              <div className="space-y-2">
                {byStage(stage.id).map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="admin-card p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium text-sm text-slate-900 truncate">{lead.name || lead.first_name || lead.email}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{lead.email}</div>
                    {(lead.score || 0) > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, lead.score || 0)}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400">{lead.score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div
            className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{selectedLead.name || selectedLead.first_name || selectedLead.email}</h2>
                <p className="text-sm text-slate-500">{selectedLead.email}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stage Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stage</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => savefield('stage', s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        (selectedLead.stage || 'new') === s.id
                          ? s.color + ' ring-2 ring-offset-1 ring-blue-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { key: 'name', label: 'Name', icon: User },
                { key: 'phone', label: 'Telefon', icon: Phone },
                { key: 'product_interest', label: 'Produktinteresse', icon: Target },
                { key: 'assignee', label: 'Zugewiesen', icon: User },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  {editingField === f.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        className="admin-input flex-1"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && savefield(f.key, editValue)}
                      />
                      <button onClick={() => savefield(f.key, editValue)} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingField(null)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer group"
                      onClick={() => { setEditingField(f.key); setEditValue((selectedLead as any)[f.key] || ''); }}
                    >
                      <span className="text-sm text-slate-700">{(selectedLead as any)[f.key] || <span className="text-slate-400">Nicht gesetzt</span>}</span>
                      <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notizen</label>
                <textarea
                  className="admin-input w-full h-24 resize-none"
                  value={selectedLead.notes || ''}
                  onChange={e => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                  onBlur={e => savefield('notes', e.target.value)}
                  placeholder="Interne Notizen..."
                />
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-400 mb-1">Score</div>
                  <div className="font-semibold text-slate-900">{selectedLead.score || 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-400 mb-1">Lifetime Value</div>
                  <div className="font-semibold text-slate-900">€{selectedLead.lifetime_value || 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-400 mb-1">Segment</div>
                  <div className="font-semibold text-slate-700">{selectedLead.segment || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-400 mb-1">Quelle</div>
                  <div className="font-semibold text-slate-700">{selectedLead.source || '—'}</div>
                </div>
              </div>

              {/* Activities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktivitäten</label>
                  <button
                    onClick={() => setShowActivityForm(!showActivityForm)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Neu
                  </button>
                </div>

                {showActivityForm && (
                  <div className="mb-3 p-3 rounded-lg border border-slate-200 space-y-2">
                    <select
                      className="admin-input w-full text-sm"
                      value={newActivity.type}
                      onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                    >
                      {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea
                      className="admin-input w-full h-20 resize-none text-sm"
                      placeholder="Beschreibung..."
                      value={newActivity.description}
                      onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button onClick={addActivity} className="admin-btn-primary text-xs px-3 py-1.5">Speichern</button>
                      <button onClick={() => setShowActivityForm(false)} className="admin-btn text-xs px-3 py-1.5">Abbrechen</button>
                    </div>
                  </div>
                )}

                {loadingActivities ? (
                  <div className="text-sm text-slate-400">Lade...</div>
                ) : activities.length === 0 ? (
                  <div className="text-sm text-slate-400 py-4 text-center">Keine Aktivitäten</div>
                ) : (
                  <div className="space-y-2">
                    {activities.map(a => (
                      <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-700 capitalize">{a.activity_type}</span>
                            <span className="text-[10px] text-slate-400">
                              {a.created_at ? format(new Date(a.created_at), 'dd.MM.yy HH:mm') : ''}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 mt-0.5">{a.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
