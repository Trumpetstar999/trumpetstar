import { createElement, useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, RefreshCw, CheckCircle, XCircle, Clock, Search, MousePointerClick } from 'lucide-react';
import { format } from 'date-fns';

interface EmailLogEntry {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  created_at: string | null;
  template_id: string | null;
  sequence_id: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: 'Gesendet', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
  queued: { label: 'In Warteschlange', color: 'text-amber-600 bg-amber-50', icon: Clock },
  failed: { label: 'Fehler', color: 'text-red-600 bg-red-50', icon: XCircle },
  opened: { label: 'Geöffnet', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  clicked: { label: 'Geklickt', color: 'text-violet-600 bg-violet-50', icon: MousePointerClick },
};

export function EmailLogTab() {
  const { data: logs, loading, refetch } = useRealtimeTable<EmailLogEntry>('email_log');
  const [search, setSearch] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test-E-Mail');
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);

  const filtered = logs.filter(l =>
    !search ||
    l.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
    l.subject.toLowerCase().includes(search.toLowerCase())
  );

  async function sendTestEmail() {
    if (!testEmail.trim()) { toast.error('E-Mail-Adresse erforderlich'); return; }
    setSendingTest(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `${supabaseUrl}/functions/v1/send-email`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          html: '<p>Dies ist eine Test-E-Mail vom Trumpetstar Admin-Bereich.</p>',
          text: 'Dies ist eine Test-E-Mail vom Trumpetstar Admin-Bereich.',
        }),
      });
      if (res.ok) {
        toast.success('Test-E-Mail gesendet!');
        setShowTestForm(false);
        refetch();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Fehler beim Senden');
      }
    } catch (e) {
      toast.error('Fehler: ' + String(e));
    } finally {
      setSendingTest(false);
    }
  }

  const statusInfo = (s: string | null) => STATUS_CONFIG[s || 'queued'] || STATUS_CONFIG.queued;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="admin-input pl-9 w-full" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={refetch} className="admin-btn flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
        <button onClick={() => setShowTestForm(!showTestForm)} className="admin-btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" /> Test senden
        </button>
      </div>

      {showTestForm && (
        <div className="admin-card p-4 space-y-3 border-2 border-blue-100">
          <h3 className="text-sm font-semibold text-slate-900">Test-E-Mail senden</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Empfänger</label>
              <input className="admin-input w-full" type="email" placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Betreff</label>
              <input className="admin-input w-full" value={testSubject} onChange={e => setTestSubject(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={sendTestEmail} disabled={sendingTest} className="admin-btn-primary flex items-center gap-2">
              {sendingTest ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sende...</> : <><Send className="w-4 h-4" /> Senden</>}
            </button>
            <button onClick={() => setShowTestForm(false)} className="admin-btn">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`admin-card p-3 flex items-center gap-3 ${cfg.color}`}>
            <cfg.icon className="w-5 h-5" />
            <div>
              <div className="text-lg font-bold">{logs.filter(l => (l.status || 'queued') === key).length}</div>
              <div className="text-xs">{cfg.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="text-slate-400 text-sm py-8 text-center">Lade...</div> : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Empfänger', 'Betreff', 'Status', 'Gesendet', 'Geöffnet'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const info = statusInfo(log.status);
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{log.recipient_name || log.recipient_email}</div>
                      {log.recipient_name && <div className="text-xs text-slate-500">{log.recipient_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{log.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                        <info.icon className="w-3 h-3" />
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.sent_at ? format(new Date(log.sent_at), 'dd.MM.yy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.opened_at ? format(new Date(log.opened_at), 'dd.MM.yy HH:mm') : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Keine E-Mails gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
