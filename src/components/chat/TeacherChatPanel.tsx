import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, ArrowLeft, Video, Upload, Paperclip, FolderOpen, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTeacherChat } from '@/hooks/useTeacherChat';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { VideoRecordDialog } from './VideoRecordDialog';
import { SelectRecordingDialog } from './SelectRecordingDialog';
import { SelectLevelVideoDialog } from './SelectLevelVideoDialog';
import { LevelVideoMessageCard, isLevelVideoContent } from './LevelVideoMessageCard';
import { Recording } from '@/hooks/useRecordings';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeacherChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  studentId?: string; // For teacher view - chat with specific student
}

export function TeacherChatPanel({ isOpen, onClose, embedded = false, studentId }: TeacherChatPanelProps) {
  const { user } = useAuth();
  const { isTeacher } = useUserRole();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectRecordingDialogOpen, setSelectRecordingDialogOpen] = useState(false);
  const [selectLevelVideoDialogOpen, setSelectLevelVideoDialogOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // For student view, use the standard hook
  const studentChat = useTeacherChat();

  // For teacher view with specific student, we need custom state
  const [teacherMessages, setTeacherMessages] = useState<any[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherSending, setTeacherSending] = useState(false);
  const [studentProfile, setStudentProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  // Fetch teacher-student chat when studentId is provided
  useEffect(() => {
    if (!studentId || !user) return;

    const fetchChat = async () => {
      setTeacherLoading(true);
      try {
        // Get student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', studentId)
          .single();
        
        setStudentProfile(profile);

        // Find existing chat
        const { data: chats } = await supabase
          .from('video_chats')
          .select(`
            id,
            video_chat_participants!inner(user_id, role)
          `)
          .eq('context_type', 'teacher_chat');

        const existingChat = chats?.find(chat => {
          const participants = chat.video_chat_participants;
          const hasStudent = participants.some((p: any) => p.user_id === studentId && p.role === 'user');
          const hasTeacher = participants.some((p: any) => p.user_id === user.id && p.role === 'teacher');
          return hasStudent && hasTeacher;
        });

        if (existingChat) {
          setChatId(existingChat.id);
          await fetchMessages(existingChat.id);
        }
      } finally {
        setTeacherLoading(false);
      }
    };

    fetchChat();
  }, [studentId, user]);

  const fetchMessages = async (cId: string) => {
    const { data, error } = await supabase
      .from('video_chat_messages')
      .select('*')
      .eq('chat_id', cId)
      .order('created_at', { ascending: true });

    if (error) return;

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

    setTeacherMessages(messagesWithProfiles);

    // Mark as read
    if (user) {
      await supabase
        .from('video_chat_messages')
        .update({ is_read: true })
        .eq('chat_id', cId)
        .neq('sender_user_id', user.id);
    }
  };

  // Realtime for teacher view
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`teacher-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          fetchMessages(chatId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Determine which data to use
  const isTeacherView = !!studentId;
  const messages = isTeacherView ? teacherMessages : studentChat.messages;
  const loading = isTeacherView ? teacherLoading : studentChat.loading;
  const sendingMessage = isTeacherView ? teacherSending : studentChat.sendingMessage;
  const chatInfo = isTeacherView 
    ? { teacherId: user?.id, teacherProfile: studentProfile }
    : studentChat.chatInfo;
  const currentChatId = isTeacherView ? chatId : studentChat.chatInfo.chatId;

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
    if (!inputValue.trim() || sendingMessage || !user) return;

    if (isTeacherView && chatId) {
      setTeacherSending(true);
      try {
        const { error } = await supabase
          .from('video_chat_messages')
          .insert({
            chat_id: chatId,
            sender_user_id: user.id,
            sender_role: 'teacher',
            message_type: 'text',
            content: inputValue.trim()
          });

        if (!error) {
          await supabase
            .from('video_chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId);
          setInputValue('');
        }
      } finally {
        setTeacherSending(false);
      }
    } else {
      const role = isTeacher ? 'teacher' : 'user';
      const success = await studentChat.sendMessage(inputValue, role);
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

  // Handle video recording save
  const handleVideoRecordSave = async (data: { blob: Blob; duration: number; title: string }) => {
    if (!user || !currentChatId) return;

    setUploadingVideo(true);
    try {
      const fileName = `${user.id}/${Date.now()}-chat-video.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, data.blob, { contentType: 'video/webm' });

      if (uploadError) throw uploadError;

      // Send video message
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: currentChatId,
          sender_user_id: user.id,
          sender_role: isTeacher ? 'teacher' : 'user',
          message_type: 'video',
          video_storage_path: fileName,
          content: data.title || 'Video-Nachricht'
        });

      if (error) throw error;

      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);

      toast.success('Video gesendet');
      
      if (isTeacherView && chatId) {
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      toast.error('Video konnte nicht gesendet werden');
      throw err;
    } finally {
      setUploadingVideo(false);
    }
  };

  // Handle video file upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentChatId) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Bitte wähle eine Videodatei aus');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video darf maximal 100MB groß sein');
      return;
    }

    setUploadingVideo(true);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const fileName = `${user.id}/${Date.now()}-chat-upload.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: currentChatId,
          sender_user_id: user.id,
          sender_role: isTeacher ? 'teacher' : 'user',
          message_type: 'video',
          video_storage_path: fileName,
          content: file.name
        });

      if (error) throw error;

      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);

      toast.success('Video hochgeladen');

      if (isTeacherView && chatId) {
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploadingVideo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle selecting existing recording
  const handleSelectRecording = async (recording: Recording) => {
    if (!user || !currentChatId) return;

    setUploadingVideo(true);
    try {
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: currentChatId,
          sender_user_id: user.id,
          sender_role: isTeacher ? 'teacher' : 'user',
          message_type: 'video',
          video_storage_path: recording.storage_path,
          content: recording.title
        });

      if (error) throw error;

      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);

      toast.success('Video gesendet');

      if (isTeacherView && chatId) {
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Error sending recording:', err);
      toast.error('Video konnte nicht gesendet werden');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Handle selecting a level video (teacher only)
  const handleSelectLevelVideo = async (video: { id: string; title: string; thumbnail_url: string | null; vimeo_video_id: string; level_title: string }) => {
    if (!user || !currentChatId) return;

    setUploadingVideo(true);
    try {
      // Store video info as JSON in content for rendering as a clickable card
      const videoData = JSON.stringify({
        type: 'level_video',
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail_url,
        levelTitle: video.level_title,
        vimeoId: video.vimeo_video_id
      });
      
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: currentChatId,
          sender_user_id: user.id,
          sender_role: 'teacher',
          message_type: 'text',
          content: videoData
        });

      if (error) throw error;

      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);

      toast.success('Video-Empfehlung gesendet');

      if (isTeacherView && chatId) {
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Error sending level video:', err);
      toast.error('Video konnte nicht gesendet werden');
    } finally {
      setUploadingVideo(false);
    }
  };

  if (!isOpen) return null;

  const displayName = isTeacherView 
    ? (studentProfile?.display_name || 'Schüler')
    : (chatInfo.teacherProfile?.display_name || 'Dein Lehrer');
  const avatarUrl = isTeacherView 
    ? studentProfile?.avatar_url 
    : chatInfo.teacherProfile?.avatar_url;
  const hasChat = isTeacherView ? !!chatId : !!chatInfo.teacherId;

  // Get both profiles for avatars
  const myProfile = messages.find(m => m.sender_user_id === user?.id)?.sender_profile;
  const otherProfile = isTeacherView ? studentProfile : chatInfo.teacherProfile;

  // Container classes based on embedded mode
  const containerClasses = embedded
    ? 'flex flex-col h-full w-full bg-background'
    : 'fixed right-0 top-0 h-full w-[420px] max-w-full z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl';

  return (
    <div className={containerClasses}>
      {/* Header - WhatsApp style */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
        <div className="flex items-center gap-3">
          {embedded && isTeacherView && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-white/20 text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-[15px]">{displayName}</h2>
            <p className="text-[11px] text-white/70">
              {sendingMessage || uploadingVideo ? 'sendet...' : 'online'}
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

      {/* Chat Area - WhatsApp wallpaper style */}
      <div 
        className="flex-1 min-h-0 overflow-hidden"
        style={{ 
          backgroundColor: '#ECE5DD',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      >
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-3 pb-4">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#667781]" />
              </div>
            )}

            {/* No Chat Available */}
            {!loading && !hasChat && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-[#667781]" />
                </div>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  {isTeacherView ? 'Kein Chat gefunden' : 'Kein Lehrer zugewiesen'}
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  {isTeacherView 
                    ? 'Der Schüler muss zuerst eine Nachricht senden.'
                    : 'Dir ist noch kein Lehrer zugewiesen. Bitte wende dich an den Admin.'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && hasChat && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Avatar className="w-20 h-20 border-4 border-[#25D366]/30 mb-4">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#25D366]/20 text-[#25D366] text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-[#667781] text-sm font-medium mb-1">
                  Chat mit {displayName}
                </p>
                <p className="text-[#8696a0] text-xs max-w-[280px]">
                  {isTeacherView 
                    ? 'Noch keine Nachrichten. Schreibe die erste Nachricht!'
                    : 'Schreibe deinem Lehrer eine Nachricht!'}
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_user_id === user?.id;
              const showTimestamp = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;
              const isVideoMessage = message.message_type === 'video';
              const senderAvatar = message.sender_profile?.avatar_url;
              const senderName = message.sender_profile?.display_name;
              
              // Check if this is a level video card message
              const levelVideoData = message.content ? isLevelVideoContent(message.content) : null;
              const isLevelVideoMessage = !!levelVideoData;

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
                  <div className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}>
                    {/* Avatar for other person's messages (left side) */}
                    {!isCurrentUser && (
                      <Avatar className="w-8 h-8 shrink-0 mb-1">
                        <AvatarImage src={senderAvatar || otherProfile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-[#25D366]/20 text-[#25D366]">
                          {(senderName || otherProfile?.display_name || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg shadow-sm relative overflow-hidden',
                        isCurrentUser 
                          ? 'bg-[#DCF8C6] text-[#111B21] rounded-tr-none' 
                          : 'bg-white text-[#111B21] rounded-tl-none',
                        (isVideoMessage || isLevelVideoMessage) ? 'p-1' : 'px-3 py-2'
                      )}
                    >
                      {/* Message tail */}
                      {!isVideoMessage && !isLevelVideoMessage && (
                        <div 
                          className={cn(
                            'absolute top-0 w-3 h-3',
                            isCurrentUser 
                              ? 'right-[-6px]'
                              : 'left-[-6px]'
                          )}
                          style={{ 
                            borderLeft: isCurrentUser ? '12px solid #DCF8C6' : 'none', 
                            borderRight: !isCurrentUser ? '12px solid white' : 'none',
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent'
                          }}
                        />
                      )}
                      
                      {/* Content */}
                      {isVideoMessage && message.video_storage_path ? (
                        <VideoMessageContent storagePath={message.video_storage_path} />
                      ) : isLevelVideoMessage && levelVideoData ? (
                        <LevelVideoMessageCard data={levelVideoData} />
                      ) : (
                        <p className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </div>
                    {/* Avatar for current user's messages (right side) */}
                    {isCurrentUser && (
                      <Avatar className="w-8 h-8 shrink-0 mb-1">
                        <AvatarImage src={senderAvatar || myProfile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-[#075E54]/20 text-[#075E54]">
                          {(senderName || 'Ich').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Sending Indicator */}
            {(sendingMessage || uploadingVideo) && (
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

      {/* Fixed Input Area at Bottom */}
      {hasChat && (
        <div className="flex-shrink-0 flex items-end gap-2 p-2 bg-[#F0F2F5] border-t border-gray-200">
          {/* Attachment/Video Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-full text-[#54656F] hover:bg-gray-200"
                disabled={sendingMessage || uploadingVideo}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white">
              <DropdownMenuItem onClick={() => setVideoDialogOpen(true)} className="gap-2 cursor-pointer">
                <Video className="h-4 w-4 text-red-500" />
                Video aufnehmen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 cursor-pointer">
                <Upload className="h-4 w-4 text-blue-500" />
                Video hochladen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectRecordingDialogOpen(true)} className="gap-2 cursor-pointer">
                <FolderOpen className="h-4 w-4 text-green-500" />
                Aus Aufnahmen wählen
              </DropdownMenuItem>
              {isTeacher && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectLevelVideoDialogOpen(true)} className="gap-2 cursor-pointer">
                    <Film className="h-4 w-4 text-purple-500" />
                    Video aus Levels
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />

          {/* Text Input */}
          <div className="flex-1 bg-white rounded-3xl px-4 py-2 flex items-center shadow-sm">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nachricht eingeben..."
              disabled={sendingMessage || uploadingVideo}
              className="border-0 bg-transparent resize-none min-h-[24px] max-h-[120px] py-0 px-0 focus-visible:ring-0 text-[15px] placeholder:text-[#8696a0]"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sendingMessage || uploadingVideo || !inputValue.trim()}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#1DAF5A] text-white shadow-md disabled:opacity-50"
          >
            {sendingMessage || uploadingVideo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}

      {/* Video Record Dialog */}
      <VideoRecordDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        onSave={handleVideoRecordSave}
      />

      {/* Select Recording Dialog */}
      <SelectRecordingDialog
        open={selectRecordingDialogOpen}
        onOpenChange={setSelectRecordingDialogOpen}
        onSelect={handleSelectRecording}
      />

      {/* Select Level Video Dialog (Teacher only) */}
      <SelectLevelVideoDialog
        open={selectLevelVideoDialogOpen}
        onOpenChange={setSelectLevelVideoDialogOpen}
        onSelect={handleSelectLevelVideo}
      />
    </div>
  );
}

// Component to display video messages
function VideoMessageContent({ storagePath }: { storagePath: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { data } = await supabase.storage
          .from('recordings')
          .createSignedUrl(storagePath, 3600);
        
        if (data?.signedUrl) {
          setVideoUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error loading video:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [storagePath]);

  if (loading) {
    return (
      <div className="w-[240px] h-[135px] bg-black/10 rounded flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-[240px] h-[135px] bg-black/10 rounded flex items-center justify-center">
        <Video className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      playsInline
      className="w-[240px] max-h-[200px] rounded object-contain bg-black"
    />
  );
}
