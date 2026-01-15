import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, MessageSquare, Send, GraduationCap, Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Teacher {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TeacherChat {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    profile?: Teacher;
  }[];
  last_message?: {
    content: string | null;
    message_type: string;
    created_at: string;
  };
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_user_id: string;
  sender_role: string;
  message_type: string;
  content: string | null;
  created_at: string;
  sender_profile?: Teacher;
}

export function AdminTeacherChats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<TeacherChat[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<TeacherChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      // Get all teacher discussion chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('video_chats')
        .select('*')
        .eq('context_type', 'teacher_discussion')
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Get participants for each chat
      const chatsWithDetails = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: participants } = await supabase
            .from('video_chat_participants')
            .select('user_id')
            .eq('chat_id', chat.id);

          // Get profiles for participants
          const userIds = participants?.map(p => p.user_id) || [];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('video_chat_messages')
            .select('content, message_type, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('video_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_user_id', user.id);

          return {
            ...chat,
            participants: participants?.map(p => ({
              user_id: p.user_id,
              profile: profiles?.find(pr => pr.id === p.user_id)
            })) || [],
            last_message: lastMsg,
            unread_count: unreadCount || 0
          } as TeacherChat;
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching teacher chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('is_teacher', true);

    if (!error) {
      setTeachers(data || []);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
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
      await supabase
        .from('video_chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_user_id', user?.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchTeachers();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`admin-teacher-chat-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
          filter: `chat_id=eq.${selectedChat.id}`
        },
        () => {
          fetchMessages(selectedChat.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !user || sending) return;

    setSending(true);
    try {
      // First ensure admin is a participant
      const { data: existingParticipant } = await supabase
        .from('video_chat_participants')
        .select('id')
        .eq('chat_id', selectedChat.id)
        .eq('user_id', user.id)
        .single();

      if (!existingParticipant) {
        await supabase
          .from('video_chat_participants')
          .insert({
            chat_id: selectedChat.id,
            user_id: user.id,
            role: 'admin'
          });
      }

      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: selectedChat.id,
          sender_user_id: user.id,
          sender_role: 'admin',
          message_type: 'text',
          content: messageText.trim()
        });

      if (error) throw error;

      // Update chat updated_at
      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setMessageText('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateChat = async (teacher1Id: string, teacher2Id: string) => {
    if (!user) return;

    try {
      // Create chat
      const { data: chat, error: chatError } = await supabase
        .from('video_chats')
        .insert({
          context_type: 'teacher_discussion',
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      await supabase
        .from('video_chat_participants')
        .insert([
          { chat_id: chat.id, user_id: teacher1Id, role: 'teacher' },
          { chat_id: chat.id, user_id: teacher2Id, role: 'teacher' }
        ]);

      toast({
        title: 'Chat erstellt',
        description: 'Neuer Lehrer-Chat wurde erstellt.'
      });

      setNewChatDialogOpen(false);
      fetchChats();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Fehler',
        description: 'Chat konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const getChatTitle = (chat: TeacherChat) => {
    const names = chat.participants
      .map(p => p.profile?.display_name || 'Unbekannt')
      .join(' & ');
    return names || 'Lehrer-Chat';
  };

  const filteredTeachers = teachers.filter(t =>
    t.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Lehrer-Chats</h3>
          <Badge variant="outline">{chats.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewChatDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
        {/* Chat List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground">Alle Lehrer-Chats</p>
          </div>
          <ScrollArea className="h-[calc(500px-48px)]">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine Lehrer-Chats vorhanden</p>
              </div>
            ) : (
              <div className="divide-y">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-muted/50 transition-colors',
                      selectedChat?.id === chat.id && 'bg-primary/5 border-l-2 border-l-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {chat.participants.slice(0, 2).map((p, i) => (
                          <Avatar key={i} className="w-8 h-8 border-2 border-background">
                            <AvatarImage src={p.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {p.profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {getChatTitle(chat)}
                          </span>
                          {chat.unread_count > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] bg-accent">
                              {chat.unread_count}
                            </Badge>
                          )}
                        </div>
                        {chat.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.last_message.message_type === 'text' 
                              ? chat.last_message.content 
                              : '📎 Anhang'}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Messages */}
        <div className="border rounded-lg overflow-hidden flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedChat.participants.slice(0, 2).map((p, i) => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-background">
                      <AvatarImage src={p.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {p.profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="font-medium text-sm">{getChatTitle(selectedChat)}</span>
              </div>

              <ScrollArea className="flex-1 p-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Noch keine Nachrichten
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_user_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex gap-2', isOwn && 'flex-row-reverse')}
                        >
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {msg.sender_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn('max-w-[75%]', isOwn && 'items-end')}>
                            <div
                              className={cn(
                                'rounded-2xl px-3 py-2 text-sm',
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}
                            >
                              {msg.content}
                            </div>
                            <p className={cn(
                              'text-xs text-muted-foreground mt-0.5 px-1',
                              isOwn && 'text-right'
                            )}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: de })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
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
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Wähle einen Chat aus
            </div>
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Neuen Lehrer-Chat erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lehrer suchen..."
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Wähle zwei Lehrer aus, um einen Chat zu erstellen:
            </p>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={teacher.avatar_url || undefined} />
                      <AvatarFallback>
                        {teacher.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium">
                      {teacher.display_name || 'Unbenannt'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // For simplicity, create a chat with this teacher and the first other teacher
                        const otherTeacher = teachers.find(t => t.id !== teacher.id);
                        if (otherTeacher) {
                          handleCreateChat(teacher.id, otherTeacher.id);
                        } else {
                          toast({
                            title: 'Fehler',
                            description: 'Es muss mindestens ein weiterer Lehrer vorhanden sein.',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      Chat starten
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
