import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X, Check, Eye } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_key: string;
  display_name: string;
  description: string | null;
  subject_de: string;
  subject_en: string;
  subject_es: string;
  body_html_de: string;
  body_html_en: string;
  body_html_es: string;
  created_at: string;
  updated_at: string;
}

type Lang = 'de' | 'en' | 'es';

export function TemplatesMarketingTab() {
  const { data: templates, loading, refetch } = useRealtimeTable<EmailTemplate>('email_templates');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EmailTemplate>>({});
  const [creating, setCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_key: '', display_name: '', description: '',
    subject_de: '', subject_en: '', subject_es: '',
    body_html_de: '', body_html_en: '', body_html_es: '',
  });
  const [activeLang, setActiveLang] = useState<Lang>('de');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const LANGS: { id: Lang; label: string }[] = [
    { id: 'de', label: 'DE' },
    { id: 'en', label: 'EN' },
    { id: 'es', label: 'ES' },
  ];

  async function createTemplate() {
    if (!newTemplate.template_key.trim() || !newTemplate.display_name.trim()) {
      toast.error('Key und Name erforderlich'); return;
    }
    const { error } = await supabase.from('email_templates').insert(newTemplate as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Template erstellt');
    setCreating(false);
    setNewTemplate({ template_key: '', display_name: '', description: '', subject_de: '', subject_en: '', subject_es: '', body_html_de: '', body_html_en: '', body_html_es: '' });
    refetch();
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from('email_templates').update({ ...editValues, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gespeichert');
    setEditingId(null);
    refetch();
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Template wirklich löschen?')) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    refetch();
  }

  function startEdit(t: EmailTemplate) {
    setEditingId(t.id);
    setEditValues({ ...t });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Marketing E-Mail-Templates für Sequenzen und Kampagnen.</p>
        <button onClick={() => setCreating(!creating)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neues Template
        </button>
      </div>

      {creating && (
        <div className="admin-card p-5 space-y-4 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Neues Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Template Key</label>
              <input className="admin-input w-full font-mono" placeholder="welcome_email" value={newTemplate.template_key} onChange={e => setNewTemplate({ ...newTemplate, template_key: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Anzeigename</label>
              <input className="admin-input w-full" placeholder="Willkommens-E-Mail" value={newTemplate.display_name} onChange={e => setNewTemplate({ ...newTemplate, display_name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
            <input className="admin-input w-full" value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
          </div>
          {/* Language tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setActiveLang(l.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeLang === l.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                {l.label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Betreff ({activeLang.toUpperCase()})</label>
            <input className="admin-input w-full" value={(newTemplate as any)[`subject_${activeLang}`]} onChange={e => setNewTemplate({ ...newTemplate, [`subject_${activeLang}`]: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">HTML-Body ({activeLang.toUpperCase()})</label>
            <textarea className="admin-input w-full h-32 resize-none font-mono text-xs" value={(newTemplate as any)[`body_html_${activeLang}`]} onChange={e => setNewTemplate({ ...newTemplate, [`body_html_${activeLang}`]: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={createTemplate} className="admin-btn-primary">Erstellen</button>
            <button onClick={() => setCreating(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="admin-card overflow-hidden">
              {editingId === t.id ? (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Anzeigename</label>
                      <input className="admin-input w-full" value={editValues.display_name || ''} onChange={e => setEditValues({ ...editValues, display_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Beschreibung</label>
                      <input className="admin-input w-full" value={editValues.description || ''} onChange={e => setEditValues({ ...editValues, description: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {LANGS.map(l => (
                      <button key={l.id} onClick={() => setActiveLang(l.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeLang === l.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Betreff ({activeLang.toUpperCase()})</label>
                    <input className="admin-input w-full" value={(editValues as any)[`subject_${activeLang}`] || ''} onChange={e => setEditValues({ ...editValues, [`subject_${activeLang}`]: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">HTML-Body ({activeLang.toUpperCase()})</label>
                    <textarea className="admin-input w-full h-40 resize-none font-mono text-xs" value={(editValues as any)[`body_html_${activeLang}`] || ''} onChange={e => setEditValues({ ...editValues, [`body_html_${activeLang}`]: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(t.id)} className="admin-btn-primary flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Speichern</button>
                    <button onClick={() => setEditingId(null)} className="admin-btn">Abbrechen</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-900">{t.display_name}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{t.template_key}</div>
                    {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                  </div>
                  <div className="text-xs text-slate-400">DE: {t.subject_de ? '✓' : '—'} EN: {t.subject_en ? '✓' : '—'} ES: {t.subject_es ? '✓' : '—'}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewHtml(t.body_html_de)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {templates.length === 0 && (
            <div className="admin-card p-12 text-center text-slate-400 text-sm">Keine Marketing-Templates</div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewHtml(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Template Vorschau</h3>
              <button onClick={() => setPreviewHtml(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-5">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-96 border-0"
                title="E-Mail Vorschau"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
