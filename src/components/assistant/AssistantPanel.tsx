import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAssistant, AssistantMode, AssistantLanguage } from '@/hooks/useAssistant';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<AssistantMode, { de: string; en: string }> = {
  platform: { de: 'Plattform', en: 'Platform' },
  technique: { de: 'Übetipps', en: 'Practice' },
  mental: { de: 'Mental', en: 'Mental' },
  repertoire: { de: 'Repertoire', en: 'Repertoire' },
  mixed: { de: 'Alle', en: 'All' },
};

const LANGUAGE_LABELS: Record<AssistantLanguage, string> = {
  auto: 'Auto',
  de: 'DE',
  en: 'EN',
};

export function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
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
    <div className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Trumpetstar Assistent</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="p-3 border-b border-border bg-muted/10">
        <Tabs value={mode} onValueChange={(v) => setMode(v as AssistantMode)}>
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="platform" className="text-xs px-2">
              {MODE_LABELS.platform.de}
            </TabsTrigger>
            <TabsTrigger value="technique" className="text-xs px-2">
              {MODE_LABELS.technique.de}
            </TabsTrigger>
            <TabsTrigger value="mental" className="text-xs px-2">
              {MODE_LABELS.mental.de}
            </TabsTrigger>
            <TabsTrigger value="repertoire" className="text-xs px-2">
              {MODE_LABELS.repertoire.de}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Settings Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/5 text-sm">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Sprache:</Label>
          <div className="flex gap-1">
            {(['auto', 'de', 'en'] as AssistantLanguage[]).map((lang) => (
              <Button
                key={lang}
                variant={language === lang ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setLanguage(lang)}
              >
                {LANGUAGE_LABELS[lang]}
              </Button>
            ))}
          </div>
        </div>

        {/* Read Aloud Toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="read-aloud" className="text-xs text-muted-foreground">
            Vorlesen
          </Label>
          <Switch
            id="read-aloud"
            checked={readAloud}
            onCheckedChange={setReadAloud}
            className="scale-75"
          />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Stelle eine Frage zu Trumpetstar,</p>
              <p className="text-sm">Trompetentechnik oder Musikpraxis.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col max-w-[90%] rounded-lg p-3',
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'mr-auto bg-muted'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.role === 'assistant' && message.content && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  {/* Feedback buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0',
                      message.feedback === 'positive' && 'text-green-500'
                    )}
                    onClick={() => provideFeedback(message.id, 'positive')}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0',
                      message.feedback === 'negative' && 'text-red-500'
                    )}
                    onClick={() => provideFeedback(message.id, 'negative')}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto bg-muted rounded-lg p-3 max-w-[90%]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Controls (when speaking) */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border-t border-border">
          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Wird vorgelesen...</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={stopSpeaking}
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Frage stellen..."
              disabled={isLoading || isListening}
              className="pr-10"
            />
          </div>

          {/* Push-to-talk button */}
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={handleMicClick}
            disabled={isLoading}
            className={cn(
              'shrink-0',
              isListening && 'animate-pulse'
            )}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isListening && (
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            Sprich jetzt... Drücke erneut zum Stoppen.
          </p>
        )}
      </div>
    </div>
  );
}
