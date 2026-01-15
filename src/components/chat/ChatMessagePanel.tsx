import { useState, useRef, useEffect } from 'react';
import { VideoChat, useChatMessages, useVideoChat } from '@/hooks/useVideoChat';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VideoRecordDialog } from './VideoRecordDialog';
import { Send, Video, Clock, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatMessagePanelProps {
  chat: VideoChat;
  currentVideoTime: number;
  onSeekToTime: (time: number) => void;
}

export function ChatMessagePanel({ chat, currentVideoTime, onSeekToTime }: ChatMessagePanelProps) {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const { messages, loading } = useChatMessages(chat.id);
  const { sendMessage, markAsRead } = useVideoChat();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [markerText, setMarkerText] = useState('');
  const [markerTime, setMarkerTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Determine sender role
  const getSenderRole = (): 'user' | 'teacher' | 'admin' => {
    if (isAdmin) return 'admin';
    if (isTeacher) return 'teacher';
    return 'user';
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (chat.id) {
      markAsRead(chat.id);
    }
  }, [chat.id, messages.length, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  // Listen for marker events from video panel
  useEffect(() => {
    const handleAddMarker = (e: CustomEvent<{ time: number }>) => {
      setMarkerTime(e.detail.time);
      setMarkerDialogOpen(true);
    };

    window.addEventListener('add-marker', handleAddMarker as EventListener);
    return () => window.removeEventListener('add-marker', handleAddMarker as EventListener);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setIsAtBottom(isBottom);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(chat.id, 'text', messageText.trim(), null, null, getSenderRole());
    if (success) {
      setMessageText('');
    }
    setSending(false);
  };

  const handleSendMarker = async () => {
    if (sending) return;

    setSending(true);
    await sendMessage(chat.id, 'marker', markerText || null, null, Math.floor(markerTime), getSenderRole());
    setMarkerDialogOpen(false);
    setMarkerText('');
    setSending(false);
  };

  const handleSendVideo = async (data: { blob: Blob; duration: number; title: string }) => {
    if (!user) return;

    // Upload video to storage
    const fileName = `${user.id}/response_${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, data.blob, {
        contentType: 'video/webm',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Send message with video path
    await sendMessage(chat.id, 'video', data.title, fileName, null, getSenderRole());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef as any} onScroll={handleScroll as any}>
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Noch keine Nachrichten. Starte die Konversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_user_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {message.sender_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn('max-w-[75%] space-y-1', isOwnMessage && 'items-end')}>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {message.message_type === 'marker' ? (
                        <button
                          onClick={() => onSeekToTime(message.timestamp_seconds!)}
                          className={cn(
                            'flex items-center gap-2 group',
                            isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                          )}
                        >
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-mono',
                            isOwnMessage
                              ? 'bg-primary-foreground/20'
                              : 'bg-[#FFCC00]/20 text-[#FFCC00]'
                          )}>
                            {formatTime(message.timestamp_seconds!)}
                          </span>
                          {message.content && (
                            <span className="text-sm">{message.content}</span>
                          )}
                          <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : message.message_type === 'video' ? (
                        <VideoMessage 
                          storagePath={message.video_storage_path!}
                          isOwnMessage={isOwnMessage}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs text-muted-foreground px-2',
                      isOwnMessage && 'text-right'
                    )}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex items-center gap-2">
          {/* Video button - only for teachers and admins */}
          {(isTeacher || isAdmin) && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setVideoDialogOpen(true)}
              title="Antwort-Video aufnehmen"
            >
              <Video className="w-5 h-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => {
              setMarkerTime(currentVideoTime);
              setMarkerDialogOpen(true);
            }}
            title="Marker hinzufügen"
          >
            <Clock className="w-5 h-5" />
          </Button>

          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <Button
            size="icon"
            className="flex-shrink-0 bg-accent hover:bg-accent/90"
            onClick={handleSendMessage}
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

      {/* Marker Dialog */}
      <Dialog open={markerDialogOpen} onOpenChange={setMarkerDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Zeitmarker hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 text-[#FFCC00]" />
              <span className="font-mono text-lg">{formatTime(markerTime)}</span>
            </div>
            <Input
              value={markerText}
              onChange={(e) => setMarkerText(e.target.value)}
              placeholder="Kommentar (optional)"
            />
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={handleSendMarker}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Marker senden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Record Dialog */}
      <VideoRecordDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        onSave={handleSendVideo}
      />
    </div>
  );
}

// Video message component
function VideoMessage({ storagePath, isOwnMessage }: { storagePath: string; isOwnMessage: boolean }) {
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
      <div className="flex items-center gap-2">
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
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4" />
        <span className="text-sm">Antwort-Video</span>
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
