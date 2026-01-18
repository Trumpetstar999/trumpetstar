import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTeacherStudentChats, useTeacherChat, StudentChatInfo } from '@/hooks/useTeacherChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface TeacherStudentListProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  onSelectStudent?: (studentId: string) => void;
}

export function TeacherStudentList({ isOpen, onClose, embedded = false, onSelectStudent }: TeacherStudentListProps) {
  const { user } = useAuth();
  const { studentChats, loading } = useTeacherStudentChats();
  const [selectedStudent, setSelectedStudent] = useState<StudentChatInfo | null>(null);

  if (!isOpen) return null;

  const handleSelectStudent = (student: StudentChatInfo) => {
    if (onSelectStudent) {
      onSelectStudent(student.studentId);
    } else {
      setSelectedStudent(student);
    }
  };

  // Container classes based on embedded mode
  const containerClasses = embedded
    ? 'flex flex-col h-full bg-background'
    : 'fixed right-0 top-0 h-full w-[420px] max-w-full z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl';

  if (selectedStudent && !onSelectStudent) {
    return (
      <div className={containerClasses}>
        <TeacherChatView 
          student={selectedStudent} 
          onBack={() => setSelectedStudent(null)}
          onClose={onClose}
          embedded={embedded}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-[15px]">Schüler-Chats</h2>
            <p className="text-[11px] text-white/70">
              {studentChats.length} Schüler
            </p>
          </div>
        </div>
        {!embedded && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Student List */}
      <ScrollArea className="flex-1 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#667781]" />
          </div>
        ) : studentChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Keine Schüler zugewiesen
            </p>
            <p className="text-gray-400 text-xs max-w-[280px]">
              Dir sind noch keine Schüler zugewiesen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {studentChats.map((student) => (
              <button
                key={student.chatId || student.studentId}
                onClick={() => handleSelectStudent(student)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={student.studentProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#25D366]/20 text-[#25D366]">
                    {student.studentProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[15px] text-gray-900 truncate">
                      {student.studentProfile?.display_name || 'Unbekannt'}
                    </span>
                    {student.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(student.lastMessageTime), { addSuffix: true, locale: de })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-gray-500 truncate">
                      {student.lastMessage || 'Noch keine Nachrichten'}
                    </p>
                    {student.unreadCount > 0 && (
                      <Badge className="bg-[#25D366] text-white text-xs h-5 min-w-[20px]">
                        {student.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Chat view for a specific student
interface TeacherChatViewProps {
  student: StudentChatInfo;
  onBack: () => void;
  onClose: () => void;
  embedded?: boolean;
}

function TeacherChatView({ student, onBack, onClose, embedded = false }: TeacherChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const studentName = student.studentProfile?.display_name || 'Schüler';

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('video_chat_messages')
        .select('*')
        .eq('chat_id', student.chatId)
        .eq('message_type', 'text')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', senderIds);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        sender_profile: profiles?.find(p => p.id === msg.sender_user_id)
      }));

      setMessages(messagesWithProfiles);

      // Mark as read
      if (user) {
        await supabase
          .from('video_chat_messages')
          .update({ is_read: true })
          .eq('chat_id', student.chatId)
          .neq('sender_user_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [student.chatId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`teacher-student-chat-${student.chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
          filter: `chat_id=eq.${student.chatId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student.chatId]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: student.chatId,
          sender_user_id: user.id,
          sender_role: 'teacher',
          message_type: 'text',
          content: inputValue.trim()
        });

      if (error) throw error;

      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', student.chatId);

      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarImage src={student.studentProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-white/20 text-white">
              {studentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-[15px]">{studentName}</h2>
            <p className="text-[11px] text-white/70">
              {sending ? 'sendet...' : 'online'}
            </p>
          </div>
        </div>
        {!embedded && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          backgroundColor: '#ECE5DD',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      >
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#667781]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Avatar className="w-20 h-20 border-4 border-[#25D366]/30 mb-4">
                  <AvatarImage src={student.studentProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#25D366]/20 text-[#25D366] text-2xl">
                    {studentName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  Chat mit {studentName}
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  Noch keine Nachrichten. Schreibe die erste Nachricht!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isTeacher = message.sender_user_id === user?.id;
                const showTimestamp = index === 0 || 
                  new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-2">
                        <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                    )}

                    <div className={cn('flex items-end gap-2', isTeacher ? 'justify-end' : 'justify-start')}>
                      {!isTeacher && (
                        <Avatar className="w-8 h-8 shrink-0 mb-1">
                          <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-[#25D366]/20 text-[#25D366]">
                            {message.sender_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative',
                          isTeacher 
                            ? 'bg-[#DCF8C6] text-[#111B21] rounded-tr-none' 
                            : 'bg-white text-[#111B21] rounded-tl-none'
                        )}
                      >
                        <div 
                          className={cn('absolute top-0 w-3 h-3', isTeacher ? 'right-[-6px]' : 'left-[-6px]')}
                          style={{ 
                            borderLeft: isTeacher ? '12px solid #DCF8C6' : 'none', 
                            borderRight: !isTeacher ? '12px solid white' : 'none',
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent'
                          }}
                        />
                        <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-end gap-2 justify-end">
                <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2 p-2 bg-[#F0F2F5]">
        <div className="flex-1 bg-white rounded-3xl px-4 py-2 flex items-center shadow-sm">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nachricht eingeben..."
            disabled={sending}
            className="border-0 bg-transparent resize-none min-h-[24px] max-h-[120px] py-0 px-0 focus-visible:ring-0 text-[15px] placeholder:text-[#8696a0]"
            rows={1}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || !inputValue.trim()}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#1DAF5A] text-white shadow-md disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </>
  );
}
