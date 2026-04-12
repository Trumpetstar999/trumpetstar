import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  friend_profile?: { display_name: string | null; avatar_url: string | null };
}

export function FriendsList() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingIn, setPendingIn] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (f) => {
          const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', friendId)
            .maybeSingle();
          return { ...f, friend_profile: profile || undefined };
        })
      );

      setFriends(enriched.filter(f => f.status === 'accepted'));
      setPendingIn(enriched.filter(f => f.status === 'pending' && f.addressee_id === user.id));
    } catch {
      toast.error('Fehler beim Laden der Freunde');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriendships(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('friendships').update({ status }).eq('id', id);
    if (error) { toast.error('Fehler'); return; }
    toast.success(status === 'accepted' ? 'Freundschaft angenommen!' : 'Abgelehnt');
    fetchFriendships();
  };

  const removeFriend = async (id: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) { toast.error('Fehler'); return; }
    toast.success('Freund entfernt');
    fetchFriendships();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {pendingIn.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Offene Anfragen</h4>
          {pendingIn.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Avatar className="w-8 h-8">
                <AvatarImage src={f.friend_profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getInitials(f.friend_profile?.display_name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium truncate">{f.friend_profile?.display_name || 'Unbekannt'}</span>
              <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateStatus(f.id, 'accepted')}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateStatus(f.id, 'rejected')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Freunde ({friends.length})</h4>
        {friends.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Noch keine Freunde</p>
        )}
        {friends.map(f => (
          <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={f.friend_profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{getInitials(f.friend_profile?.display_name)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium truncate">{f.friend_profile?.display_name || 'Unbekannt'}</span>
            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => removeFriend(f.id)}>
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
