import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function FriendSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!query.trim() || !user) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('privacy_setting', 'public')
        .neq('id', user.id)
        .ilike('display_name', `%${query.trim()}%`)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (e: any) {
      toast.error('Suche fehlgeschlagen');
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: targetId,
        status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          toast.info('Anfrage bereits gesendet');
        } else {
          throw error;
        }
      } else {
        toast.success('Freundschaftsanfrage gesendet!');
      }
      setSentRequests(prev => new Set(prev).add(targetId));
    } catch (e: any) {
      toast.error('Fehler beim Senden der Anfrage');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Name suchen..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button size="icon" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results.length === 0 && query && !searching && (
        <p className="text-sm text-muted-foreground text-center py-4">Keine Ergebnisse</p>
      )}

      <div className="space-y-2">
        {results.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={r.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{getInitials(r.display_name)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium truncate">{r.display_name || 'Unbekannt'}</span>
            <Button
              size="sm"
              variant={sentRequests.has(r.id) ? 'ghost' : 'default'}
              disabled={sentRequests.has(r.id)}
              onClick={() => sendRequest(r.id)}
            >
              {sentRequests.has(r.id) ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
