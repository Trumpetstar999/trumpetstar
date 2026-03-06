import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Package, HelpCircle, Link2, Building2,
  Plus, Trash2, Save, RefreshCw, Download
} from 'lucide-react';

interface Product { name: string; typ: string; preis: string; kauflink: string; beschreibung: string; }
interface FAQ { frage: string; antwort: string; }
interface Company { name: string; gruender: string; beschreibung: string; telefon: string; email: string; }
interface Links { [key: string]: string; }
interface KB {
  zuletzt_aktualisiert?: string;
  unternehmen: Company;
  produkte: Product[];
  faq: FAQ[];
  links: Links;
}

const EMPTY_KB: KB = {
  unternehmen: { name: '', gruender: '', beschreibung: '', telefon: '', email: '' },
  produkte: [],
  faq: [],
  links: {}
};

const TABS = [
  { id: 'firma', label: 'Firma', icon: Building2 },
  { id: 'produkte', label: 'Produkte', icon: Package },
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'links', label: 'Links', icon: Link2 },
];

function Field({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      )}
    </div>
  );
}

export function KnowledgeBaseManager() {
  const [kb, setKb] = useState<KB>(EMPTY_KB);
  const [activeTab, setActiveTab] = useState('firma');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_base_settings' as any)
      .select('value, updated_at')
      .eq('key', 'main')
      .single();
    if (!error && data) {
      setKb((data as any).value as KB);
      setLastSaved((data as any).updated_at);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const updated = { ...kb, zuletzt_aktualisiert: new Date().toISOString().split('T')[0] };
    const { error } = await supabase
      .from('knowledge_base_settings' as any)
      .update({ value: updated, updated_at: new Date().toISOString() })
      .eq('key', 'main');
    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } else {
      setKb(updated);
      setLastSaved(new Date().toISOString());
      toast.success('✅ Wissensdatenbank gespeichert!');
    }
    setSaving(false);
  };

  const syncFromDigistore = async () => {
    setSyncing(true);
    const { data, error } = await supabase
      .from('digistore24_products')
      .select('name, checkout_url, plan_key, digistore_product_id')
      .eq('is_active', true)
      .order('name');
    if (error) {
      toast.error('Fehler beim Laden der Digistore24-Produkte: ' + error.message);
      setSyncing(false);
      return;
    }
    const synced: Product[] = (data || []).map(p => ({
      name: p.name,
      typ: p.plan_key ?? 'FREE',
      preis: '',
      kauflink: p.checkout_url
        ? p.checkout_url
        : `https://www.digistore24.com/product/${p.digistore_product_id}`,
      beschreibung: '',
    }));
    // Merge: keep existing entries that aren't in synced list, add/update synced ones
    setKb(k => {
      const existingMap = new Map(k.produkte.map(p => [p.name, p]));
      synced.forEach(p => {
        if (existingMap.has(p.name)) {
          const ex = existingMap.get(p.name)!;
          existingMap.set(p.name, {
            ...ex,
            typ: p.typ,
            kauflink: p.kauflink || ex.kauflink,
          });
        } else {
          existingMap.set(p.name, p);
        }
      });
      return { ...k, produkte: Array.from(existingMap.values()) };
    });
    toast.success(`✅ ${synced.length} Produkte aus Digistore24 synchronisiert!`);
    setSyncing(false);
  };

  const updateFirma = (field: keyof Company, val: string) =>
    setKb(k => ({ ...k, unternehmen: { ...k.unternehmen, [field]: val } }));

  const updateProduct = (i: number, field: keyof Product, val: string) =>
    setKb(k => ({ ...k, produkte: k.produkte.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));

  const addProduct = () =>
    setKb(k => ({ ...k, produkte: [...k.produkte, { name: '', typ: '', preis: '', kauflink: '', beschreibung: '' }] }));

  const removeProduct = (i: number) =>
    setKb(k => ({ ...k, produkte: k.produkte.filter((_, idx) => idx !== i) }));

  const updateFAQ = (i: number, field: keyof FAQ, val: string) =>
    setKb(k => ({ ...k, faq: k.faq.map((f, idx) => idx === i ? { ...f, [field]: val } : f) }));

  const addFAQ = () =>
    setKb(k => ({ ...k, faq: [...k.faq, { frage: '', antwort: '' }] }));

  const removeFAQ = (i: number) =>
    setKb(k => ({ ...k, faq: k.faq.filter((_, idx) => idx !== i) }));

  const updateLink = (oldKey: string, newKey: string, val: string) => {
    setKb(k => {
      const links = { ...k.links };
      if (oldKey !== newKey) delete links[oldKey];
      links[newKey] = val;
      return { ...k, links };
    });
  };

  const addLink = () =>
    setKb(k => ({ ...k, links: { ...k.links, 'neuer_link': 'https://' } }));

  const removeLink = (key: string) =>
    setKb(k => { const links = { ...k.links }; delete links[key]; return { ...k, links }; });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Lade Wissensdatenbank…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Valentin liest diese Datenbank automatisch beim Erstellen von E-Mail-Entwürfen.
            {lastSaved && <span className="ml-2 text-slate-400">Zuletzt gespeichert: {new Date(lastSaved).toLocaleString('de-AT')}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="admin-btn flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Neu laden
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="admin-btn-primary flex items-center gap-2 text-sm"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'produkte' && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 rounded-full">{kb.produkte.length}</span>}
              {tab.id === 'faq' && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 rounded-full">{kb.faq.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-card p-6">

        {/* Firma */}
        {activeTab === 'firma' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Firmenname" value={kb.unternehmen.name} onChange={v => updateFirma('name', v)} />
            <Field label="Gründer" value={kb.unternehmen.gruender} onChange={v => updateFirma('gruender', v)} />
            <Field label="Telefon" value={kb.unternehmen.telefon} onChange={v => updateFirma('telefon', v)} />
            <Field label="E-Mail" value={kb.unternehmen.email} onChange={v => updateFirma('email', v)} />
            <div className="col-span-2">
              <Field label="Beschreibung" value={kb.unternehmen.beschreibung} onChange={v => updateFirma('beschreibung', v)} multiline />
            </div>
          </div>
        )}

        {/* Produkte */}
        {activeTab === 'produkte' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <p className="text-xs text-slate-500">{kb.produkte.length} Produkte in der Wissensdatenbank</p>
              <button
                onClick={syncFromDigistore}
                disabled={syncing}
                className="admin-btn flex items-center gap-2 text-sm"
              >
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {syncing ? 'Synchronisiere…' : 'Sync von Digistore24'}
              </button>
            </div>
            {kb.produkte.map((p, i) => (
              <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{p.name || `Produkt ${i + 1}`}</span>
                  <button onClick={() => removeProduct(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" value={p.name} onChange={v => updateProduct(i, 'name', v)} />
                  <Field label="Typ" value={p.typ} onChange={v => updateProduct(i, 'typ', v)} />
                  <Field label="Preis" value={p.preis} onChange={v => updateProduct(i, 'preis', v)} />
                  <Field label="Kauflink" value={p.kauflink} onChange={v => updateProduct(i, 'kauflink', v)} />
                  <div className="col-span-2">
                    <Field label="Beschreibung" value={p.beschreibung} onChange={v => updateProduct(i, 'beschreibung', v)} multiline />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addProduct} className="admin-btn flex items-center gap-2 w-full justify-center">
              <Plus className="w-4 h-4" /> Produkt hinzufügen
            </button>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            {kb.faq.map((f, i) => (
              <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">FAQ {i + 1}</span>
                  <button onClick={() => removeFAQ(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Field label="Frage" value={f.frage} onChange={v => updateFAQ(i, 'frage', v)} />
                <Field label="Antwort" value={f.antwort} onChange={v => updateFAQ(i, 'antwort', v)} multiline />
              </div>
            ))}
            <button onClick={addFAQ} className="admin-btn flex items-center gap-2 w-full justify-center">
              <Plus className="w-4 h-4" /> FAQ hinzufügen
            </button>
          </div>
        )}

        {/* Links */}
        {activeTab === 'links' && (
          <div className="space-y-3">
            {Object.entries(kb.links).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="text"
                  value={key}
                  onChange={e => updateLink(key, e.target.value, val)}
                  placeholder="Schlüssel (z.B. shop)"
                  className="w-40 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="url"
                  value={val}
                  onChange={e => updateLink(key, key, e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <a href={val} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:text-blue-700">
                  <Link2 className="w-4 h-4" />
                </a>
                <button onClick={() => removeLink(key)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addLink} className="admin-btn flex items-center gap-2 w-full justify-center">
              <Plus className="w-4 h-4" /> Link hinzufügen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
