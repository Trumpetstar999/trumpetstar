import { useState, useEffect } from 'react';
import { Trophy, Flame, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface BestScore {
  score: number;
  best_streak: number;
  accuracy: number;
  level_reached: number;
  scale_key: string;
  scale_type: string;
  created_at: string;
}

export function GameHighscoreWidget() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [best, setBest] = useState<BestScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('game_highscores')
        .select('score, best_streak, accuracy, level_reached, scale_key, scale_type, created_at')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(1);

      setBest((data && data.length > 0) ? data[0] as BestScore : null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!best) {
    return (
      <div className="text-center py-6">
        <Trophy className="w-10 h-10 mx-auto mb-2 text-white/20" />
        <p className="text-white/50 text-sm">{t('game.noHighscoresYet')}</p>
        <p className="text-white/30 text-xs mt-1">{t('game.playToScore')}</p>
      </div>
    );
  }

  const stats = [
    { icon: Trophy, label: t('game.bestScore'), value: `${best.score}`, color: 'text-[hsl(var(--reward-gold))]', bg: 'bg-[hsl(var(--reward-gold))]/20' },
    { icon: Flame, label: t('game.bestStreak'), value: `${best.best_streak}`, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { icon: Target, label: t('game.accuracy'), value: `${best.accuracy}%`, color: 'text-green-400', bg: 'bg-green-500/20' },
    { icon: Zap, label: t('game.level'), value: `${best.level_reached}`, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[hsl(var(--reward-gold))]" />
        <h3 className="text-white font-semibold">NoteRunner</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2 p-2.5 bg-white/10 rounded-xl">
            <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-white/50 text-[10px] leading-tight truncate">{s.label}</p>
              <p className="text-white font-bold text-sm">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-white/30 text-[10px] mt-3 text-center">
        {best.scale_key} {best.scale_type} · {new Date(best.created_at).toLocaleDateString('de-DE')}
      </p>
    </div>
  );
}
