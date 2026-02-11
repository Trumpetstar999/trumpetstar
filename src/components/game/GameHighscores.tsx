import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Calendar, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterPeriod = 'today' | 'week' | 'all';

interface HighscoreEntry {
  id: string;
  score: number;
  best_streak: number;
  level_reached: number;
  accuracy: number;
  scale_key: string;
  scale_type: string;
  created_at: string;
}

export function GameHighscores() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [scores, setScores] = useState<HighscoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchScores = async () => {
      setLoading(true);
      let query = supabase
        .from('game_highscores')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(20);

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (filter === 'week') {
        const week = new Date();
        week.setDate(week.getDate() - 7);
        query = query.gte('created_at', week.toISOString());
      }

      const { data } = await query;
      setScores((data as HighscoreEntry[]) || []);
      setLoading(false);
    };

    fetchScores();
  }, [user, filter]);

  const filterButtons: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Heute' },
    { key: 'week', label: 'Woche' },
    { key: 'all', label: 'Alle' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[hsl(var(--reward-gold))]" />
        <h2 className="text-lg font-bold text-white">Highscores</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filterButtons.map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}
            className="flex-1 text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Scores list */}
      {loading ? (
        <div className="text-center text-white/50 py-8">Laden...</div>
      ) : scores.length === 0 ? (
        <div className="text-center text-white/50 py-8">
          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Noch keine Highscores</p>
          <p className="text-xs mt-1">Spiele eine Runde, um deinen ersten Score zu erzielen!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div key={s.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                i === 0 ? 'bg-[hsl(var(--reward-gold))]/20 text-[hsl(var(--reward-gold))]' :
                i === 1 ? 'bg-white/10 text-white/70' :
                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-white/5 text-white/40'
              )}>
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">{s.score} pts</div>
                <div className="text-white/40 text-[10px] flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{s.best_streak}</span>
                  <span>Lv.{s.level_reached}</span>
                  <span>{s.accuracy}%</span>
                  <span>{s.scale_key} {s.scale_type}</span>
                </div>
              </div>
              <div className="text-white/30 text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(s.created_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
