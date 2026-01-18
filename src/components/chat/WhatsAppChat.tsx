import { useState, useRef, useEffect } from 'react';
import { useTeacherChat, useTeacherChatMessages, TeacherChat, ChatMessage } from '@/hooks/useTeacherChat';
import { useAuth } from '@/hooks/useAuth';
import { useRecordings } from '@/hooks/useRecordings';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Send, 
  Video, 
  ChevronLeft,
  Loader2,
  Check,
  CheckCheck,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

// WhatsApp Light Color Palette
const c = {
  bgDark: '#efeae2',
  bgPanel: '#ffffff',
  bgHeader: '#f0f2f5',
  bgHover: '#f5f6f6',
  bgInput: '#ffffff',
  bubbleOutgoing: '#d9fdd3',
  bubbleIncoming: '#ffffff',
  teal: '#25d366',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  textMuted: '#8696a0',
  borderLight: '#e9edef',
};

export function WhatsAppChat() {
  const { user } = useAuth();
  const { teacher, chats, loading, createChat, sendMessage, refetch } = useTeacherChat();
  const { recordings } = useRecordings();
  const [selectedChat, setSelectedChat] = useState<TeacherChat | null>(null);
  const [showVideoSelect, setShowVideoSelect] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      const updated = chats.find(ch => ch.id === selectedChat.id);
      if (updated) setSelectedChat(updated);
    }
  }, [chats, selectedChat?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: c.bgPanel }}>
        <p style={{ color: c.textSecondary }}>Bitte einloggen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: c.bgPanel }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: c.teal }} />
      </div>
    );
  }

  const handleStartChat = async (videoId: string | null = null) => {
    const chatId = await createChat(videoId);
    if (chatId) {
      setShowVideoSelect(false);
      await refetch();
      setTimeout(() => {
        const newChat = chats.find(ch => ch.id === chatId);
        if (newChat) setSelectedChat(newChat);
      }, 300);
    }
  };

  return (
    <div 
      className="flex h-full overflow-hidden shadow-2xl"
      style={{ background: c.bgPanel, borderRadius: '16px' }}
    >
      {/* Left Panel */}
      <div 
        className={cn(
          "flex flex-col h-full border-r",
          selectedChat ? "hidden lg:flex w-[420px]" : "w-full lg:w-[420px]"
        )}
        style={{ background: c.bgPanel, borderColor: c.borderLight }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4" style={{ background: c.bgHeader }}>
          {teacher ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-[#00a884]">
                  <AvatarImage src={teacher.avatar_url || undefined} />
                  <AvatarFallback className="text-lg font-semibold" style={{ background: c.teal, color: '#fff' }}>
                    {teacher.display_name?.charAt(0)?.toUpperCase() || 'L'}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-[#202c33]"
                  style={{ background: c.teal }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: c.teal }}>
                  Dein Lehrer
                </p>
                <p className="font-semibold text-lg truncate" style={{ color: c.textPrimary }}>
                  {teacher.display_name || 'Lehrer'}
                </p>
                <p className="text-xs flex items-center gap-1.5" style={{ color: c.textSecondary }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.teal }} />
                  Online
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: c.bgHover }}>
                <MessageSquare className="w-6 h-6" style={{ color: c.textSecondary }} />
              </div>
              <div>
                <p style={{ color: c.textPrimary }} className="font-semibold">Feedback Chat</p>
                <p style={{ color: c.textSecondary }} className="text-sm">Kein Lehrer zugewiesen</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-3 px-5 py-3 border-b" style={{ borderColor: c.borderLight }}>
          <Button 
            variant="outline" size="sm"
            className="flex-1 h-11 text-sm font-medium border-0"
            style={{ background: c.bgHover, color: c.textPrimary }}
            onClick={() => handleStartChat(null)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Neue Nachricht
          </Button>
          <Button 
            size="sm"
            className="flex-1 h-11 text-sm font-medium border-0"
            style={{ background: c.teal, color: '#fff' }}
            onClick={() => setShowVideoSelect(true)}
          >
            <Video className="w-4 h-4 mr-2" />
            Video teilen
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <ChatList chats={chats} selectedChatId={selectedChat?.id} onSelectChat={setSelectedChat} />
        </ScrollArea>
      </div>

      {/* Right Panel */}
      <div className={cn("flex-1 flex flex-col min-w-0", !selectedChat && "hidden lg:flex")}>
        {selectedChat ? (
          <ChatView chat={selectedChat} teacher={teacher} onBack={() => setSelectedChat(null)} sendMessage={sendMessage} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Video Sheet */}
      <Sheet open={showVideoSelect} onOpenChange={setShowVideoSelect}>
        <SheetContent side="bottom" className="h-[70vh] border-t-0" style={{ background: c.bgPanel }}>
          <SheetHeader>
            <SheetTitle style={{ color: c.textPrimary }}>Video zum Teilen auswählen</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100%-60px)]">
            <div className="space-y-1">
              {recordings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Video className="w-12 h-12 mb-3" style={{ color: c.textMuted }} />
                  <p style={{ color: c.textSecondary }}>Keine Aufnahmen vorhanden</p>
                </div>
              ) : recordings.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleStartChat(rec.id)}
                  className="w-full p-4 flex items-center gap-4 rounded-xl text-left hover:bg-[#2a3942] transition-colors"
                >
                  <div className="w-16 h-12 rounded-lg flex items-center justify-center" style={{ background: c.bgHover }}>
                    <Video className="w-5 h-5" style={{ color: c.teal }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: c.textPrimary }}>
                      {rec.title || 'Unbenannte Aufnahme'}
                    </p>
                    <p className="text-sm" style={{ color: c.textSecondary }}>
                      {format(new Date(rec.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                  <Send className="w-5 h-5" style={{ color: c.teal }} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: c.bgDark }}>
      <div className="max-w-md text-center">
        <div className="w-80 h-48 mx-auto mb-8 opacity-30">
          <svg viewBox="0 0 303 172" className="w-full h-full">
            <path 
              fill={c.textSecondary}
              d="M229.565 160.229c32.647-10.984 57.366-41.988 53.825-86.81-5.381-68.153-71.669-87.893-117.614-78.452-33.675 6.913-71.107 29.796-83.523 64.025-4.988 13.75-5.762 27.883-3.706 41.405 4.498 29.56 25.674 54.439 51.903 66.627-15.232-.091-47.863-2.593-60.826-13.646-7.162-6.104-5.493-16.032-3.634-22.322 0 0-9.307 2.655-13.552 10.712-4.245 8.057-1.912 27.068 19.026 36.489 27.656 12.429 68.583 11.463 85.074 6.265 18.326-5.77 41.384-13.097 73.027-24.293Z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-light mb-4" style={{ color: c.textPrimary }}>
          Trumpetstar Feedback
        </h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: c.textSecondary }}>
          Teile Videos mit deinem Lehrer und erhalte persönliches Feedback.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: c.textMuted }}>
          <span>🔒</span>
          <span>Deine Nachrichten sind privat und sicher</span>
        </div>
      </div>
    </div>
  );
}

function ChatList({ 
  chats, 
  selectedChatId,
  onSelectChat 
}: { 
  chats: TeacherChat[];
  selectedChatId?: string;
  onSelectChat: (chat: TeacherChat) => void;
}) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Gestern';
    return format(date, 'dd.MM.yy');
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: c.bgHover }}>
          <MessageSquare className="w-8 h-8" style={{ color: c.textMuted }} />
        </div>
        <p className="text-center text-sm" style={{ color: c.textSecondary }}>
          Noch keine Chats.<br />Starte eine Konversation!
        </p>
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => {
        const isSelected = chat.id === selectedChatId;
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="w-full px-5 py-4 flex items-center gap-4 text-left border-b hover:bg-[#2a3942] transition-colors"
            style={{ 
              background: isSelected ? c.bgHover : 'transparent',
              borderColor: c.borderLight,
            }}
          >
            <Avatar className="w-14 h-14 flex-shrink-0">
              <AvatarFallback style={{ 
                background: chat.reference_video_id ? c.teal : c.bgHover,
                color: chat.reference_video_id ? '#fff' : c.textSecondary,
              }}>
                {chat.reference_video_id ? <Video className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-base truncate" style={{ color: c.textPrimary }}>
                  {chat.reference_video_title || 'Chat mit Lehrer'}
                </p>
                {chat.last_message_time && (
                  <span className="text-xs flex-shrink-0" style={{ color: chat.unread_count > 0 ? c.teal : c.textSecondary }}>
                    {formatTime(chat.last_message_time)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate" style={{ color: c.textSecondary }}>
                  {chat.last_message || 'Noch keine Nachrichten'}
                </p>
                {chat.unread_count > 0 && (
                  <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: c.teal }}>
                    {chat.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ChatView({ 
  chat, 
  teacher,
  onBack,
  sendMessage
}: { 
  chat: TeacherChat;
  teacher: { id: string; display_name: string | null; avatar_url: string | null; is_assigned: boolean } | null;
  onBack: () => void;
  sendMessage: (chatId: string, content: string) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const { messages, loading } = useTeacherChatMessages(chat.id);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    const success = await sendMessage(chat.id, messageText.trim());
    if (success) setMessageText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'HEUTE';
    if (isYesterday(date)) return 'GESTERN';
    return format(date, 'dd. MMMM yyyy', { locale: de }).toUpperCase();
  };

  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const existing = groupedMessages.find(g => g.date === date);
    if (existing) existing.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  });

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: c.bgDark }}>
      {/* Header */}
      <div 
        className="flex-shrink-0 flex items-center gap-4 px-5 py-3 border-b"
        style={{ background: c.bgHeader, borderColor: c.borderLight }}
      >
        <button className="lg:hidden p-2 rounded-full min-h-11 min-w-11 flex items-center justify-center" onClick={onBack}>
          <ChevronLeft className="w-6 h-6" style={{ color: c.textSecondary }} />
        </button>
        <Avatar className="w-12 h-12">
          <AvatarImage src={teacher?.avatar_url || undefined} />
          <AvatarFallback style={{ background: c.teal, color: '#fff' }}>
            {teacher?.display_name?.charAt(0)?.toUpperCase() || 'L'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-base truncate" style={{ color: c.textPrimary }}>
            {teacher?.display_name || 'Lehrer'}
          </p>
          <p className="text-sm truncate flex items-center gap-1.5" style={{ color: c.textSecondary }}>
            {chat.reference_video_title ? (
              <>
                <Video className="w-3.5 h-3.5 flex-shrink-0" />
                {chat.reference_video_title}
              </>
            ) : 'Direktnachricht'}
          </p>
        </div>
        <button className="p-2.5 rounded-full min-h-11 min-w-11 flex items-center justify-center">
          <MoreVertical className="w-5 h-5" style={{ color: c.textSecondary }} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 lg:px-16 py-6"
        style={{ backgroundColor: c.bgDark }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: c.teal }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="rounded-lg px-4 py-3 text-center max-w-sm" style={{ background: c.bgPanel }}>
              <p className="text-sm" style={{ color: c.textSecondary }}>
                🎺 Nachrichten sind verschlüsselt. Starte die Konversation!
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date} className="mb-6">
              <div className="flex justify-center mb-4">
                <span className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: c.bgPanel, color: c.textSecondary }}>
                  {formatDateDivider(group.date)}
                </span>
              </div>
              {group.messages.map((msg, idx) => {
                const isOwn = msg.sender_user_id === user?.id;
                const showTail = idx === 0 || group.messages[idx - 1]?.sender_user_id !== msg.sender_user_id;
                return <MessageBubble key={msg.id} message={msg} isOwn={isOwn} showTail={showTail} />;
              })}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 py-3 border-t" style={{ background: c.bgHeader, borderColor: c.borderLight }}>
        <div className="flex items-end gap-3 max-w-5xl mx-auto">
          <button className="p-3 rounded-full min-h-12 min-w-12 flex items-center justify-center">
            <Smile className="w-6 h-6" style={{ color: c.textSecondary }} />
          </button>
          <button className="p-3 rounded-full min-h-12 min-w-12 flex items-center justify-center">
            <Paperclip className="w-6 h-6" style={{ color: c.textSecondary }} />
          </button>
          <div className="flex-1 rounded-3xl px-5 py-3 min-h-12 flex items-center" style={{ background: c.bgInput }}>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht schreiben..."
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none resize-none text-base leading-normal"
              style={{ color: c.textPrimary, minHeight: '24px', maxHeight: '120px' }}
            />
          </div>
          {messageText.trim() ? (
            <button 
              onClick={handleSend}
              disabled={sending}
              className="p-3 rounded-full min-h-12 min-w-12 flex items-center justify-center"
              style={{ background: c.teal }}
            >
              {sending ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Send className="w-6 h-6 text-white" />}
            </button>
          ) : (
            <button className="p-3 rounded-full min-h-12 min-w-12 flex items-center justify-center">
              <Mic className="w-6 h-6" style={{ color: c.textSecondary }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn, showTail }: { message: ChatMessage; isOwn: boolean; showTail: boolean }) {
  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  const renderContent = () => {
    if (message.message_type === 'video' && message.video_storage_path) {
      return <VideoMessage storagePath={message.video_storage_path} />;
    }
    if (message.message_type === 'marker' && message.timestamp_seconds) {
      const mins = Math.floor(message.timestamp_seconds / 60);
      const secs = message.timestamp_seconds % 60;
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(0,0,0,0.08)', color: c.teal }}>
            📍 {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <span>{message.content}</span>
        </div>
      );
    }
    return <span className="whitespace-pre-wrap break-words">{message.content}</span>;
  };

  return (
    <div className={cn("flex mb-1", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[75%] lg:max-w-[65%] px-3 py-2 rounded-lg",
          showTail && (isOwn ? "rounded-tr-sm" : "rounded-tl-sm")
        )}
        style={{ 
          background: isOwn ? c.bubbleOutgoing : c.bubbleIncoming,
          marginTop: showTail ? '8px' : '2px',
        }}
      >
        <div className="text-[15px] leading-relaxed" style={{ color: c.textPrimary }}>
          {renderContent()}
        </div>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[11px]" style={{ color: c.textMuted }}>
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="w-4 h-4" style={{ color: '#53bdeb' }} />
            ) : (
              <Check className="w-4 h-4" style={{ color: c.textMuted }} />
            )
          )}
        </div>
        {showTail && (
          <div 
            className={cn("absolute top-0 w-2 h-3", isOwn ? "-right-2" : "-left-2")}
            style={{
              background: isOwn ? c.bubbleOutgoing : c.bubbleIncoming,
              clipPath: isOwn ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)',
            }}
          />
        )}
      </div>
    </div>
  );
}

function VideoMessage({ storagePath }: { storagePath: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUrl = async () => {
      try {
        const { data } = await supabase.storage.from('recordings').createSignedUrl(storagePath, 3600);
        setVideoUrl(data?.signedUrl || null);
      } catch (error) {
        console.error('Error getting video URL:', error);
      } finally {
        setLoading(false);
      }
    };
    getUrl();
  }, [storagePath]);

  if (loading) {
    return (
      <div className="w-64 h-36 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: c.textSecondary }} />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-64 h-36 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <Video className="w-8 h-8" style={{ color: c.textMuted }} />
      </div>
    );
  }

  return (
    <div className="relative w-64 rounded-lg overflow-hidden">
      <video src={videoUrl} controls className="w-full max-h-48 object-cover rounded-lg" style={{ background: '#000' }} />
    </div>
  );
}
