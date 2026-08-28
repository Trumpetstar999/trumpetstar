import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Plus, CheckCircle, XCircle, Upload, Users, Target, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

type Lang = 'de' | 'en' | 'es' | 'sl';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'de', label: 'Deutsch' },
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
  { key: 'sl', label: 'Slovenščina' },
];

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers?: number;
}

interface Settings {
  id: string;
  auto_sync_enabled: boolean;
  list_id_de: number | null;
  list_id_en: number | null;
  list_id_es: number | null;
  list_id_sl: number | null;
}

interface SyncLog {
  id: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  synced_count: number;
  skipped_count: number;
  error_count: number;
  last_error: string | null;
}

const SOURCES: { key: 'leads' | 'users' | 'customers'; label: string; icon: typeof Users }[] = [
  { key: 'leads', label: 'Leads', icon: Target },
  { key: 'users', label: 'App-Nutzer', icon: Users },
  { key: 'customers', label: 'Digistore24-Kunden', icon: CreditCard },
];

export function BrevoTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [lists, setLists] = useState<BrevoList[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from('brevo_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setSettings(data as Settings);
  }, []);

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('brevo_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    setLogs((data ?? []) as SyncLog[]);
  }, []);

  const loadLists = useCallback(async () => {
    setConnectionError(null);
    const { data, error } = await supabase.functions.invoke('brevo-lists', { method: 'GET' });
    if (error) {
      setConnectionError(error.message);
      setLists([]);
      setAccount(null);
      return;
    }
    const res = data as { lists?: BrevoList[]; account?: { companyName?: string; email?: string } | null; error?: string };
    if (res?.error) {
      setConnectionError(res.error);
      return;
    }
    setLists(res?.lists ?? []);
    setAccount(res?.account?.companyName || res?.account?.email || 'verbunden');
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadLogs(), loadLists()]);
      setLoading(false);
    })();
  }, [loadSettings, loadLogs, loadLists]);

  async function patchSettings(patch: Partial<Settings>) {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from('brevo_settings').update(patch).eq('id', settings.id);
    setSaving(false);
    if (error) {
      toast.error('Speichern fehlgeschlagen: ' + error.message);
      return;
    }
    setSettings({ ...settings, ...patch });
    toast.success('Gespeichert');
  }

  async function createList() {
    if (!newListName.trim()) return;
    setCreatingList(true);
    const { data, error } = await supabase.functions.invoke('brevo-lists', {
      body: { name: newListName.trim() },
    });
    setCreatingList(false);
    if (error) {
      toast.error('Liste konnte nicht erstellt werden: ' + error.message);
      return;
    }
    const created = (data as { list?: { id: number } })?.list;
    toast.success(`Liste „${newListName}" erstellt${created ? ` (ID ${created.id})` : ''}`);
    setNewListName('');
    await loadLists();
  }

  async function runSync(source?: 'leads' | 'users' | 'customers') {
    setSyncing(source ?? 'all');
    const { data, error } = await supabase.functions.invoke('brevo-sync-all', {
      body: source ? { sources: [source] } : {},
    });
    setSyncing(null);
    await loadLogs();
    if (error) {
      toast.error('Sync fehlgeschlagen: ' + error.message);
      return;
    }
    const results = (data as { results?: Record<string, { synced: number; skipped: number; errors: number }> })?.results ?? {};
    const total = Object.values(results).reduce(
      (acc, r) => ({ synced: acc.synced + r.synced, skipped: acc.skipped + r.skipped, errors: acc.errors + r.errors }),
      { synced: 0, skipped: 0, errors: 0 },
    );
    toast.success(`Sync fertig: ${total.synced} übertragen, ${total.skipped} übersprungen, ${total.errors} Fehler`);
  }

  if (loading) return <div className="text-slate-400 text-sm py-8 text-center">Lade Brevo-Einstellungen...</div>;

  return (
    <div className="space-y-6">
      {/* Connection */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {connectionError ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {connectionError ? 'Brevo nicht erreichbar' : `Brevo verbunden${account ? ` – ${account}` : ''}`}
              </div>
              <div className="text-xs text-slate-500">
                {connectionError ?? `${lists.length} Listen im Konto gefunden`}
              </div>
            </div>
          </div>
          <button onClick={loadLists} className="admin-btn flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Verbindung testen
          </button>
        </div>
      </div>

      {/* Auto sync toggle */}
      <div className="admin-card p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Automatischer Sync</div>
          <div className="text-xs text-slate-500">
            Neue Leads, Registrierungen und Käufe werden sofort nach Brevo übertragen.
          </div>
        </div>
        <button
          onClick={() => patchSettings({ auto_sync_enabled: !settings?.auto_sync_enabled })}
          disabled={saving}
          className={`relative w-12 h-7 rounded-full transition-colors ${settings?.auto_sync_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
          aria-label="Automatischen Sync umschalten"
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${settings?.auto_sync_enabled ? 'left-6' : 'left-1'}`}
          />
        </button>
      </div>

      {/* Lists per language */}
      <div className="admin-card p-4 space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Listen pro Sprache</div>
          <div className="text-xs text-slate-500">
            Kontakte werden je nach Sprache in die gewählte Brevo-Liste einsortiert.
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LANGS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <select
                className="admin-input w-full"
                value={settings?.[`list_id_${key}` as 'list_id_de'] ?? ''}
                onChange={(e) =>
                  patchSettings({
                    [`list_id_${key}`]: e.target.value ? Number(e.target.value) : null,
                  } as Partial<Settings>)
                }
              >
                <option value="">— keine Liste —</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (#{l.id})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 pt-2 border-t border-slate-100">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Neue Brevo-Liste anlegen</label>
            <input
              className="admin-input w-full"
              placeholder="z.B. Trumpetstar DE"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
          </div>
          <button onClick={createList} disabled={creatingList || !newListName.trim()} className="admin-btn flex items-center gap-2">
            <Plus className="w-4 h-4" /> Anlegen
          </button>
        </div>
      </div>

      {/* Full sync */}
      <div className="admin-card p-4 space-y-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Voll-Sync</div>
          <div className="text-xs text-slate-500">Überträgt alle bestehenden Kontakte nach Brevo.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              onClick={() => runSync(s.key)}
              disabled={!!syncing}
              className="admin-btn flex items-center gap-2"
            >
              {syncing === s.key ? <RefreshCw className="w-4 h-4 animate-spin" /> : <s.icon className="w-4 h-4" />}
              {s.label}
            </button>
          ))}
          <button onClick={() => runSync()} disabled={!!syncing} className="admin-btn-primary flex items-center gap-2">
            {syncing === 'all' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Alle synchronisieren
          </button>
        </div>
      </div>

      {/* Log */}
      <div className="admin-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Sync-Protokoll</div>
          <button onClick={loadLogs} className="admin-btn flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Quelle', 'Start', 'Übertragen', 'Übersprungen', 'Fehler', 'Meldung'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{l.source}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(l.started_at), 'dd.MM.yy HH:mm')}</td>
                <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{l.synced_count}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{l.skipped_count}</td>
                <td className="px-4 py-3 text-sm text-red-600">{l.error_count}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[280px] truncate">{l.last_error ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                  Noch keine Sync-Läufe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
