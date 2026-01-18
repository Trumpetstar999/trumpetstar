import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTeacherChat } from '@/hooks/useTeacherChat';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

interface TeacherChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherChatPanel({ isOpen, onClose }: TeacherChatPanelProps) {
  const { user } = useAuth();
  const { isTeacher } = useUserRole();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    chatInfo,
    messages,
    loading,
    sendingMessage,
    sendMessage,
  } = useTeacherChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (inputValue.trim() && !sendingMessage) {
      const role = isTeacher ? 'teacher' : 'user';
      const success = await sendMessage(inputValue, role);
      if (success) {
        setInputValue('');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const teacherName = chatInfo.teacherProfile?.display_name || 'Dein Lehrer';
  const teacherAvatar = chatInfo.teacherProfile?.avatar_url;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] max-w-full z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
      {/* Header - WhatsApp style */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarImage src={teacherAvatar || undefined} />
            <AvatarFallback className="bg-white/20 text-white">
              {teacherName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-[15px]">{teacherName}</h2>
            <p className="text-[11px] text-white/70">
              {sendingMessage ? 'sendet...' : 'online'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Area - WhatsApp wallpaper style */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          backgroundColor: '#ECE5DD',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      >
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-3">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#667781]" />
              </div>
            )}

            {/* No Teacher Assigned */}
            {!loading && !chatInfo.teacherId && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-[#667781]" />
                </div>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  Kein Lehrer zugewiesen
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  Dir ist noch kein Lehrer zugewiesen. Bitte wende dich an den Admin.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && chatInfo.teacherId && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Avatar className="w-20 h-20 border-4 border-[#25D366]/30 mb-4">
                  <AvatarImage src={teacherAvatar || undefined} />
                  <AvatarFallback className="bg-[#25D366]/20 text-[#25D366] text-2xl">
                    {teacherName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  Chat mit {teacherName}
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  Schreibe deinem Lehrer eine Nachricht!
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isUser = message.sender_user_id === user?.id;
              const showTimestamp = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

              return (
                <div key={message.id}>
                  {/* Timestamp divider */}
                  {showTimestamp && (
                    <div className="flex justify-center my-2">
                      <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                    {/* Avatar for other person's messages */}
                    {!isUser && (
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
                        isUser 
                          ? 'bg-[#DCF8C6] text-[#111B21] rounded-tr-none' 
                          : 'bg-white text-[#111B21] rounded-tl-none'
                      )}
                    >
                      {/* Message tail */}
                      <div 
                        className={cn(
                          'absolute top-0 w-3 h-3',
                          isUser 
                            ? 'right-[-6px]'
                            : 'left-[-6px]'
                        )}
                        style={{ 
                          borderLeft: isUser ? '12px solid #DCF8C6' : 'none', 
                          borderRight: !isUser ? '12px solid white' : 'none',
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent'
                        }}
                      />
                      
                      {/* Content */}
                      <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Sending Indicator */}
            {sendingMessage && (
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
      {chatInfo.teacherId && (
        <div className="flex items-end gap-2 p-2 bg-[#F0F2F5]">
          {/* Text Input */}
          <div className="flex-1 bg-white rounded-3xl px-4 py-2 flex items-center shadow-sm">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nachricht eingeben..."
              disabled={sendingMessage}
              className="border-0 bg-transparent resize-none min-h-[24px] max-h-[120px] py-0 px-0 focus-visible:ring-0 text-[15px] placeholder:text-[#8696a0]"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sendingMessage || !inputValue.trim()}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#1DAF5A] text-white shadow-md disabled:opacity-50"
          >
            {sendingMessage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
