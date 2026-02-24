import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMembership } from './useMembership';

const DAILY_VIDEO_LIMIT = 3;
const DAILY_GAME_LIMIT = 3;
const DEBOUNCE_MS = 800;

function getDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function useDailyUsage() {
  const { user } = useAuth();
  const { planKey, isLoading: membershipLoading } = useMembership();
  const [videosUsed, setVideosUsed] = useState(0);
  const [gamesUsed, setGamesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastActionRef = useRef(0);

  const isFreeUser = planKey === 'FREE';
  const dateKey = getDateKey();

  // Fetch current usage
  useEffect(() => {
    if (!user || membershipLoading) return;
    if (!isFreeUser) {
      setIsLoading(false);
      setVideosUsed(0);
      setGamesUsed(0);
      return;
    }

    const fetchUsage = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('daily_usage')
          .select('videos_started, games_started')
          .eq('user_id', user.id)
          .eq('date_key', dateKey)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setVideosUsed(data?.videos_started ?? 0);
        setGamesUsed(data?.games_started ?? 0);
        setError(null);
      } catch (e) {
        console.error('Failed to fetch daily usage:', e);
        setError('Nutzungsdaten konnten nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [user?.id, dateKey, isFreeUser, membershipLoading]);

  const canStartVideo = useCallback((): boolean => {
    if (!isFreeUser) return true;
    if (error || isLoading) return false;
    return videosUsed < DAILY_VIDEO_LIMIT;
  }, [isFreeUser, videosUsed, error, isLoading]);

  const canStartGame = useCallback((): boolean => {
    if (!isFreeUser) return true;
    if (error || isLoading) return false;
    return gamesUsed < DAILY_GAME_LIMIT;
  }, [isFreeUser, gamesUsed, error, isLoading]);

  const recordVideoStart = useCallback(async (): Promise<boolean> => {
    if (!user || !isFreeUser) return true;
    const now = Date.now();
    if (now - lastActionRef.current < DEBOUNCE_MS) return false;
    lastActionRef.current = now;

    try {
      const { data, error: rpcError } = await supabase.rpc('increment_daily_usage', {
        p_user_id: user.id,
        p_date_key: dateKey,
        p_type: 'video',
      });

      if (rpcError) throw rpcError;
      const newValue = data as number;
      setVideosUsed(newValue);
      return newValue <= DAILY_VIDEO_LIMIT;
    } catch (e) {
      console.error('Failed to record video start:', e);
      setError('Bitte Seite neu laden.');
      return false;
    }
  }, [user?.id, dateKey, isFreeUser]);

  const recordGameStart = useCallback(async (): Promise<boolean> => {
    if (!user || !isFreeUser) return true;
    const now = Date.now();
    if (now - lastActionRef.current < DEBOUNCE_MS) return false;
    lastActionRef.current = now;

    try {
      const { data, error: rpcError } = await supabase.rpc('increment_daily_usage', {
        p_user_id: user.id,
        p_date_key: dateKey,
        p_type: 'game',
      });

      if (rpcError) throw rpcError;
      const newValue = data as number;
      setGamesUsed(newValue);
      return newValue <= DAILY_GAME_LIMIT;
    } catch (e) {
      console.error('Failed to record game start:', e);
      setError('Bitte Seite neu laden.');
      return false;
    }
  }, [user?.id, dateKey, isFreeUser]);

  return {
    videosUsed,
    gamesUsed,
    videoLimit: DAILY_VIDEO_LIMIT,
    gameLimit: DAILY_GAME_LIMIT,
    isFreeUser,
    isLoading: isLoading || membershipLoading,
    error,
    canStartVideo,
    canStartGame,
    recordVideoStart,
    recordGameStart,
  };
}
