import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TeacherChatMessage {
  id: string;
  chat_id: string;
  sender_user_id: string;
  sender_role: 'user' | 'teacher';
  content: string | null;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  video_storage_path?: string | null;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeacherChatInfo {
  chatId: string | null;
  teacherId: string | null;
  teacherProfile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  studentId?: string | null;
  studentProfile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface StudentChatInfo {
  chatId: string;
  studentId: string;
  studentProfile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

export function useTeacherChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatInfo, setChatInfo] = useState<TeacherChatInfo>({
    chatId: null,
    teacherId: null,
    teacherProfile: null,
  });
  const [messages, setMessages] = useState<TeacherChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // For students: Find or create chat with assigned teacher
  const initializeStudentChat = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Get teacher assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('teacher_assignments')
        .select('teacher_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }

      if (!assignment) {
        setChatInfo({ chatId: null, teacherId: null, teacherProfile: null });
        return;
      }

      // 2. Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', assignment.teacher_id)
        .single();

      // 3. Find existing chat or create one
      // Look for a chat where this student and teacher are participants with context_type = 'teacher_chat'
      const { data: existingChats } = await supabase
        .from('video_chats')
        .select(`
          id,
          video_chat_participants!inner(user_id, role)
        `)
        .eq('context_type', 'teacher_chat');

      let chatId: string | null = null;

      // Find a chat that has both this user and the teacher
      if (existingChats) {
        for (const chat of existingChats) {
          const participants = chat.video_chat_participants as { user_id: string; role: string }[];
          const hasStudent = participants.some(p => p.user_id === user.id);
          const hasTeacher = participants.some(p => p.user_id === assignment.teacher_id);
          if (hasStudent && hasTeacher) {
            chatId = chat.id;
            break;
          }
        }
      }

      // Create chat if not exists
      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('video_chats')
          .insert({
            context_type: 'teacher_chat',
            created_by: user.id
          })
          .select()
          .single();

        if (chatError) throw chatError;

        chatId = newChat.id;

        // Add participants
        await supabase.from('video_chat_participants').insert([
          { chat_id: chatId, user_id: user.id, role: 'user' },
          { chat_id: chatId, user_id: assignment.teacher_id, role: 'teacher' }
        ]);
      }

      setChatInfo({
        chatId,
        teacherId: assignment.teacher_id,
        teacherProfile
      });

    } catch (error) {
      console.error('Error initializing student chat:', error);
    }
  }, [user]);

  // Fetch messages for current chat
  const fetchMessages = useCallback(async () => {
    if (!chatInfo.chatId || !user) return;

    try {
      const { data, error } = await supabase
        .from('video_chat_messages')
        .select('*')
        .eq('chat_id', chatInfo.chatId)
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
        sender_role: msg.sender_role as 'user' | 'teacher',
        sender_profile: profiles?.find(p => p.id === msg.sender_user_id)
      }));

      setMessages(messagesWithProfiles);

      // Mark messages as read
      await supabase
        .from('video_chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatInfo.chatId)
        .neq('sender_user_id', user.id);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatInfo.chatId, user]);

  // Send a message
  const sendMessage = async (content: string, senderRole: 'user' | 'teacher' = 'user') => {
    if (!chatInfo.chatId || !user || !content.trim()) return false;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('video_chat_messages')
        .insert({
          chat_id: chatInfo.chatId,
          sender_user_id: user.id,
          sender_role: senderRole,
          message_type: 'text',
          content: content.trim()
        });

      if (error) throw error;

      // Update chat timestamp
      await supabase
        .from('video_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatInfo.chatId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSendingMessage(false);
    }
  };

  // Initialize chat on mount
  useEffect(() => {
    if (user) {
      setLoading(true);
      initializeStudentChat().finally(() => setLoading(false));
    }
  }, [user, initializeStudentChat]);

  // Fetch messages when chat is ready
  useEffect(() => {
    if (chatInfo.chatId) {
      fetchMessages();
    }
  }, [chatInfo.chatId, fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!chatInfo.chatId) return;

    const channel = supabase
      .channel(`teacher-chat-${chatInfo.chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
          filter: `chat_id=eq.${chatInfo.chatId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatInfo.chatId, fetchMessages]);

  return {
    chatInfo,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    fetchMessages,
    setChatInfo
  };
}

// Hook for teachers to see all their students' chats
export function useTeacherStudentChats() {
  const { user } = useAuth();
  const [studentChats, setStudentChats] = useState<StudentChatInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentChats = useCallback(async () => {
    if (!user) return;

    try {
      // Get all students assigned to this teacher
      const { data: assignments, error: assignError } = await supabase
        .from('teacher_assignments')
        .select('user_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setStudentChats([]);
        return;
      }

      const studentIds = assignments.map(a => a.user_id);

      // Get student profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', studentIds);

      // Find chats for each student
      const { data: allChats } = await supabase
        .from('video_chats')
        .select(`
          id,
          updated_at,
          video_chat_participants!inner(user_id, role)
        `)
        .eq('context_type', 'teacher_chat');

      const chats: StudentChatInfo[] = [];

      for (const studentId of studentIds) {
        // Find chat with this student
        let chatId: string | null = null;
        
        if (allChats) {
          for (const chat of allChats) {
            const participants = chat.video_chat_participants as { user_id: string; role: string }[];
            const hasStudent = participants.some(p => p.user_id === studentId);
            const hasTeacher = participants.some(p => p.user_id === user.id);
            if (hasStudent && hasTeacher) {
              chatId = chat.id;
              break;
            }
          }
        }

        // If no chat exists yet, create one
        if (!chatId) {
          const { data: newChat } = await supabase
            .from('video_chats')
            .insert({
              context_type: 'teacher_chat',
              created_by: user.id
            })
            .select()
            .single();

          if (newChat) {
            chatId = newChat.id;
            await supabase.from('video_chat_participants').insert([
              { chat_id: chatId, user_id: studentId, role: 'user' },
              { chat_id: chatId, user_id: user.id, role: 'teacher' }
            ]);
          }
        }

        if (chatId) {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('video_chat_messages')
            .select('content, created_at')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('video_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId)
            .eq('is_read', false)
            .neq('sender_user_id', user.id);

          const profile = profiles?.find(p => p.id === studentId);

          chats.push({
            chatId,
            studentId,
            studentProfile: profile || null,
            lastMessage: lastMsg?.content || null,
            lastMessageTime: lastMsg?.created_at || null,
            unreadCount: unreadCount || 0
          });
        }
      }

      // Sort by last message time
      chats.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setStudentChats(chats);
    } catch (error) {
      console.error('Error fetching student chats:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchStudentChats().finally(() => setLoading(false));
    }
  }, [user, fetchStudentChats]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('teacher-all-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages'
        },
        () => {
          fetchStudentChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStudentChats]);

  return {
    studentChats,
    loading,
    fetchStudentChats
  };
}
