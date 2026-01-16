import { useState, useEffect } from 'react';
import { Users, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface PlanStat {
  plan_key: string;
  display_name: string;
  rank: number;
  user_count: number;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Users className="w-5 h-5 text-gray-500" />,
  BASIC: <Star className="w-5 h-5 text-blue-500" />,
  PREMIUM: <Crown className="w-5 h-5 text-amber-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-gray-200 dark:border-gray-700',
  BASIC: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700',
  PREMIUM: 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700',
};

export function PlanStatsCards() {
  const [stats, setStats] = useState<PlanStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  async function fetchStats() {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=get-plan-stats`,
        {
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.stats || []);
      
      const total = (data.stats || []).reduce((sum: number, s: PlanStat) => sum + (s.user_count || 0), 0);
      setTotalUsers(total);
    } catch (error) {
      console.error('Error fetching plan stats:', error);
      // Fallback to direct query
      try {
        const { data, error: queryError } = await supabase
          .from('admin_plan_stats')
          .select('*');
        
        if (!queryError && data) {
          setStats(data as PlanStat[]);
          const total = data.reduce((sum, s) => sum + (s.user_count || 0), 0);
          setTotalUsers(total);
        }
      } catch (e) {
        console.error('Fallback query failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Ensure we have all three plans, even if no users
  const allPlans = ['FREE', 'BASIC', 'PREMIUM'];
  const filledStats = allPlans.map(planKey => {
    const existing = stats.find(s => s.plan_key === planKey);
    return existing || {
      plan_key: planKey,
      display_name: planKey.charAt(0) + planKey.slice(1).toLowerCase(),
      rank: planKey === 'FREE' ? 0 : planKey === 'BASIC' ? 10 : 20,
      user_count: 0,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {filledStats.map(stat => {
        const percentage = totalUsers > 0 
          ? Math.round((stat.user_count / totalUsers) * 100) 
          : 0;
        
        return (
          <Card 
            key={stat.plan_key}
            className={`bg-gradient-to-br ${PLAN_COLORS[stat.plan_key] || PLAN_COLORS.FREE} border`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.display_name}
              </CardTitle>
              {PLAN_ICONS[stat.plan_key]}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.user_count}</div>
              <p className="text-xs text-muted-foreground">
                {percentage}% aller Nutzer
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
