import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit2, Save, Check, X, Sparkles, Loader2 } from 'lucide-react';

interface SeoItem {
  id: string;
  title: string;
  keyword: string | null;
  outline: string | null;
  llm_prompt: string | null;
  status: string | null;
  quality_score: number | null;
  quality_checks: any | null;
  updated_at: string | null;
}

const QUALITY_CHECKS = [
  { key: 'has_keyword_in_title', label: 'Keyword im Titel' },
  { key: 'has_meta_description', label: 'Meta-Description vorhanden' },
  { key: 'has_outline', label: 'Gliederung vorhanden' },
  { key: 'has_internal_links', label: 'Interne Links definiert' },
  { key: 'has_llm_prompt', label: 'LLM-Prompt erstellt' },
  { key: 'has_target_url', label: 'Ziel-URL gesetzt' },
  { key: 'has_publish_date', label: 'Veröffentlichungsdatum geplant' },
];

export function ArticleOS() {
  const { data: items, loading, refetch } = useRealtimeTable<SeoItem>('seo_content_items');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOutline, setEditOutline] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const selected = items.find(i => i.id === selectedId);

  function selectItem(item: SeoItem) {
    setSelectedId(item.id);
    setEditOutline(item.outline || '');
    setEditPrompt(item.llm_prompt || '');
    const savedChecks = typeof item.quality_checks === 'object' && item.quality_checks ? item.quality_checks : {};
    setChecks(savedChecks as Record<string, boolean>);
  }

  async function saveOutline() {
    if (!selectedId) return;
    setSaving(true);
    const qualityScore = Math.round((Object.values(checks).filter(Boolean).length / QUALITY_CHECKS.length) * 100);
    const { error } = await supabase.from('seo_content_items').update({
      outline: editOutline,
      llm_prompt: editPrompt,
      quality_checks: checks,
      quality_score: qualityScore,
      updated_at: new Date().toISOString(),
    } as any).eq('id', selectedId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    refetch();
  }

  function toggleCheck(key: string) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const readyItems = items.filter(i => ['planned', 'writing', 'review'].includes(i.status || ''));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Article List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Artikel in Arbeit ({readyItems.length})</h3>
        {loading ? (
          <div className="text-slate-400 text-sm">Lade...</div>
        ) : readyItems.length === 0 ? (
          <div className="text-slate-400 text-sm py-4 text-center">
            Keine Artikel in Arbeit. Status auf "planned" oder "writing" setzen.
          </div>
        ) : readyItems.map(item => (
          <button
            key={item.id}
            onClick={() => selectItem(item)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              selectedId === item.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <div className="font-medium text-sm text-slate-900 truncate">{item.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{item.keyword || '—'}</span>
              <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.quality_score || 0}%` }} />
              </div>
              <span className="text-xs text-slate-400">{item.quality_score || 0}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="md:col-span-2">
        {!selected ? (
          <div className="admin-card p-12 text-center text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Artikel links auswählen zum Bearbeiten</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="admin-card p-5">
              <h2 className="font-semibold text-slate-900 mb-1">{selected.title}</h2>
              <p className="text-sm text-slate-500">Keyword: {selected.keyword || '—'}</p>
            </div>

            {/* Outline Editor */}
            <div className="admin-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Gliederung</h3>
              <textarea
                className="admin-input w-full h-48 resize-none font-mono text-sm"
                value={editOutline}
                onChange={e => setEditOutline(e.target.value)}
                placeholder="# H1 Titel
## H2 Einleitung
### H3 Unterabschnitt
## H2 Hauptteil
..."
              />
            </div>

            {/* LLM Prompt */}
            <div className="admin-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">LLM-Prompt</h3>
              <textarea
                className="admin-input w-full h-32 resize-none text-sm"
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Schreibe einen SEO-optimierten Artikel mit dem Keyword '...' für die Zielgruppe '...'"
              />
            </div>

            {/* Quality Checklist */}
            <div className="admin-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Quality Checklist</h3>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.round((Object.values(checks).filter(Boolean).length / QUALITY_CHECKS.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {Object.values(checks).filter(Boolean).length}/{QUALITY_CHECKS.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {QUALITY_CHECKS.map(qc => (
                  <label key={qc.key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                        checks[qc.key] ? 'bg-emerald-500 text-white' : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                      onClick={() => toggleCheck(qc.key)}
                    >
                      {checks[qc.key] && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm ${checks[qc.key] ? 'text-slate-900 line-through text-slate-400' : 'text-slate-700'}`}>
                      {qc.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={saveOutline}
              disabled={saving}
              className="admin-btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern...</> : <><Save className="w-4 h-4" /> Alles speichern</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
