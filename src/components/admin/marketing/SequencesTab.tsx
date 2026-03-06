import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  is_active: boolean;
  segment_id: string | null;
  created_at: string | null;
}

interface SequenceStep {
  id: string;
  sequence_id: string | null;
  step_order: number;
  template_id: string | null;
  delay_days: number | null;
  delay_hours: number | null;
  condition_type: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Segment {
  id: string;
  name: string;
  code: string;
}

const TRIGGER_EVENTS = [
  { value: 'new_lead', label: 'Neuer Lead' },
  { value: 'signup', label: 'Registrierung' },
  { value: 'trial_start', label: 'Trial Start' },
  { value: 'purchase', label: 'Kauf' },
  { value: 'churn_risk', label: 'Churn-Risiko' },
];

export function SequencesTab() {
  const { data: sequences, loading, refetch } = useRealtimeTable<Sequence>('email_sequences');
  const { data: segments } = useRealtimeTable<Segment>('lead_segments');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, SequenceStep[]>>({});
  const [creating, setCreating] = useState(false);
  const [newSeq, setNewSeq] = useState({ name: '', description: '', trigger_event: 'new_lead', segment_id: '' });

  async function loadSteps(seqId: string) {
    const { data } = await supabase
      .from('email_sequence_steps')
      .select('*')
      .eq('sequence_id', seqId)
      .order('step_order');
    setSteps(prev => ({ ...prev, [seqId]: (data || []) as SequenceStep[] }));
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadSteps(id);
    }
  }

  async function createSequence() {
    if (!newSeq.name.trim()) { toast.error('Name erforderlich'); return; }
    const { error } = await supabase.from('email_sequences').insert({
      name: newSeq.name,
      description: newSeq.description || null,
      trigger_event: newSeq.trigger_event,
      segment_id: newSeq.segment_id || null,
      is_active: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Sequenz erstellt');
    setNewSeq({ name: '', description: '', trigger_event: 'new_lead', segment_id: '' });
    setCreating(false);
    refetch();
  }

  async function toggleActive(seq: Sequence) {
    const { error } = await supabase.from('email_sequences').update({ is_active: !seq.is_active }).eq('id', seq.id);
    if (error) { toast.error(error.message); return; }
    refetch();
  }

  async function deleteSequence(id: string) {
    if (!confirm('Sequenz wirklich löschen?')) return;
    const { error } = await supabase.from('email_sequences').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  async function addStep(seqId: string) {
    const existing = steps[seqId] || [];
    const { error } = await supabase.from('email_sequence_steps').insert({
      sequence_id: seqId,
      step_order: existing.length + 1,
      delay_days: 1,
      delay_hours: 0,
      condition_type: 'always',
      is_active: true,
    });
    if (error) { toast.error(error.message); return; }
    loadSteps(seqId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">E-Mail-Sequenzen für automatisierte Follow-ups.</p>
        <button onClick={() => setCreating(!creating)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neue Sequenz
        </button>
      </div>

      {creating && (
        <div className="admin-card p-4 space-y-3 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Neue Sequenz</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input className="admin-input w-full" placeholder="Willkommen-Sequenz" value={newSeq.name} onChange={e => setNewSeq({ ...newSeq, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Trigger</label>
              <select className="admin-input w-full" value={newSeq.trigger_event} onChange={e => setNewSeq({ ...newSeq, trigger_event: e.target.value })}>
                {TRIGGER_EVENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Segment (optional)</label>
            <select className="admin-input w-full" value={newSeq.segment_id} onChange={e => setNewSeq({ ...newSeq, segment_id: e.target.value })}>
              <option value="">Alle Segmente</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <textarea className="admin-input w-full h-16 resize-none" value={newSeq.description} onChange={e => setNewSeq({ ...newSeq, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={createSequence} className="admin-btn-primary">Erstellen</button>
            <button onClick={() => setCreating(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="space-y-2">
          {sequences.map(seq => (
            <div key={seq.id} className="admin-card overflow-hidden">
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50/50"
                onClick={() => toggleExpand(seq.id)}
              >
                {expandedId === seq.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <div className="flex-1">
                  <div className="font-medium text-sm text-slate-900">{seq.name}</div>
                  {seq.description && <div className="text-xs text-slate-500 mt-0.5">{seq.description}</div>}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {TRIGGER_EVENTS.find(t => t.value === seq.trigger_event)?.label || seq.trigger_event}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); toggleActive(seq); }}
                  className={`transition-colors ${seq.is_active ? 'text-emerald-500' : 'text-slate-300'}`}
                >
                  {seq.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteSequence(seq.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedId === seq.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schritte ({(steps[seq.id] || []).length})</span>
                    <button onClick={() => addStep(seq.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Schritt hinzufügen
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(steps[seq.id] || []).map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">{idx + 1}</div>
                        <div className="text-sm text-slate-600">
                          Warte {step.delay_days || 0}d {step.delay_hours || 0}h → {step.condition_type || 'always'}
                        </div>
                        <div className="ml-auto text-xs text-slate-400">
                          {step.template_id ? 'Template verknüpft' : 'Kein Template'}
                        </div>
                      </div>
                    ))}
                    {(steps[seq.id] || []).length === 0 && (
                      <div className="text-xs text-slate-400 py-2 text-center">Noch keine Schritte</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {sequences.length === 0 && (
            <div className="admin-card p-12 text-center text-slate-400 text-sm">Noch keine Sequenzen definiert</div>
          )}
        </div>
      )}
    </div>
  );
}
