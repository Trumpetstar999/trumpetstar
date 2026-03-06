import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Inbox, FileEdit, Clock, User, ChevronRight, RefreshCw, Archive } from 'lucide-react';

interface InboxEmail {
  id: string;
  imap_uid: number;
  from_raw: string;
  subject: string;
  body: string | null;
  received_at: string;
  draft_body: string | null;
  draft_at: string | null;
  status: 'new' | 'draft_ready' | 'sent' | 'archived';
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function parseSender(from: string) {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2] };
  return { name: from, email: from };
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  draft_ready: 'bg-amber-500/20 text-amber-400',
  sent: 'bg-green-500/20 text-green-400',
  archived: 'bg-slate-500/20 text-slate-400',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  draft_ready: 'Entwurf bereit',
  sent: 'Gesendet',
  archived: 'Archiviert',
};

export function InboxManager() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [selected, setSelected] = useState<InboxEmail | null>(null);
  const [view, setView] = useState<'inbox' | 'drafts'>('inbox');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inbox_emails' as any)
      .select('*')
      .neq('status', 'archived')
      .order('received_at', { ascending: false });
    if (!error && data) setEmails(data as unknown as InboxEmail[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inbox = emails.filter(e => e.status === 'new' || e.status === 'sent');
  const drafts = emails.filter(e => e.status === 'draft_ready');
  const list = view === 'inbox' ? inbox : drafts;

  const markStatus = async (email: InboxEmail, status: InboxEmail['status']) => {
    setUpdating(true);
    await supabase.from('inbox_emails' as any).update({ status }).eq('id', email.id);
    setUpdating(false);
    if (selected?.id === email.id) setSelected({ ...email, status });
    load();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-white/[0.08]">
      {/* ── Sidebar ── */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-white/[0.08]" style={{ background: '#0F172A' }}>
        <div className="px-4 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Postfach</span>
          <button onClick={load} className="text-white/40 hover:text-white/80 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <nav className="p-2 space-y-1">
          <button
            onClick={() => setView('inbox')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              view === 'inbox' ? 'bg-blue-500/15 text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
            }`}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span>Posteingang</span>
            {inbox.length > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                {inbox.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('drafts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              view === 'drafts' ? 'bg-blue-500/15 text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
            }`}
          >
            <FileEdit className="w-4 h-4 flex-shrink-0" />
            <span>Entwürfe</span>
            {drafts.length > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                {drafts.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ── Email List ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.08] overflow-y-auto" style={{ background: '#111827' }}>
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-white/40 text-sm">Lädt…</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/40">
            <Mail className="w-8 h-8 opacity-30" />
            <span className="text-sm">Keine E-Mails</span>
          </div>
        ) : (
          list.map(email => {
            const sender = parseSender(email.from_raw);
            const isSelected = selected?.id === email.id;
            return (
              <button
                key={email.id}
                onClick={() => setSelected(email)}
                className={`w-full text-left px-4 py-3.5 border-b border-white/[0.05] transition-all ${
                  isSelected ? 'bg-blue-500/10' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-white text-xs font-medium truncate">{sender.name}</span>
                  <span className="text-white/30 text-[10px] flex-shrink-0">{formatDate(email.received_at)}</span>
                </div>
                <div className="text-white/70 text-xs font-medium truncate mb-1">{email.subject}</div>
                <div className="flex items-center justify-between">
                  <span className="text-white/35 text-[10px] truncate">{email.body?.substring(0, 50)}…</span>
                  {isSelected && <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Detail View ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#1E293B' }}>
        {!selected ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/30">
            <Mail className="w-12 h-12 opacity-20" />
            <span className="text-sm">E-Mail auswählen</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-base mb-1 truncate">{selected.subject}</h2>
                  <div className="flex items-center gap-3 text-white/50 text-xs">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {parseSender(selected.from_raw).email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selected.received_at).toLocaleString('de-AT')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[selected.status]}`}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected.status !== 'archived' && (
                    <button
                      onClick={() => markStatus(selected, 'archived')}
                      disabled={updating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archivieren
                    </button>
                  )}
                  {selected.status === 'draft_ready' && (
                    <button
                      onClick={() => markStatus(selected, 'sent')}
                      disabled={updating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                    >
                      ✓ Als gesendet markieren
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Mail */}
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Eingehende E-Mail</div>
                <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {selected.body || '(kein Text-Inhalt)'}
                  </pre>
                </div>
              </div>

              {/* AI Draft */}
              {selected.draft_body && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">
                      Valentin's Entwurf
                    </div>
                    <span className="text-[10px] text-amber-400/70">
                      — generiert {selected.draft_at ? new Date(selected.draft_at).toLocaleString('de-AT') : ''}
                    </span>
                  </div>
                  <div className="bg-amber-500/[0.06] rounded-xl p-4 border border-amber-500/20">
                    <pre className="text-white/90 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {selected.draft_body}
                    </pre>
                  </div>
                  <p className="text-white/30 text-xs mt-2">
                    ↑ Dieser Entwurf liegt auch in deinem Drafts-Ordner bei valentin@trumpetstar.com
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
