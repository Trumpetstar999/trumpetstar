import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  key: string;
  display_name: string;
  is_enabled: boolean;
  description: string | null;
  sort_order: number;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback((key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    return flag?.is_enabled ?? true; // Default to enabled if not found
  }, [flags]);

  const toggleFlag = useCallback(async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;

      setFlags(prev => prev.map(flag => 
        flag.id === id ? { ...flag, is_enabled: enabled } : flag
      ));

      return true;
    } catch (err) {
      console.error('Error toggling feature flag:', err);
      return false;
    }
  }, []);

  return { flags, loading, isEnabled, toggleFlag, refetch: fetchFlags };
}
