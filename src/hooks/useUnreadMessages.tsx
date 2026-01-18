import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Get all chats the user participates in
        const { data: participations, error: partError } = await supabase
          .from('video_chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (partError || !participations?.length) {
          setUnreadCount(0);
          return;
        }

        const chatIds = participations.map(p => p.chat_id);

        // Count unread messages in those chats (not sent by the current user)
        const { count, error: countError } = await supabase
          .from('video_chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .eq('is_read', false)
          .neq('sender_user_id', user.id);

        if (!countError) {
          setUnreadCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_chat_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_chat_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}
