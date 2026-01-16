import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, Square, MessageSquare, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAssistant, AssistantMode, AssistantLanguage } from '@/hooks/useAssistant';
import { format } from 'date-fns';
import toniAvatar from '@/assets/toni-coach.png';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<AssistantMode, string> = {
  platform: '📱 Plattform',
  technique: '🎺 Übetipps',
  mental: '🧠 Mental',
  repertoire: '🎵 Repertoire',
  mixed: '✨ Alles',
};

export function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    mode,
    language,
    readAloud,
    setMode,
    setLanguage,
    setReadAloud,
    sendMessage,
    stopSpeaking,
    startListening,
    stopListening,
    provideFeedback,
    clearMessages,
  } = useAssistant();

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

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] max-w-full z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
      {/* Header - WhatsApp style green */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            <img src={toniAvatar} alt="Toni" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-semibold text-[15px]">Toni dein Trompeten-Coach</h2>
            <p className="text-[11px] text-white/70">
              {isLoading ? 'tippt...' : 'online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearMessages} 
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#25D366]/30 mb-4">
                  <img src={toniAvatar} alt="Toni" className="h-full w-full object-cover" />
                </div>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  Hallo, ich bin Toni!
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  Frag mich zu Trompetentechnik, Übetipps, Repertoire oder der Plattform.
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const showTimestamp = index === 0 || 
                new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 60000;

              return (
                <div key={message.id}>
                  {/* Timestamp divider */}
                  {showTimestamp && (
                    <div className="flex justify-center my-2">
                      <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm">
                        {format(message.timestamp, 'HH:mm')}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
                    {/* Toni Avatar for assistant messages */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1">
                        <img src={toniAvatar} alt="Toni" className="h-full w-full object-cover" />
                      </div>
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
                            ? 'right-[-6px] border-l-[12px] border-l-[#DCF8C6] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                            : 'left-[-6px] border-r-[12px] border-r-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                        )}
                        style={{ borderLeft: isUser ? '12px solid #DCF8C6' : 'none', borderRight: !isUser ? '12px solid white' : 'none' }}
                      />
                      
                      {/* Content */}
                      <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                        {message.content || (
                          <span className="text-[#8696a0] italic">Nachricht wird geladen...</span>
                        )}
                      </p>
                      
                      {/* Feedback for assistant messages */}
                      {!isUser && message.content && (
                        <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-[#e9edef]">
                          <span className="text-[10px] text-[#8696a0] mr-auto">War das hilfreich?</span>
                          <button
                            onClick={() => provideFeedback(message.id, 'positive')}
                            className={cn(
                              'p-1 rounded transition-colors',
                              message.feedback === 'positive' 
                                ? 'text-[#25D366] bg-[#25D366]/10' 
                                : 'text-[#8696a0] hover:text-[#25D366] hover:bg-[#25D366]/10'
                            )}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => provideFeedback(message.id, 'negative')}
                            className={cn(
                              'p-1 rounded transition-colors',
                              message.feedback === 'negative' 
                                ? 'text-red-500 bg-red-500/10' 
                                : 'text-[#8696a0] hover:text-red-500 hover:bg-red-500/10'
                            )}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1">
                  <img src={toniAvatar} alt="Toni" className="h-full w-full object-cover" />
                </div>
                <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
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

      {/* Voice Playback Bar */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-[#25D366] text-white">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Wird vorgelesen...</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white hover:bg-white/20"
            onClick={stopSpeaking}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recording Indicator */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm">Aufnahme läuft... Tippe erneut zum Stoppen</span>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-2 bg-[#F0F2F5]">
        {/* Text Input */}
        <div className="flex-1 bg-white rounded-3xl px-4 py-2 flex items-center shadow-sm">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nachricht eingeben..."
            disabled={isLoading || isListening}
            className="border-0 bg-transparent resize-none min-h-[24px] max-h-[120px] py-0 px-0 focus-visible:ring-0 text-[15px] placeholder:text-[#8696a0]"
            rows={1}
          />
        </div>

        {/* Mic / Send Button */}
        {inputValue.trim() ? (
          <Button
            onClick={handleSend}
            disabled={isLoading}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#1DAF5A] text-white shadow-md"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={handleMicClick}
            disabled={isLoading}
            size="icon"
            className={cn(
              'shrink-0 h-10 w-10 rounded-full shadow-md',
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-[#25D366] hover:bg-[#1DAF5A] text-white'
            )}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
