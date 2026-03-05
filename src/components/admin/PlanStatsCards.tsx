import { useState, useEffect, useRef } from 'react';
import { Users, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface PlanStat {
  plan_key: string;
  display_name: string;
  rank: number;
  user_count: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;
    const duration = 900;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString('de-DE')}</>;
}

const planConfig: Record<string, { icon: typeof Users; color: string; bg: string; label: string }> = {
  FREE:  { icon: Users,  color: 'text-[#6B7280]', bg: 'bg-[#F5F7FA]',   label: 'Free' },
  BASIC: { icon: Star,   color: 'text-amber-500', bg: 'bg-amber-50',    label: 'Basic' },
  PRO:   { icon: Crown,  color: 'text-violet-500', bg: 'bg-violet-50',  label: 'Pro' },
};

const allPlanKeys = ['FREE', 'BASIC', 'PRO'];

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
      // Normalize PREMIUM → PRO
      const normalized = (data.stats || []).map((s: PlanStat) => ({
        ...s,
        plan_key: s.plan_key === 'PREMIUM' ? 'PRO' : s.plan_key,
        display_name: s.plan_key === 'PREMIUM' ? 'Pro' : s.display_name,
      }));
      setStats(normalized);
      const total = normalized.reduce((sum: number, s: PlanStat) => sum + (s.user_count || 0), 0);
      setTotalUsers(total);
    } catch {
      try {
        const { data, error: queryError } = await supabase
          .from('admin_plan_stats')
          .select('*');

        if (!queryError && data) {
          const normalized = data.map((s) => ({
            ...s,
            plan_key: s.plan_key === 'PREMIUM' ? 'PRO' : s.plan_key,
            display_name: s.plan_key === 'PREMIUM' ? 'Pro' : s.display_name,
          }));
          setStats(normalized as PlanStat[]);
          const total = normalized.reduce((sum, s) => sum + ((s as PlanStat).user_count || 0), 0);
          setTotalUsers(total);
        }
      } catch (e) {
        console.error('Fallback query failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse">
            <div className="h-3 w-16 bg-[#E5E7EB] rounded mb-3" />
            <div className="h-7 w-12 bg-[#E5E7EB] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const filledStats = allPlanKeys.map(planKey => {
    const existing = stats.find(s => s.plan_key === planKey);
    return existing || { plan_key: planKey, display_name: planConfig[planKey]?.label ?? planKey, rank: 0, user_count: 0 };
  });

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {filledStats.map(stat => {
        const cfg = planConfig[stat.plan_key] ?? planConfig.FREE;
        const Icon = cfg.icon;
        const percentage = totalUsers > 0 ? Math.round((stat.user_count / totalUsers) * 100) : 0;

        return (
          <motion.div
            key={stat.plan_key}
            variants={item}
            whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.10)' }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[#111827]">{cfg.label}</span>
              <div className={`p-2 rounded-lg ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#111827] tabular-nums">
              <AnimatedNumber value={stat.user_count} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${stat.plan_key === 'PRO' ? 'bg-violet-500' : stat.plan_key === 'BASIC' ? 'bg-amber-400' : 'bg-[#9CA3AF]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' as const, delay: 0.3 }}
                />
              </div>
              <span className="text-xs text-[#9CA3AF] whitespace-nowrap">{percentage}%</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
