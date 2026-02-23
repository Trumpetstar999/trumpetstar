import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReviewSettings {
  google_review_url: string;
  google_review_qr_image: string | null;
  enable_review_prompt: boolean;
  min_days_since_signup: number;
  min_videos_completed: number;
  cooldown_days: number;
}

interface UserReviewTracking {
  last_review_prompt_at: string | null;
  review_prompt_optout: boolean;
  review_cta_clicked_at: string | null;
}

export function useReviewPrompt() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [tracking, setTracking] = useState<UserReviewTracking | null>(null);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;

    // Fetch settings and tracking in parallel
    const [settingsRes, trackingRes] = await Promise.all([
      supabase.from('review_settings').select('*').eq('id', 'default').single(),
      supabase.from('user_review_tracking').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const s = settingsRes.data;
    const t = trackingRes.data;

    setSettings(s ? {
      google_review_url: s.google_review_url,
      google_review_qr_image: s.google_review_qr_image,
      enable_review_prompt: s.enable_review_prompt,
      min_days_since_signup: s.min_days_since_signup,
      min_videos_completed: s.min_videos_completed,
      cooldown_days: s.cooldown_days,
    } : null);

    setTracking(t ? {
      last_review_prompt_at: t.last_review_prompt_at,
      review_prompt_optout: t.review_prompt_optout,
      review_cta_clicked_at: t.review_cta_clicked_at,
    } : null);

    // Determine if prompt should show
    if (s && s.enable_review_prompt && s.google_review_url) {
      // Check opt-out
      if (t?.review_prompt_optout) {
        setShouldShowPrompt(false);
      } else {
        // Check cooldown
        if (t?.last_review_prompt_at) {
          const lastPrompt = new Date(t.last_review_prompt_at);
          const cooldownEnd = new Date(lastPrompt.getTime() + s.cooldown_days * 24 * 60 * 60 * 1000);
          if (new Date() < cooldownEnd) {
            setShouldShowPrompt(false);
            setLoading(false);
            return;
          }
        }

        // Check min days since signup
        const createdAt = new Date(user.created_at || '');
        const daysSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup < s.min_days_since_signup) {
          setShouldShowPrompt(false);
          setLoading(false);
          return;
        }

        // Check min videos completed (using activity_logs as proxy)
        const { count } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('action', 'video_completed');

        setShouldShowPrompt((count || 0) >= s.min_videos_completed);
      }
    }

    setLoading(false);
  };

  const trackEvent = useCallback(async (event: 'review_prompt_shown' | 'review_cta_clicked' | 'review_prompt_dismissed') => {
    if (!user) return;

    // Log to activity_logs
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: event,
    });
  }, [user?.id]);

  const ensureTracking = useCallback(async () => {
    if (!user) return;
    if (!tracking) {
      await supabase.from('user_review_tracking').insert({ user_id: user.id });
    }
  }, [user?.id, tracking]);

  const markPromptShown = useCallback(async () => {
    if (!user) return;
    await ensureTracking();
    await supabase.from('user_review_tracking').upsert({
      user_id: user.id,
      last_review_prompt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await trackEvent('review_prompt_shown');
    setShouldShowPrompt(false);
  }, [user?.id, ensureTracking, trackEvent]);

  const markCtaClicked = useCallback(async () => {
    if (!user) return;
    await ensureTracking();
    await supabase.from('user_review_tracking').upsert({
      user_id: user.id,
      review_cta_clicked_at: new Date().toISOString(),
      last_review_prompt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await trackEvent('review_cta_clicked');
    setShouldShowPrompt(false);
  }, [user?.id, ensureTracking, trackEvent]);

  const markOptOut = useCallback(async () => {
    if (!user) return;
    await ensureTracking();
    await supabase.from('user_review_tracking').upsert({
      user_id: user.id,
      review_prompt_optout: true,
      last_review_prompt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await trackEvent('review_prompt_dismissed');
    setShouldShowPrompt(false);
  }, [user?.id, ensureTracking, trackEvent]);

  const dismissPrompt = useCallback(async () => {
    await markPromptShown();
  }, [markPromptShown]);

  return {
    settings,
    shouldShowPrompt,
    loading,
    markPromptShown,
    markCtaClicked,
    markOptOut,
    dismissPrompt,
  };
}
