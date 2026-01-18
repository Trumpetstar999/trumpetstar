import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_user_id: string;
  sender_role: 'user' | 'teacher' | 'admin';
  message_type: 'text' | 'video' | 'marker';
  content: string | null;
  video_storage_path: string | null;
  timestamp_seconds: number | null;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeacherInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_assigned: boolean;
}

export interface TeacherChat {
  id: string;
  context_type: string;
  reference_video_id: string | null;
  reference_video_title: string | null;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export function useTeacherChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [chats, setChats] = useState<TeacherChat[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch assigned teacher
  const fetchTeacher = useCallback(async () => {
    if (!user) return;

    try {
      // Get teacher assignment
      const { data: assignment, error: assignError } = await supabase
        .from('teacher_assignments')
        .select('teacher_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignError) throw assignError;

      if (assignment) {
        // Get teacher profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', assignment.teacher_id)
          .single();

        if (profileError) throw profileError;

        setTeacher({
          ...profile,
          is_assigned: true
        });
      } else {
        // Try to auto-assign a teacher
        const { data: teachers, error: teachersError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('is_teacher', true)
          .limit(1);

        if (teachersError) throw teachersError;

        if (teachers && teachers.length > 0) {
          const selectedTeacher = teachers[0];
          
          // Create assignment
          const { error: createError } = await supabase
            .from('teacher_assignments')
            .insert({
              user_id: user.id,
              teacher_id: selectedTeacher.id,
              is_active: true
            });

          if (createError) {
            console.error('Auto-assign error:', createError);
            setTeacher({
              ...selectedTeacher,
              is_assigned: false
            });
          } else {
            setTeacher({
              ...selectedTeacher,
              is_assigned: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
    }
  }, [user]);

  // Fetch chats with teacher
  const fetchChats = useCallback(async () => {
    if (!user || !teacher) return;

    try {
      // Get all chats where user is creator and teacher is participant
      // Using direct query to avoid RLS recursion issues
      const { data: userChats, error: chatsError } = await supabase
        .from('video_chats')
        .select(`
          id,
          context_type,
          reference_video_id,
          created_at,
          updated_at
        `)
        .eq('created_by', user.id)
        .eq('context_type', 'user_video')
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      if (!userChats || userChats.length === 0) {
        setChats([]);
        return;
      }

      // Get chat details
      const chatsWithDetails = await Promise.all(
        userChats.map(async (chat) => {
          // Get video title if exists
          let videoTitle = null;
          if (chat.reference_video_id) {
            const { data: video } = await supabase
              .from('user_recordings')
              .select('title')
              .eq('id', chat.reference_video_id)
              .single();
            videoTitle = video?.title;
          }

          // Get last message
          const { data: lastMsg } = await supabase
            .from('video_chat_messages')
            .select('content, created_at, message_type')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from('video_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_user_id', user.id);

          let lastMessageText = lastMsg?.content || '';
          if (lastMsg?.message_type === 'video') lastMessageText = '🎥 Video';
          if (lastMsg?.message_type === 'marker') lastMessageText = '📍 Zeitmarker';

          return {
            id: chat.id,
            context_type: chat.context_type,
            reference_video_id: chat.reference_video_id,
            reference_video_title: videoTitle,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            last_message: lastMessageText,
            last_message_time: lastMsg?.created_at,
            unread_count: count || 0
          } as TeacherChat;
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [user, teacher]);

  // Create new chat with teacher (with or without video)
  const createChat = async (videoId: string | null = null): Promise<string | null> => {
    if (!user || !teacher) {
      toast({
        title: 'Kein Lehrer',
        description: 'Dir ist noch kein Lehrer zugewiesen.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      // Create the chat
      const { data: chat, error: chatError } = await supabase
        .from('video_chats')
        .insert({
          context_type: 'user_video',
          reference_video_id: videoId,
          created_by: user.id
        })
        .select('id')
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: partError } = await supabase
        .from('video_chat_participants')
        .insert([
          { chat_id: chat.id, user_id: user.id, role: 'user' },
          { chat_id: chat.id, user_id: teacher.id, role: 'teacher' }
        ]);

      if (partError) throw partError;

      // If video, create video share
      if (videoId) {
        await supabase.from('video_shares').insert({
          video_id: videoId,
          shared_by_user_id: user.id,
          shared_with_user_id: teacher.id,
          share_type: 'teacher',
          chat_id: chat.id
        });
      }

      await fetchChats();
      
      toast({
        title: videoId ? 'Video gesendet' : 'Chat erstellt',
        description: `Chat mit ${teacher.display_name || 'deinem Lehrer'} wurde erstellt.`
      });

      return chat.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Fehler',
        description: 'Chat konnte nicht erstellt werden.',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Send message
  const sendMessage = async (
    chatId: string,
    content: string,
    messageType: 'text' | 'video' | 'marker' = 'text',
    videoPath: string | null = null,
    timestamp: number | null = null
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: chatId,
          sender_user_id: user.id,
          sender_role: 'user',
          message_type: messageType,
          content,
          video_storage_path: videoPath,
          timestamp_seconds: timestamp
        });

      if (error) throw error;

      // Update chat timestamp
      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Load data
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchTeacher().finally(() => setLoading(false));
    }
  }, [user, fetchTeacher]);

  // Load chats after teacher is loaded
  useEffect(() => {
    if (teacher) {
      fetchChats();
    }
  }, [teacher, fetchChats]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('teacher-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChats]);

  return {
    teacher,
    chats,
    loading,
    createChat,
    sendMessage,
    refetch: fetchChats
  };
}

// Hook for loading messages in a specific chat
export function useTeacherChatMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('video_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', senderIds);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        sender_role: msg.sender_role as 'user' | 'teacher' | 'admin',
        message_type: msg.message_type as 'text' | 'video' | 'marker',
        sender_profile: profiles?.find(p => p.id === msg.sender_user_id)
      }));

      setMessages(messagesWithProfiles);

      // Mark as read
      if (user) {
        await supabase
          .from('video_chat_messages')
          .update({ is_read: true })
          .eq('chat_id', chatId)
          .neq('sender_user_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for this chat
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
}
