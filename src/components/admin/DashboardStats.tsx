import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      // Fetch stats from the view
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback: fetch individually
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
      label: 'Registrierte Nutzer',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-[#005BBB]',
      bgColor: 'bg-[#005BBB]/10',
    },
    {
      label: 'Aktiv heute',
      value: stats?.active_today || 0,
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Aktiv diese Woche',
      value: stats?.active_this_week || 0,
      icon: Calendar,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
    },
    {
      label: 'Sterne insgesamt ⭐',
      value: stats?.total_stars || 0,
      icon: Star,
      color: 'text-[#FFCC00]',
      bgColor: 'bg-[#FFCC00]/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {card.value.toLocaleString('de-DE')}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
