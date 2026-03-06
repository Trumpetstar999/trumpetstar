import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Inbox, Send, Star, Flag, Trash2, RefreshCw, Mail,
  PenSquare, Search, X, Reply, Loader2, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface MailboxEmail {
  id: string;
  imap_uid: number | null;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  folder: string | null;
  is_read: boolean | null;
  is_starred: boolean | null;
  is_flagged: boolean | null;
  ai_draft: string | null;
  ai_draft_at: string | null;
  received_at: string | null;
  sent_at: string | null;
  created_at: string | null;
}

const FOLDERS = [
  { id: 'inbox', label: 'Posteingang', icon: Inbox },
  { id: 'drafts', label: 'Entwürfe', icon: PenSquare },
  { id: 'sent', label: 'Gesendet', icon: Send },
  { id: 'starred', label: 'Markiert', icon: Star },
  { id: 'flagged', label: 'Flagged', icon: Flag },
];

export function MailboxPanel() {
  const { data: emails, loading, refetch } = useRealtimeTable<MailboxEmail>('mailbox_emails');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<MailboxEmail | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [compose, setCompose] = useState({ to: '', subject: '', html: '', text: '' });
  const [sending, setSending] = useState(false);
  // Track which inbox email is the "source" for the current compose reply
  const [replySourceId, setReplySourceId] = useState<string | null>(null);

  const folderEmails = emails.filter(e => {
    if (activeFolder === 'starred') return e.is_starred;
    if (activeFolder === 'flagged') return e.is_flagged;
    if (activeFolder === 'drafts') return !!e.ai_draft;
    return (e.folder || 'inbox') === activeFolder;
  });
  const draftsCount = emails.filter(e => !!e.ai_draft).length;

  const filtered = folderEmails.filter(e =>
    !search ||
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.from_email.toLowerCase().includes(search.toLowerCase()) ||
    (e.from_name || '').toLowerCase().includes(search.toLowerCase())
  );

  async function openEmail(email: MailboxEmail) {
    setSelectedEmail(email);
    if (!email.is_read) {
      await supabase.from('mailbox_emails').update({ is_read: true } as any).eq('id', email.id);
      refetch();
    }
  }

  async function toggleStar(email: MailboxEmail, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from('mailbox_emails').update({ is_starred: !email.is_starred } as any).eq('id', email.id);
    refetch();
  }

  async function deleteEmail(id: string) {
    if (!confirm('E-Mail wirklich löschen?')) return;
    await supabase.from('mailbox_emails').delete().eq('id', id);
    if (selectedEmail?.id === id) setSelectedEmail(null);
    refetch();
  }

  async function syncEmails() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.synced || 0} neue E-Mails synchronisiert`);
        refetch();
      } else {
        toast.error(data.error || 'Sync fehlgeschlagen');
      }
    } catch (e) {
      toast.error('Fehler beim Sync');
    } finally {
      setSyncing(false);
    }
  }

  function textToHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // URLs
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#2563eb">$1</a>')
      // Zeilenumbrüche
      .replace(/\n/g, '<br>')
      // In Absätze aufteilen (doppelte Leerzeilen)
      .replace(/(<br>){2,}/g, '</p><p style="margin:0 0 12px 0">')
      .replace(/^/, '<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;margin:0 0 12px 0">')
      .replace(/$/, '</p>');
  }

  async function sendEmail() {
    if (!compose.to.trim() || !compose.subject.trim()) { toast.error('Empfänger und Betreff erforderlich'); return; }
    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const bodyHtml = compose.html || textToHtml(compose.text);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          to: compose.to,
          subject: compose.subject,
          html: bodyHtml,
          text: compose.text || compose.html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const sentAt = new Date().toISOString();
        // 1. Gesendet-Kopie in mailbox_emails speichern
        const { error: insertError } = await supabase.from('mailbox_emails').insert({
          from_email: 'Valentin@trumpetstar.com',
          from_name: 'Valentin von Trumpetstar',
          to_email: compose.to,
          subject: compose.subject,
          body_text: compose.text || '',
          body_html: bodyHtml,
          snippet: (compose.text || compose.html || '').slice(0, 150),
          folder: 'sent',
          is_read: true,
          sent_at: sentAt,
          received_at: sentAt,
        } as any);

        if (insertError) {
          console.error('[Mailbox] Insert sent copy failed:', insertError);
        }

        // 2. Original-Mail als "bearbeitet" markieren (is_flagged = true)
        if (replySourceId) {
          await supabase.from('mailbox_emails').update({ is_flagged: true } as any).eq('id', replySourceId);
          if (selectedEmail?.id === replySourceId) {
            setSelectedEmail({ ...selectedEmail, is_flagged: true });
          }
        }

        toast.success('E-Mail gesendet!');
        setShowCompose(false);
        setCompose({ to: '', subject: '', html: '', text: '' });
        setReplySourceId(null);
        refetch();
      } else {
        toast.error(data.error || 'Fehler beim Senden');
      }
    } catch (e) {
      toast.error('Fehler: ' + String(e));
    } finally {
      setSending(false);
    }
  }

  const unreadCount = emails.filter(e => !e.is_read && (e.folder || 'inbox') === 'inbox').length;

  return (
    <div className="flex gap-0 min-h-[600px] admin-card overflow-hidden rounded-xl">
      {/* Folder Sidebar */}
      <div className="w-48 border-r border-slate-100 flex flex-col">
        <div className="p-3">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full admin-btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <PenSquare className="w-4 h-4" />
            Verfassen
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {FOLDERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeFolder === f.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <f.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{f.label}</span>
              {f.id === 'inbox' && unreadCount > 0 && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
              {f.id === 'drafts' && draftsCount > 0 && (
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{draftsCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={syncEmails}
            disabled={syncing}
            className="w-full admin-btn flex items-center justify-center gap-2 text-xs"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className={`flex flex-col ${selectedEmail ? 'w-72' : 'flex-1'} border-r border-slate-100`}>
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input className="admin-input pl-8 w-full text-sm py-1.5" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Lade E-Mails...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Keine E-Mails
            </div>
          ) : filtered.map(email => (
            <div
              key={email.id}
              onClick={() => openEmail(email)}
              className={`flex items-start gap-3 px-3 py-3 border-b border-slate-50 cursor-pointer transition-all ${
                selectedEmail?.id === email.id ? 'bg-blue-50' : 'hover:bg-slate-50/80'
              } ${!email.is_read ? 'bg-slate-50' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!email.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {email.from_name || email.from_email}
                  </span>
                  {email.is_flagged && activeFolder !== 'flagged' && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" /> bearbeitet
                    </span>
                  )}
                </div>
                <div className={`text-xs truncate mt-0.5 ${!email.is_read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{email.subject}</div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{email.snippet || email.body_text?.slice(0, 60) || ''}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-400">
                  {email.received_at ? format(new Date(email.received_at), 'dd.MM') : ''}
                </span>
                <button onClick={e => toggleStar(email, e)} className={`${email.is_starred ? 'text-amber-400' : 'text-slate-200 hover:text-slate-400'}`}>
                  <Star className="w-3.5 h-3.5" fill={email.is_starred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-slate-900 text-lg">{selectedEmail.subject}</h2>
                {selectedEmail.is_flagged && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> bearbeitet
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Von: <strong>{selectedEmail.from_name || selectedEmail.from_email}</strong>
                {selectedEmail.from_name && <span className="text-slate-400"> &lt;{selectedEmail.from_email}&gt;</span>}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {selectedEmail.received_at ? format(new Date(selectedEmail.received_at), 'dd.MM.yyyy HH:mm') : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setReplySourceId(selectedEmail.id);
                  setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, html: '', text: '' });
                  setShowCompose(true);
                }}
                className="admin-btn flex items-center gap-2 text-sm"
              >
                <Reply className="w-4 h-4" /> Antworten
              </button>
              <button onClick={() => deleteEmail(selectedEmail.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setSelectedEmail(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Original E-Mail */}
            {selectedEmail.body_html ? (
              <iframe
                srcDoc={selectedEmail.body_html}
                className="w-full min-h-[300px] border-0"
                title="E-Mail Inhalt"
              />
            ) : (
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{selectedEmail.body_text}</pre>
            )}

            {/* Valentin AI Draft */}
            {selectedEmail.ai_draft && (
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 flex items-center justify-between border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-800">✍️ Valentin's Entwurf</span>
                    {selectedEmail.ai_draft_at && (
                      <span className="text-xs text-amber-500">
                        {format(new Date(selectedEmail.ai_draft_at), 'dd.MM.yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReplySourceId(selectedEmail.id);
                      setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, html: '', text: selectedEmail.ai_draft || '' });
                      setShowCompose(true);
                    }}
                    className="admin-btn text-xs flex items-center gap-1"
                  >
                    <Reply className="w-3 h-3" /> Entwurf senden
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{selectedEmail.ai_draft}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/20" onClick={() => { setShowCompose(false); setReplySourceId(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 rounded-t-2xl bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">Neue E-Mail</h3>
              <button onClick={() => { setShowCompose(false); setReplySourceId(null); }} className="p-1.5 rounded-lg hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <input className="admin-input w-full text-sm" placeholder="An: email@beispiel.com" value={compose.to} onChange={e => setCompose({ ...compose, to: e.target.value })} />
              </div>
              <div>
                <input className="admin-input w-full text-sm" placeholder="Betreff" value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })} />
              </div>
              <div>
                <textarea
                  className="admin-input w-full h-48 resize-none text-sm"
                  placeholder="Nachricht schreiben..."
                  value={compose.text}
                  onChange={e => setCompose({ ...compose, text: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Gesendet von: Valentin@trumpetstar.com</p>
                <button
                  onClick={sendEmail}
                  disabled={sending}
                  className="admin-btn-primary flex items-center gap-2"
                >
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sende...</> : <><Send className="w-4 h-4" /> Senden</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
