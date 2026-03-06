import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeTable<T extends { id: string }>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: rows, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setData((rows || []) as unknown as T[]);
        setError(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`${tableName}_realtime_${Date.now()}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: tableName },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
