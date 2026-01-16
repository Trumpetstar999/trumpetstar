import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, Star } from 'lucide-react';

interface Stats {
  total_users: number;
  active_today: number;
  active_this_week: number;
  total_stars: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      try {
        const [profilesRes, starsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('video_completions').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          total_users: profilesRes.count || 0,
          active_today: 0,
          active_this_week: 0,
          total_stars: starsRes.count || 0,
        });
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const kpiCards = [
    {
      label: 'REGISTRIERTE NUTZER',
      value: stats?.total_users || 0,
      icon: Users,
    },
    {
      label: 'AKTIV HEUTE',
      value: stats?.active_today || 0,
      icon: UserCheck,
    },
    {
      label: 'AKTIV DIESE WOCHE',
      value: stats?.active_this_week || 0,
      icon: Calendar,
    },
    {
      label: 'STERNE GESAMT',
      value: stats?.total_stars || 0,
      icon: Star,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-5 animate-pulse">
            <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-3" />
            <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280] tracking-wide mb-2">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-[#111827]">
                  {card.value.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="p-2 bg-[#F5F7FA] rounded-lg">
                <Icon className="w-5 h-5 text-[#6B7280]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
