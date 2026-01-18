import { useState, useRef, useEffect } from 'react';
import { useTeacherChat, useTeacherChatMessages, TeacherChat, ChatMessage } from '@/hooks/useTeacherChat';
import { useAuth } from '@/hooks/useAuth';
import { useRecordings } from '@/hooks/useRecordings';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Video, 
  ChevronLeft,
  Loader2,
  Clock,
  Check,
  CheckCheck,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

export function WhatsAppChat() {
  const { user } = useAuth();
  const { teacher, chats, loading, createChat, sendMessage, refetch } = useTeacherChat();
  const { recordings } = useRecordings();
  const [selectedChat, setSelectedChat] = useState<TeacherChat | null>(null);
  const [showVideoSelect, setShowVideoSelect] = useState(false);

  // Refetch when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      const updated = chats.find(c => c.id === selectedChat.id);
      if (updated) setSelectedChat(updated);
    }
  }, [chats, selectedChat?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Bitte einloggen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#111b21]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
      </div>
    );
  }

  const handleStartChat = async (videoId: string | null = null) => {
    const chatId = await createChat(videoId);
    if (chatId) {
      setShowVideoSelect(false);
      await refetch();
      setTimeout(() => {
        const newChat = chats.find(c => c.id === chatId);
        if (newChat) setSelectedChat(newChat);
      }, 300);
    }
  };

  return (
    <div className="flex h-full bg-[#111b21] rounded-2xl overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-[#111b21] border-r border-[#222d34]",
        selectedChat ? "hidden md:flex md:w-[380px]" : "w-full md:w-[380px]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
          <Avatar className="w-10 h-10 cursor-pointer">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-[#6b7c85] text-white">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-5 text-[#aebac1]">
            <button className="hover:text-white transition-colors" onClick={() => setShowVideoSelect(true)}>
              <Video className="w-5 h-5" />
            </button>
            <button className="hover:text-white transition-colors" onClick={() => handleStartChat(null)}>
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-[#111b21]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#202c33]">
            <svg className="w-4 h-4 text-[#8696a0]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.9 14.3H15L14.7 14C15.6 12.9 16.1 11.5 16.1 10C16.1 6.7 13.4 4 10.1 4C6.8 4 4 6.7 4 10C4 13.3 6.7 16 10 16C11.5 16 12.9 15.5 14 14.6L14.3 14.9V15.8L19.3 20.7L20.7 19.3L15.9 14.3ZM10.1 14C7.9 14 6.1 12.2 6.1 10C6.1 7.8 7.9 6 10.1 6C12.3 6 14.1 7.8 14.1 10C14.1 12.2 12.3 14 10.1 14Z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Suchen oder neuen Chat beginnen"
              className="flex-1 bg-transparent text-sm text-[#d1d7db] placeholder-[#8696a0] outline-none"
            />
          </div>
        </div>

        {/* Teacher Card - Featured */}
        {teacher && (
          <div className="mx-3 my-2 p-3 rounded-xl bg-gradient-to-r from-[#00a884]/20 to-[#00a884]/5 border border-[#00a884]/30">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-[#00a884]">
                <AvatarImage src={teacher.avatar_url || undefined} />
                <AvatarFallback className="bg-[#00a884] text-white font-medium">
                  {teacher.display_name?.charAt(0)?.toUpperCase() || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#00a884] font-medium uppercase tracking-wider">Dein Lehrer</p>
                <p className="font-semibold text-white truncate">
                  {teacher.display_name || 'Lehrer'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                <span className="text-xs text-[#00a884]">Online</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 h-8 text-xs bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border-0"
                onClick={() => handleStartChat(null)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Neue Nachricht
              </Button>
              <Button 
                size="sm"
                className="flex-1 h-8 text-xs bg-[#00a884] hover:bg-[#00a884]/90 text-white border-0"
                onClick={() => setShowVideoSelect(true)}
              >
                <Video className="w-3.5 h-3.5 mr-1" />
                Video teilen
              </Button>
            </div>
          </div>
        )}

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <ChatList 
            chats={chats}
            selectedChatId={selectedChat?.id}
            onSelectChat={setSelectedChat}
          />
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedChat && "hidden md:flex"
      )}>
        {selectedChat ? (
          <ChatView 
            chat={selectedChat}
            teacher={teacher}
            onBack={() => setSelectedChat(null)}
            sendMessage={sendMessage}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Video Selection Sheet */}
      <Sheet open={showVideoSelect} onOpenChange={setShowVideoSelect}>
        <SheetContent side="bottom" className="h-[70vh] bg-[#111b21] border-[#222d34]">
          <SheetHeader>
            <SheetTitle className="text-[#e9edef]">Video zum Teilen auswählen</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100%-60px)]">
            <div className="space-y-1">
              {recordings.length === 0 ? (
                <p className="text-[#8696a0] text-center py-8">
                  Keine Aufnahmen vorhanden
                </p>
              ) : (
                recordings.map((recording) => (
                  <button
                    key={recording.id}
                    onClick={() => handleStartChat(recording.id)}
                    className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-[#202c33] transition-colors text-left"
                  >
                    <div className="w-14 h-10 bg-[#202c33] rounded-lg overflow-hidden flex items-center justify-center">
                      <Video className="w-5 h-5 text-[#8696a0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#e9edef] truncate">
                        {recording.title || 'Unbenannte Aufnahme'}
                      </p>
                      <p className="text-xs text-[#8696a0]">
                        {format(new Date(recording.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] p-8">
      <div className="w-[320px] text-center">
        <div className="w-[280px] h-[188px] mx-auto mb-6 opacity-20">
          <svg viewBox="0 0 303 172" className="w-full h-full text-[#8696a0]">
            <path fill="currentColor" d="M229.565 160.229c32.647-10.984 57.366-41.988 53.825-86.81-5.381-68.153-71.669-87.893-117.614-78.452-33.675 6.913-71.107 29.796-83.523 64.025-4.988 13.75-5.762 27.883-3.706 41.405 4.498 29.56 25.674 54.439 51.903 66.627-15.232-.091-47.863-2.593-60.826-13.646-7.162-6.104-5.493-16.032-3.634-22.322 0 0-9.307 2.655-13.552 10.712-4.245 8.057-1.912 27.068 19.026 36.489 27.656 12.429 68.583 11.463 85.074 6.265 18.326-5.77 41.384-13.097 73.027-24.293Z"/>
          </svg>
        </div>
        <h2 className="text-[32px] font-light text-[#e9edef] mb-4">
          Trumpetstar Feedback
        </h2>
        <p className="text-sm text-[#8696a0] mb-8 leading-relaxed">
          Teile Videos mit deinem Lehrer und erhalte persönliches Feedback. 
          Wähle einen Chat aus oder starte eine neue Konversation.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[#8696a0]">
          <span className="w-4 h-4 flex items-center justify-center">🔒</span>
          <span>Deine Nachrichten sind privat und sicher</span>
        </div>
      </div>
    </div>
  );
}

// Chat List
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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-[#3b4a54] mb-3" />
        <p className="text-[#8696a0] text-sm">
          Noch keine Chats. Starte eine Konversation mit deinem Lehrer!
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
            className={cn(
              "w-full px-3 py-3 flex items-center gap-3 transition-colors text-left border-b border-[#222d34]",
              isSelected ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
            )}
          >
            <Avatar className="w-[49px] h-[49px] flex-shrink-0">
              <AvatarFallback className={cn(
                "text-white font-medium",
                chat.reference_video_id ? "bg-[#00a884]" : "bg-[#6b7c85]"
              )}>
                {chat.reference_video_id ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="font-normal text-[17px] text-[#e9edef] truncate">
                  {chat.reference_video_title || 'Chat mit Lehrer'}
                </p>
                {chat.last_message_time && (
                  <span className={cn(
                    "text-xs flex-shrink-0",
                    chat.unread_count > 0 ? "text-[#00a884]" : "text-[#8696a0]"
                  )}>
                    {formatTime(chat.last_message_time)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#8696a0] truncate">
                  {chat.last_message || 'Noch keine Nachrichten'}
                </p>
                {chat.unread_count > 0 && (
                  <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-[#00a884] text-xs text-white font-medium">
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

// Chat View
function ChatView({ 
  chat, 
  teacher,
  onBack,
  sendMessage
}: { 
  chat: TeacherChat;
  teacher: ReturnType<typeof useTeacherChat>['teacher'];
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
    if (success) {
      setMessageText('');
    }
    setSending(false);
  };

  const formatMessageTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'HEUTE';
    if (isYesterday(date)) return 'GESTERN';
    return format(date, 'dd. MMMM yyyy', { locale: de }).toUpperCase();
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const existing = groupedMessages.find(g => g.date === date);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b141a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#202c33] border-b border-[#222d34]">
        <button 
          className="md:hidden p-1 text-[#8696a0] hover:text-white"
          onClick={onBack}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage src={teacher?.avatar_url || undefined} />
          <AvatarFallback className="bg-[#00a884] text-white">
            {teacher?.display_name?.charAt(0)?.toUpperCase() || 'L'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#e9edef] truncate">
            {teacher?.display_name || 'Lehrer'}
          </p>
          {chat.reference_video_title && (
            <p className="text-xs text-[#8696a0] truncate flex items-center gap-1">
              <Video className="w-3 h-3" />
              {chat.reference_video_title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-5 text-[#aebac1]">
          <button className="hover:text-white transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-16 py-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 26'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="bg-[#182229] rounded-lg px-4 py-2 text-center max-w-sm">
              <p className="text-[#8696a0] text-sm">
                🎺 Nachrichten mit deinem Lehrer sind verschlüsselt. 
                Starte die Konversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedMessages.map((group) => (
              <div key={group.date} className="space-y-1">
                {/* Date Divider */}
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1.5 bg-[#182229] rounded-lg text-[11px] text-[#8696a0] uppercase tracking-wide shadow-sm">
                    {formatDateDivider(group.messages[0].created_at)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg, idx) => {
                  const isOwn = msg.sender_user_id === user?.id;
                  const showTail = idx === 0 || group.messages[idx - 1]?.sender_user_id !== msg.sender_user_id;
                  
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "relative max-w-[65%] min-w-[80px] rounded-lg px-3 py-1.5 shadow-sm",
                          isOwn 
                            ? "bg-[#005c4b] text-white" 
                            : "bg-[#202c33] text-[#e9edef]",
                          showTail && isOwn && "rounded-tr-none",
                          showTail && !isOwn && "rounded-tl-none"
                        )}
                      >
                        {/* Tail */}
                        {showTail && (
                          <div
                            className={cn(
                              "absolute top-0 w-3 h-3",
                              isOwn 
                                ? "-right-1.5 border-t-[12px] border-l-[12px] border-t-[#005c4b] border-l-transparent" 
                                : "-left-1.5 border-t-[12px] border-r-[12px] border-t-[#202c33] border-r-transparent"
                            )}
                          />
                        )}
                        
                        {msg.message_type === 'marker' && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-mono",
                              isOwn ? "bg-[#00a884]/30" : "bg-[#00a884]/20 text-[#00a884]"
                            )}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(msg.timestamp_seconds || 0)}
                            </span>
                          </div>
                        )}
                        
                        {msg.message_type === 'video' && (
                          <VideoMessage 
                            storagePath={msg.video_storage_path!}
                          />
                        )}
                        
                        {msg.content && (
                          <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                          <span className={cn(
                            "text-[11px]",
                            isOwn ? "text-white/60" : "text-[#8696a0]"
                          )}>
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            msg.is_read 
                              ? <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                              : <Check className="w-4 h-4 text-white/60" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#222d34]">
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#8696a0] hover:text-white transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button className="p-2 text-[#8696a0] hover:text-white transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Nachricht"
              className="w-full h-10 pl-4 pr-4 rounded-lg bg-[#2a3942] border-0 text-[#e9edef] placeholder-[#8696a0] focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          {messageText.trim() ? (
            <button
              className="p-2.5 bg-[#00a884] rounded-full hover:bg-[#00a884]/90 transition-colors disabled:opacity-50"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          ) : (
            <button className="p-2.5 bg-transparent text-[#8696a0] hover:text-white transition-colors">
              <Mic className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Video Message Component
function VideoMessage({ storagePath }: { storagePath: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrl() {
      try {
        const { data } = await supabase.storage
          .from('recordings')
          .createSignedUrl(storagePath, 3600);
        setVideoUrl(data?.signedUrl || null);
      } catch (err) {
        console.error('Error fetching video URL:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUrl();
  }, [storagePath]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Video wird geladen...</span>
      </div>
    );
  }

  if (!videoUrl) {
    return <span className="text-sm">Video nicht verfügbar</span>;
  }

  return (
    <div className="space-y-2">
      <video
        src={videoUrl}
        controls
        playsInline
        className="rounded-lg max-w-full"
        style={{ maxHeight: '240px' }}
      />
    </div>
  );
}

// Helper
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
