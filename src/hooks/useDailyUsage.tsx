import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMembership } from './useMembership';
import { useLanguage } from './useLanguage';
import { accessCopy } from '@/i18n/access';

const DAILY_VIDEO_LIMIT = 3;
const DAILY_GAME_LIMIT = 3;

function getDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function useDailyUsage() {
  const { user } = useAuth();
  const { planKey, isLoading: membershipLoading } = useMembership();
  const { language } = useLanguage();
  const [videosUsed, setVideosUsed] = useState(0);
  const [gamesUsed, setGamesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef({ video: false, game: false });

  const isFreeUser = planKey === 'FREE';
  const [dateKey, setDateKey] = useState(getDateKey);
  useEffect(() => {
    const timer = window.setInterval(() => setDateKey(getDateKey()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Fetch current usage
  useEffect(() => {
    if (!user) { setVideosUsed(0); setGamesUsed(0); setError(null); setIsLoading(false); return; }
    if (membershipLoading) return;
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
        setError(accessCopy[language].error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, [user?.id, dateKey, isFreeUser, membershipLoading]);

  const canStartVideo = useCallback((): boolean => {
    if (!user || membershipLoading) return false;
    if (!isFreeUser) return true;
    if (error || isLoading) return false;
    return videosUsed < DAILY_VIDEO_LIMIT;
  }, [user?.id, membershipLoading, isFreeUser, videosUsed, error, isLoading]);

  const canStartGame = useCallback((): boolean => {
    if (!user || membershipLoading) return false;
    if (!isFreeUser) return true;
    if (error || isLoading) return false;
    return gamesUsed < DAILY_GAME_LIMIT;
  }, [user?.id, membershipLoading, isFreeUser, gamesUsed, error, isLoading]);

  const recordVideoStart = useCallback(async (): Promise<boolean> => {
    if (!user || membershipLoading) return false;
    if (!isFreeUser) return true;
    if (pendingRef.current.video) return false;
    pendingRef.current.video = true;

    try {
      const { data, error: rpcError } = await supabase.rpc('increment_daily_usage', {
        p_user_id: user.id,
        p_date_key: dateKey,
        p_type: 'video',
      });

      if (rpcError) throw rpcError;
      const newValue = data as number;
      setVideosUsed(Math.min(newValue, DAILY_VIDEO_LIMIT));
      return Number.isInteger(newValue) && newValue >= 0 && newValue <= DAILY_VIDEO_LIMIT;
    } catch (e) {
      console.error('Failed to record video start:', e);
      setError(accessCopy[language].error);
      return false;
    } finally {
      pendingRef.current.video = false;
    }
  }, [user?.id, dateKey, isFreeUser, membershipLoading, language]);

  const recordGameStart = useCallback(async (): Promise<boolean> => {
    if (!user || membershipLoading) return false;
    if (!isFreeUser) return true;
    if (pendingRef.current.game) return false;
    pendingRef.current.game = true;

    try {
      const { data, error: rpcError } = await supabase.rpc('increment_daily_usage', {
        p_user_id: user.id,
        p_date_key: dateKey,
        p_type: 'game',
      });

      if (rpcError) throw rpcError;
      const newValue = data as number;
      setGamesUsed(Math.min(newValue, DAILY_GAME_LIMIT));
      return Number.isInteger(newValue) && newValue >= 0 && newValue <= DAILY_GAME_LIMIT;
    } catch (e) {
      console.error('Failed to record game start:', e);
      setError(accessCopy[language].error);
      return false;
    } finally {
      pendingRef.current.game = false;
    }
  }, [user?.id, dateKey, isFreeUser, membershipLoading, language]);

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
