import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RankEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  star_count: number;
}

export function StarRanking() {
  const { user } = useAuth();
  const [publicRanking, setPublicRanking] = useState<RankEntry[]>([]);
  const [friendsRanking, setFriendsRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [pubRes, friendRes] = await Promise.all([
        supabase.rpc('get_public_star_ranking'),
        supabase.rpc('get_friends_star_ranking', { _user_id: user.id }),
      ]);
      setPublicRanking((pubRes.data as RankEntry[]) || []);
      setFriendsRanking((friendRes.data as RankEntry[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const RankList = ({ data }: { data: RankEntry[] }) => (
    <div className="space-y-1">
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Keine Daten</p>
      )}
      {data.map((entry, i) => (
        <div
          key={entry.user_id}
          className={`flex items-center gap-3 p-2 rounded-lg ${
            entry.user_id === user?.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'
          }`}
        >
          <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
          <Avatar className="w-7 h-7">
            <AvatarImage src={entry.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{getInitials(entry.display_name)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm font-medium truncate">{entry.display_name || 'Anonym'}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold">{entry.star_count}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Tabs defaultValue="public" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="public" className="flex-1">Öffentlich</TabsTrigger>
        <TabsTrigger value="friends" className="flex-1">Freunde</TabsTrigger>
      </TabsList>
      <TabsContent value="public">
        <RankList data={publicRanking} />
      </TabsContent>
      <TabsContent value="friends">
        <RankList data={friendsRanking} />
      </TabsContent>
    </Tabs>
  );
}
