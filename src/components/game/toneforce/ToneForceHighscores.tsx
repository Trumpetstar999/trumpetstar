import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTfT } from '@/i18n/toneforce';

interface Row {
  id: string;
  player_name: string | null;
  display_name: string | null;
  score: number;
  level_reached: number;
  created_at: string;
}

export function ToneForceHighscores() {
  const t = useTfT();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['toneforce-highscores'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.rpc('get_toneforce_top_highscores', { p_limit: 200 });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: false,
  });

  const scores = data ?? [];

  return (
    <div className="max-w-md mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">{t('highscores.title')}</h2>
      {isLoading ? (
        <p className="text-white/60 text-sm">{t('highscores.loading')}</p>
      ) : isError ? (
        <p className="text-[#ff8a9a] text-sm">{t('highscores.loadError')}</p>
      ) : scores.length === 0 ? (
        <p className="text-white/60 text-sm">{t('highscores.empty')}</p>
      ) : (
        <ol className="space-y-2">
          {scores.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3 gap-3"
            >
              <span className="font-bold text-[#ffcc33] shrink-0 min-w-[2.5rem]">#{i + 1}</span>
              <span className="flex-1 truncate">
                {s.player_name || s.display_name || t('highscores.anonymous')}
              </span>
              <span className="text-xs text-white/50">{t('highscores.level')} {s.level_reached}</span>
              <span className="text-xs text-white/40 hidden sm:inline">
                {new Date(s.created_at).toLocaleDateString()}
              </span>
              <span className="font-bold text-lg">{s.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
