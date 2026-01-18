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

export interface VideoChat {
  id: string;
  context_type: 'user_video' | 'teacher_discussion' | 'admin_feedback';
  reference_video_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  reference_video?: {
    id: string;
    title: string | null;
    storage_path: string;
  };
  participants?: {
    user_id: string;
    role: string;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  }[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface TeacherAssignment {
  id: string;
  user_id: string;
  teacher_id: string;
  assigned_at: string;
  is_active: boolean;
  teacher_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useVideoChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<VideoChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherAssignment, setTeacherAssignment] = useState<TeacherAssignment | null>(null);

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      // First get all chat IDs user participates in
      const { data: participations, error: partError } = await supabase
        .from('video_chat_participants')
        .select('chat_id, role')
        .eq('user_id', user.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setChats([]);
        return;
      }

      const chatIds = participations.map(p => p.chat_id);

      // Fetch chats with related data
      const { data: chatsData, error: chatsError } = await supabase
        .from('video_chats')
        .select(`
          *,
          reference_video:user_recordings(id, title, storage_path)
        `)
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Fetch participants for each chat
      const { data: allParticipants, error: participantsError } = await supabase
        .from('video_chat_participants')
        .select('chat_id, user_id, role')
        .in('chat_id', chatIds);

      if (participantsError) throw participantsError;

      // Fetch profiles for participants
      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch last message and unread count for each chat
      const chatsWithDetails = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: lastMsg } = await supabase
            .from('video_chat_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('video_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_user_id', user.id);

          const chatParticipants = allParticipants
            ?.filter(p => p.chat_id === chat.id)
            .map(p => ({
              ...p,
              profile: profiles?.find(pr => pr.id === p.user_id)
            }));

          return {
            ...chat,
            context_type: chat.context_type as 'user_video' | 'teacher_discussion' | 'admin_feedback',
            participants: chatParticipants,
            last_message: lastMsg as ChatMessage | undefined,
            unread_count: unreadCount || 0
          } as VideoChat;
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Fehler',
        description: 'Chats konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  }, [user, toast]);

  const fetchTeacherAssignment = useCallback(async () => {
    if (!user) return;

    try {
      // First try to get existing active assignment
      const { data: existingAssignment, error: existingError } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;

      if (existingAssignment) {
        // Get teacher profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', existingAssignment.teacher_id)
          .single();

        setTeacherAssignment({
          ...existingAssignment,
          teacher_profile: profile
        });
        return;
      }

      // No assignment exists - try to auto-assign an active teacher
      console.log('No teacher assignment found, attempting auto-assignment...');
      
      // Get all active teachers
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('is_teacher', true);

      if (teachersError) throw teachersError;

      if (teachers && teachers.length > 0) {
        // Pick the first available teacher
        const selectedTeacher = teachers[0];
        
        // Create the assignment
        const { data: newAssignment, error: assignError } = await supabase
          .from('teacher_assignments')
          .insert({
            user_id: user.id,
            teacher_id: selectedTeacher.id,
            is_active: true
          })
          .select()
          .single();

        if (assignError) {
          console.error('Error auto-assigning teacher:', assignError);
          return;
        }

        console.log('Auto-assigned teacher:', selectedTeacher.display_name);
        
        setTeacherAssignment({
          ...newAssignment,
          teacher_profile: {
            display_name: selectedTeacher.display_name,
            avatar_url: selectedTeacher.avatar_url
          }
        });
      }
    } catch (error) {
      console.error('Error fetching/creating teacher assignment:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchChats(), fetchTeacherAssignment()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchChats, fetchTeacherAssignment]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-messages')
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

  const createChat = async (
    contextType: 'user_video' | 'teacher_discussion' | 'admin_feedback',
    referenceVideoId: string | null,
    participantIds: { id: string; role: 'user' | 'teacher' | 'admin' }[]
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Create the chat
      const { data: chat, error: chatError } = await supabase
        .from('video_chats')
        .insert({
          context_type: contextType,
          reference_video_id: referenceVideoId,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const participants = participantIds.map(p => ({
        chat_id: chat.id,
        user_id: p.id,
        role: p.role
      }));

      const { error: participantsError } = await supabase
        .from('video_chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      await fetchChats();
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

  const sendMessage = async (
    chatId: string,
    messageType: 'text' | 'video' | 'marker',
    content: string | null,
    videoStoragePath: string | null = null,
    timestampSeconds: number | null = null,
    senderRole: 'user' | 'teacher' | 'admin' = 'user'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: chatId,
          sender_user_id: user.id,
          sender_role: senderRole,
          message_type: messageType,
          content,
          video_storage_path: videoStoragePath,
          timestamp_seconds: timestampSeconds
        });

      if (error) throw error;

      // Update chat updated_at
      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const markAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('video_chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_user_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendFeedbackToAdmin = async (
    videoId: string,
    message: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Get admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);

      if (!adminRoles || adminRoles.length === 0) {
        toast({
          title: 'Fehler',
          description: 'Kein Admin gefunden.',
          variant: 'destructive'
        });
        return null;
      }

      const adminId = adminRoles[0].user_id;

      // Create chat
      const chatId = await createChat('admin_feedback', videoId, [
        { id: user.id, role: 'user' },
        { id: adminId, role: 'admin' }
      ]);

      if (!chatId) return null;

      // Create feedback request
      const { error: feedbackError } = await supabase
        .from('admin_feedback_requests')
        .insert({
          user_id: user.id,
          user_video_id: videoId,
          message,
          chat_id: chatId
        });

      if (feedbackError) throw feedbackError;

      // Create video share
      await supabase.from('video_shares').insert({
        video_id: videoId,
        shared_with_user_id: adminId,
        shared_by_user_id: user.id,
        share_type: 'admin',
        chat_id: chatId
      });

      // Send initial message
      if (message) {
        await sendMessage(chatId, 'text', message, null, null, 'user');
      }

      toast({
        title: 'Feedback gesendet',
        description: 'Dein Video wurde an den Admin gesendet.'
      });

      return chatId;
    } catch (error) {
      console.error('Error sending feedback to admin:', error);
      toast({
        title: 'Fehler',
        description: 'Feedback konnte nicht gesendet werden.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const sendToTeacher = async (
    videoId: string,
    message: string
  ): Promise<string | null> => {
    if (!user || !teacherAssignment) {
      toast({
        title: 'Kein Lehrer zugewiesen',
        description: 'Dir ist noch kein Lehrer zugewiesen.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      // Create chat
      const chatId = await createChat('user_video', videoId, [
        { id: user.id, role: 'user' },
        { id: teacherAssignment.teacher_id, role: 'teacher' }
      ]);

      if (!chatId) return null;

      // Create video share
      await supabase.from('video_shares').insert({
        video_id: videoId,
        shared_with_user_id: teacherAssignment.teacher_id,
        shared_by_user_id: user.id,
        share_type: 'teacher',
        chat_id: chatId
      });

      // Send initial message
      if (message) {
        await sendMessage(chatId, 'text', message, null, null, 'user');
      }

      toast({
        title: 'Video gesendet',
        description: `Dein Video wurde an ${teacherAssignment.teacher_profile?.display_name || 'deinen Lehrer'} gesendet.`
      });

      return chatId;
    } catch (error) {
      console.error('Error sending to teacher:', error);
      toast({
        title: 'Fehler',
        description: 'Video konnte nicht gesendet werden.',
        variant: 'destructive'
      });
      return null;
    }
  };

  return {
    chats,
    loading,
    teacherAssignment,
    fetchChats,
    createChat,
    sendMessage,
    markAsRead,
    sendFeedbackToAdmin,
    sendToTeacher
  };
}

export function useChatMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!chatId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', senderIds);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        sender_profile: profiles?.find(p => p.id === msg.sender_user_id)
      }));

      setMessages(messagesWithProfiles as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates for this chat
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
