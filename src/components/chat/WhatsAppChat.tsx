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
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Video, 
  ChevronLeft,
  Loader2,
  Clock,
  Play,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

export function WhatsAppChat() {
  const { user } = useAuth();
  const { teacher, chats, loading, createChat, sendMessage } = useTeacherChat();
  const { recordings } = useRecordings();
  const [selectedChat, setSelectedChat] = useState<TeacherChat | null>(null);
  const [showVideoSelect, setShowVideoSelect] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Bitte einloggen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleStartChat = async (videoId: string | null = null) => {
    const chatId = await createChat(videoId);
    if (chatId) {
      setShowVideoSelect(false);
      // Find and select the new chat
      setTimeout(() => {
        const newChat = chats.find(c => c.id === chatId);
        if (newChat) setSelectedChat(newChat);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Teacher Header Card */}
      <TeacherCard 
        teacher={teacher}
        onNewChat={() => handleStartChat(null)}
        onShareVideo={() => setShowVideoSelect(true)}
      />

      {/* Chat List or Active Chat */}
      {selectedChat ? (
        <ChatView 
          chat={selectedChat}
          teacher={teacher}
          onBack={() => setSelectedChat(null)}
          sendMessage={sendMessage}
        />
      ) : (
        <ChatList 
          chats={chats}
          onSelectChat={setSelectedChat}
        />
      )}

      {/* Video Selection Sheet */}
      <Sheet open={showVideoSelect} onOpenChange={setShowVideoSelect}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Video zum Teilen auswählen</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100%-60px)]">
            <div className="space-y-2">
              {recordings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keine Aufnahmen vorhanden
                </p>
              ) : (
                recordings.map((recording) => (
                  <button
                    key={recording.id}
                    onClick={() => handleStartChat(recording.id)}
                    className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-16 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                      <Video className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {recording.title || 'Unbenannte Aufnahme'}
                      </p>
                      <p className="text-xs text-muted-foreground">
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

// Teacher Header Card
function TeacherCard({ 
  teacher, 
  onNewChat, 
  onShareVideo 
}: { 
  teacher: ReturnType<typeof useTeacherChat>['teacher'];
  onNewChat: () => void;
  onShareVideo: () => void;
}) {
  if (!teacher) {
    return (
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Kein Lehrer zugewiesen</p>
            <p className="text-sm text-muted-foreground">
              Kontaktiere den Admin für Hilfe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
      <div className="flex items-center gap-3">
        <Avatar className="w-14 h-14 border-2 border-primary/20">
          <AvatarImage src={teacher.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {teacher.display_name?.charAt(0)?.toUpperCase() || 'L'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Dein Lehrer</p>
          <p className="font-semibold text-lg text-foreground">
            {teacher.display_name || 'Lehrer'}
          </p>
          <Badge variant="outline" className="text-xs mt-1 border-green-500/50 text-green-600">
            Verfügbar
          </Badge>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={onNewChat}
        >
          <Plus className="w-4 h-4" />
          Neue Nachricht
        </Button>
        <Button 
          className="flex-1 gap-2 bg-accent hover:bg-accent/90"
          onClick={onShareVideo}
        >
          <Video className="w-4 h-4" />
          Video teilen
        </Button>
      </div>
    </div>
  );
}

// Chat List
function ChatList({ 
  chats, 
  onSelectChat 
}: { 
  chats: TeacherChat[];
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Noch keine Chats
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Starte eine neue Nachricht oder teile ein Video mit deinem Lehrer.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {chat.reference_video_id ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <MessageSquare className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  "font-medium truncate",
                  chat.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {chat.reference_video_title || 'Chat mit Lehrer'}
                </p>
                {chat.last_message_time && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(chat.last_message_time)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  "text-sm truncate",
                  chat.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {chat.last_message || 'Noch keine Nachrichten'}
                </p>
                {chat.unread_count > 0 && (
                  <Badge className="h-5 min-w-5 flex items-center justify-center bg-accent text-accent-foreground">
                    {chat.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// Chat View (WhatsApp style)
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

  // Auto-scroll to bottom
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

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Heute';
    if (isYesterday(date)) return 'Gestern';
    return format(date, 'dd. MMMM yyyy', { locale: de });
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={teacher?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {teacher?.display_name?.charAt(0)?.toUpperCase() || 'L'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{teacher?.display_name || 'Lehrer'}</p>
          {chat.reference_video_title && (
            <p className="text-xs text-primary truncate flex items-center gap-1">
              <Video className="w-3 h-3" />
              {chat.reference_video_title}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundColor: 'hsl(var(--muted) / 0.3)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Starte die Konversation mit deinem Lehrer! 🎺
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date Divider */}
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-muted/80 rounded-full text-xs text-muted-foreground">
                  {formatDateDivider(group.messages[0].created_at)}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((msg) => {
                const isOwn = msg.sender_user_id === user?.id;
                
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
                        "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-card text-card-foreground rounded-bl-md"
                      )}
                    >
                      {msg.message_type === 'marker' && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-mono",
                            isOwn 
                              ? "bg-primary-foreground/20" 
                              : "bg-accent/20 text-accent"
                          )}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTime(msg.timestamp_seconds || 0)}
                          </span>
                        </div>
                      )}
                      
                      {msg.message_type === 'video' && (
                        <VideoMessage 
                          storagePath={msg.video_storage_path!}
                          isOwn={isOwn}
                        />
                      )}
                      
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        isOwn ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {isOwn && (
                          msg.is_read 
                            ? <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
                            : <Check className="w-3.5 h-3.5 text-primary-foreground/70" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 rounded-full bg-muted border-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="rounded-full bg-accent hover:bg-accent/90 h-10 w-10"
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Video Message Component
function VideoMessage({ storagePath, isOwn }: { storagePath: string; isOwn: boolean }) {
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
      <div className="flex items-center gap-2 text-xs opacity-80">
        <Video className="w-3 h-3" />
        Antwort-Video
      </div>
      <video
        src={videoUrl}
        controls
        playsInline
        className="rounded-lg max-w-full"
        style={{ maxHeight: '200px' }}
      />
    </div>
  );
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
