import { useState, useEffect } from 'react';
import { Users, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlanStat {
  plan_key: string;
  display_name: string;
  rank: number;
  user_count: number;
}

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
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-5 animate-pulse">
            <div className="h-3 w-16 bg-[#E5E7EB] rounded mb-3" />
            <div className="h-7 w-12 bg-[#E5E7EB] rounded" />
          </div>
        ))}
      </div>
    );
  }

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

  const getIcon = (planKey: string) => {
    switch (planKey) {
      case 'FREE': return Users;
      case 'BASIC': return Star;
      case 'PREMIUM': return Crown;
      default: return Users;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {filledStats.map(stat => {
        const percentage = totalUsers > 0 
          ? Math.round((stat.user_count / totalUsers) * 100) 
          : 0;
        const Icon = getIcon(stat.plan_key);
        
        return (
          <div 
            key={stat.plan_key}
            className="bg-white border border-[#E5E7EB] rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#111827]">
                {stat.display_name}
              </span>
              <Icon className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stat.user_count}</div>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {percentage}% aller Nutzer
            </p>
          </div>
        );
      })}
    </div>
  );
}
