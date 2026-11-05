import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send, RefreshCw, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { feedbackCopy } from '@/i18n/feedback';

interface Contact { studentId: string; teacherId: string; name: string; avatar: string | null; preview: string | null; unread: number }
interface Message { id: string; sender_user_id: string; content: string | null; created_at: string; message_type: string }
interface Thread { chatId: string; messages: Message[] }

export function FeedbackMessaging() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = feedbackCopy[language];
  const cache = useQueryClient();
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [older, setOlder] = useState<Message[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inbox = useQuery({ queryKey: ['feedback-inbox', user?.id], staleTime: 30_000, enabled: !!user, queryFn: async () => {
    const { data, error } = await supabase.rpc('feedback_inbox');
    if (error) throw error;
    return data as unknown as { teacher: boolean; contacts: Contact[] };
  } });
  const contact = selected ?? (!inbox.data?.teacher ? inbox.data?.contacts[0] : undefined);
  const threadKey = ['feedback-thread', user?.id, contact?.studentId];
  const thread = useQuery({ queryKey: threadKey, staleTime: 15_000, enabled: !!contact, queryFn: async () => {
    if (!contact) throw new Error('No contact');
    const { data, error } = await supabase.rpc('feedback_thread', { p_student: contact.studentId });
    if (error) throw error;
    return data as unknown as Thread;
  } });
  useEffect(() => { setOlder([]); setText(''); setSendError(false); }, [contact?.studentId]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [thread.data?.messages.length]);
  useEffect(() => {
    const id = thread.data?.chatId;
    if (!id) return;
    const channel = supabase.channel(`feedback-${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'video_chat_messages', filter: `chat_id=eq.${id}` }, () => { void cache.invalidateQueries({ queryKey: threadKey }); }).subscribe();
    const timer = window.setInterval(() => { void cache.invalidateQueries({ queryKey: threadKey }); }, 15_000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [thread.data?.chatId, contact?.studentId, cache]);
  const send = async () => {
    if (!contact || !text.trim() || sending) return;
    setSending(true); setSendError(false);
    const { data, error } = await supabase.rpc('feedback_thread', { p_student: contact.studentId, p_content: text.trim() });
    if (error) setSendError(true);
    else { cache.setQueryData(threadKey, data as unknown as Thread); setText(''); void cache.invalidateQueries({ queryKey: ['feedback-inbox', user?.id] }); }
    setSending(false);
  };
  const messages = [...older, ...(thread.data?.messages ?? [])].filter((m, i, all) => all.findIndex(x => x.id === m.id) === i);
  const loadOlder = async () => {
    if (!contact || !messages[0]) return;
    setLoadingOlder(true);
    const { data, error } = await supabase.rpc('feedback_thread', { p_student: contact.studentId, p_before: messages[0].created_at });
    if (!error) setOlder(prev => [...(data as unknown as Thread).messages, ...prev]);
    setLoadingOlder(false);
  };
  if (inbox.isError) return <div className="p-6 text-ts-ink">{copy.error}<Button variant="ghost" onClick={() => inbox.refetch()}><RefreshCw className="h-4 w-4" />{copy.retry}</Button></div>;
  return <div className="ts-light-module flex min-h-[420px] h-[calc(100dvh-100px)] max-h-[900px] text-ts-ink">
    {inbox.data?.teacher && <aside className={`${contact ? 'hidden md:flex' : 'flex'} w-full md:w-72 shrink-0 flex-col border-r border-ts-line`}>
      <div className="p-4 border-b border-ts-line"><h2 className="font-bold mb-3">{copy.students}</h2><Input placeholder={copy.search} value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="overflow-y-auto flex-1">{inbox.data.contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => <Button key={c.studentId} variant="ghost" onClick={() => setSelected(c)} className="w-full h-auto justify-start rounded-none p-4 gap-3 whitespace-normal border-b border-ts-line">
        <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={c.avatar ?? undefined} /><AvatarFallback>{c.name.slice(0, 1)}</AvatarFallback></Avatar>
        <span className="min-w-0 text-left"><span className="block font-bold truncate">{c.name}</span><span className="block text-xs text-ts-muted truncate">{c.preview?.startsWith('{') ? copy.attachment : c.preview ?? copy.empty}</span></span>
        {c.unread > 0 && <span className="ml-auto text-xs text-ts-deep">{c.unread}</span>}
      </Button>)}</div>
    </aside>}
    <section className="flex flex-col flex-1 min-w-0" aria-label={copy.students}>
      <header className="flex items-center gap-3 p-4 border-b border-ts-line bg-ts-card">
        {selected && <Button variant="ghost" size="icon" aria-label={copy.back} onClick={() => setSelected(null)}><ArrowLeft className="h-5 w-5" /></Button>}
        <MessageCircle className="h-5 w-5 text-ts-deep" /><h2 className="font-bold truncate">{contact?.name ?? (inbox.data?.teacher ? copy.select : copy.teacher)}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {(inbox.isLoading || thread.isLoading && contact) && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
        {thread.isError && <Button variant="ghost" onClick={() => thread.refetch()}>{copy.error} <RefreshCw className="h-4 w-4" /></Button>}
        {!inbox.isLoading && !contact && <p className="text-center text-ts-muted py-12">{inbox.data?.teacher ? copy.select : copy.noTeacher}</p>}
        {messages.length >= 50 && <Button variant="ghost" disabled={loadingOlder} onClick={loadOlder}>{copy.older}</Button>}
        {contact && !thread.isLoading && !messages.length && <p className="text-center text-ts-muted py-12">{copy.empty}</p>}
        {messages.map(m => <div key={m.id} className={`flex ${m.sender_user_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg px-4 py-3 ${m.sender_user_id === user?.id ? 'bg-ts-deep text-ts-on' : 'bg-ts-card text-ts-ink'}`}><p className="whitespace-pre-wrap break-words text-sm">{m.content?.startsWith('{') ? copy.attachment : m.content ?? copy.attachment}</p><time className="block text-xs mt-1 opacity-70">{new Date(m.created_at).toLocaleString(language, { dateStyle: 'short', timeStyle: 'short' })}</time></div></div>)}
        <div ref={bottom} />
      </div>
      {contact && <form className="p-3 border-t border-ts-line bg-ts-card flex items-end gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
        <div className="flex-1 min-w-0"><Textarea aria-label={copy.compose} placeholder={inbox.data?.teacher ? copy.compose : copy.placeholder} value={text} maxLength={5000} onChange={e => setText(e.target.value)} className="min-h-12 max-h-32 resize-none" />{sendError && <p role="alert" className="text-destructive text-xs">{copy.failed}</p>}</div>
        <Button type="submit" size="icon" title={copy.send} aria-label={copy.send} disabled={!text.trim() || sending || thread.isError}>{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
      </form>}
    </section>
  </div>;
}