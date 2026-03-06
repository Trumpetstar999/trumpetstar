import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { Search, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  name: string | null;
  stage: string | null;
  created_at: string;
}

interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string;
  status: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string | null;
}

export function FlowsTab() {
  const { data: leads, loading } = useRealtimeTable<Lead>('leads');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadLogs, setLeadLogs] = useState<EmailLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const filtered = leads.filter(l =>
    !search ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.name || l.first_name || '').toLowerCase().includes(search.toLowerCase())
  );

  async function selectLead(lead: Lead) {
    setSelectedLead(lead);
    setLoadingLogs(true);
    const { data } = await supabase
      .from('email_log')
      .select('*')
      .eq('recipient_email', lead.email)
      .order('created_at', { ascending: false });
    setLeadLogs((data || []) as EmailLogEntry[]);
    setLoadingLogs(false);
  }

  const statusIcon = (s: string | null) => {
    if (s === 'sent' || s === 'opened') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Lead List */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="admin-input pl-9 w-full" placeholder="Lead suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="space-y-1">
          {loading ? (
            <div className="text-slate-400 text-sm py-4 text-center">Lade...</div>
          ) : filtered.slice(0, 50).map(lead => (
            <button
              key={lead.id}
              onClick={() => selectLead(lead)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedLead?.id === lead.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="font-medium text-sm text-slate-900 truncate">{lead.name || lead.first_name || lead.email}</div>
              <div className="text-xs text-slate-500 truncate">{lead.email}</div>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-slate-400 text-sm py-4 text-center">Keine Leads</div>
          )}
        </div>
      </div>

      {/* E-Mail Flow */}
      <div className="md:col-span-2">
        {!selectedLead ? (
          <div className="admin-card p-12 text-center text-slate-400">
            <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Lead auswählen um E-Mail-Flow anzuzeigen</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="admin-card p-4">
              <h3 className="font-semibold text-slate-900">{selectedLead.name || selectedLead.first_name || selectedLead.email}</h3>
              <p className="text-sm text-slate-500">{selectedLead.email} · Lead seit {format(new Date(selectedLead.created_at), 'dd.MM.yyyy')}</p>
            </div>

            {loadingLogs ? (
              <div className="text-slate-400 text-sm py-4 text-center">Lade E-Mail-Verlauf...</div>
            ) : leadLogs.length === 0 ? (
              <div className="admin-card p-12 text-center text-slate-400">
                <p className="text-sm">Keine E-Mails für diesen Lead</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leadLogs.map((log, idx) => (
                  <div key={log.id} className="admin-card p-4 flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {idx + 1}
                      </div>
                      {idx < leadLogs.length - 1 && <div className="w-0.5 h-4 bg-slate-200 mt-1" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {statusIcon(log.status)}
                        <span className="font-medium text-sm text-slate-900">{log.subject}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {log.sent_at ? `Gesendet: ${format(new Date(log.sent_at), 'dd.MM.yyyy HH:mm')}` : 'Noch nicht gesendet'}
                        {log.opened_at && ` · Geöffnet: ${format(new Date(log.opened_at), 'dd.MM.yyyy HH:mm')}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
