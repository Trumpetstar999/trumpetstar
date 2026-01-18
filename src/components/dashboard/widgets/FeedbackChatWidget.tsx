import { useMembership } from '@/hooks/useMembership';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, Lock, ArrowRight, Video, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { UpgradeDialog } from '@/components/premium/UpgradeDialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatSummary {
  id: string;
  lastMessageAt: string;
  unreadCount: number;
  hasVideo: boolean;
  lastMessagePreview: string | null;
}

export function FeedbackChatWidget() {
  const { canAccessFeature } = useMembership();
  const { navigateToTab } = useTabNavigation();
  const { user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatSummary, setChatSummary] = useState<ChatSummary | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  
  const hasPremium = canAccessFeature('PREMIUM');

  useEffect(() => {
    if (!user || !hasPremium) {
      setLoading(false);
      return;
    }

    async function fetchChatData() {
      try {
        // Get chats where user is a participant
        const { data: participations } = await supabase
          .from('video_chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (!participations || participations.length === 0) {
          setLoading(false);
          return;
        }

        const chatIds = participations.map(p => p.chat_id);

        // Get latest message from any chat
        const { data: messages } = await supabase
          .from('video_chat_messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })
          .limit(1);

        // Count unread messages (not sent by current user)
        const { count: unreadCount } = await supabase
          .from('video_chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .eq('is_read', false)
          .neq('sender_user_id', user.id);

        setTotalUnread(unreadCount || 0);

        if (messages && messages.length > 0) {
          const lastMsg = messages[0];
          setChatSummary({
            id: lastMsg.chat_id,
            lastMessageAt: lastMsg.created_at,
            unreadCount: unreadCount || 0,
            hasVideo: lastMsg.message_type === 'video',
            lastMessagePreview: lastMsg.content?.slice(0, 50) || null,
          });
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChatData();
  }, [user, hasPremium]);

  if (!hasPremium) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white/50" />
        </div>
        
        <h3 className="text-white font-semibold mb-2">Feedback & Chat</h3>
        <p className="text-white/70 text-sm mb-4">
          Persönliches Feedback ist Teil von Premium
        </p>
        
        <Button
          onClick={() => setUpgradeOpen(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          Premium freischalten
        </Button>

        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          requiredPlanKey="PREMIUM"
          title="Persönliches Feedback zu deinen Aufnahmen"
          description="Mit Premium kannst du deine Aufnahmen direkt an deinen Lehrer oder den Admin senden und gezieltes Feedback mit Zeitmarken und Antwort-Videos erhalten."
        />
      </div>
    );
  }

  // Premium user - show actual content
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Feedback & Chat</h3>
        </div>
        {totalUnread > 0 && (
          <span className="px-2 py-0.5 bg-[#25D366] text-white text-xs font-bold rounded-full">
            {totalUnread} neu
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4 bg-white/5 rounded-xl animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
        </div>
      ) : chatSummary ? (
        <div className="p-4 bg-white/10 rounded-xl mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {chatSummary.hasVideo ? (
                <Video className="w-4 h-4 text-blue-400" />
              ) : (
                <MessageSquare className="w-4 h-4 text-white/50" />
              )}
              <span className="text-white/70 text-sm">
                {chatSummary.hasVideo ? 'Video-Nachricht' : 'Textnachricht'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(chatSummary.lastMessageAt), { 
                addSuffix: true, 
                locale: de 
              })}
            </div>
          </div>
          
          {chatSummary.lastMessagePreview && (
            <p className="text-white/80 text-sm line-clamp-2">
              {chatSummary.lastMessagePreview}...
            </p>
          )}
          
          {chatSummary.unreadCount > 0 ? (
            <div className="flex items-center gap-2 text-[#25D366]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {chatSummary.unreadCount} ungelesene Nachricht{chatSummary.unreadCount > 1 ? 'en' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Alles gelesen</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-white/5 rounded-xl mb-4 text-center">
          <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-white/50 text-sm">
            Noch keine Chats vorhanden
          </p>
          <p className="text-white/30 text-xs mt-1">
            Starte einen Chat über deine Aufnahmen
          </p>
        </div>
      )}

      <Button
        onClick={() => navigateToTab('chats')}
        variant="ghost"
        className="w-full text-white hover:text-white hover:bg-white/20 bg-white/10 group"
      >
        {totalUnread > 0 ? 'Nachrichten ansehen' : 'Chat öffnen'}
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
