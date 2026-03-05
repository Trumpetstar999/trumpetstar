import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, Star, UserPlus, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  total_users: number;
  active_today: number;
  active_this_week: number;
  total_stars: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 900;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString('de-DE')}</>;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setIsLoading(true);
    try {
      // Fetch base stats
      const { data: baseData } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      // Fetch new user counts
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      ]);

      setStats({
        total_users: baseData?.total_users ?? 0,
        active_today: baseData?.active_today ?? 0,
        active_this_week: baseData?.active_this_week ?? 0,
        total_stars: baseData?.total_stars ?? 0,
        new_today: todayRes.count ?? 0,
        new_this_week: weekRes.count ?? 0,
        new_this_month: monthRes.count ?? 0,
      });
    } catch {
      // Fallback
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [profilesRes, starsRes, todayRes, weekRes, monthRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('video_completions').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        ]);

        setStats({
          total_users: profilesRes.count ?? 0,
          active_today: 0,
          active_this_week: 0,
          total_stars: starsRes.count ?? 0,
          new_today: todayRes.count ?? 0,
          new_this_week: weekRes.count ?? 0,
          new_this_month: monthRes.count ?? 0,
        });
      } catch (e) {
        console.error('Fallback fetch failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const kpiCards = [
    { label: 'REGISTRIERTE NUTZER', value: stats?.total_users ?? 0, icon: Users, accent: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'AKTIV HEUTE',         value: stats?.active_today ?? 0, icon: UserCheck, accent: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'AKTIV DIESE WOCHE',   value: stats?.active_this_week ?? 0, icon: Calendar, accent: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'STERNE GESAMT',       value: stats?.total_stars ?? 0, icon: Star, accent: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  ];

  const newUserCards = [
    { label: 'NEU HEUTE',          value: stats?.new_today ?? 0, icon: UserPlus, accent: 'bg-violet-50', iconColor: 'text-violet-500' },
    { label: 'NEU DIESE WOCHE',    value: stats?.new_this_week ?? 0, icon: TrendingUp, accent: 'bg-teal-50', iconColor: 'text-teal-500' },
    { label: 'NEU DIESEN MONAT',   value: stats?.new_this_month ?? 0, icon: TrendingUp, accent: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-3" />
              <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-3" />
              <div className="h-8 w-12 bg-[#E5E7EB] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ card, delay = 0 }: { card: typeof kpiCards[0]; delay?: number }) => {
    const Icon = card.icon;
    return (
      <motion.div
        variants={item}
        whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.10)' }}
        className="bg-white border border-[#E5E7EB] rounded-xl p-5 transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] tracking-wider mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-[#111827] tabular-nums">
              <AnimatedNumber value={card.value} />
            </p>
          </div>
          <div className={`p-2 rounded-lg ${card.accent}`}>
            <Icon className={`w-5 h-5 ${card.iconColor}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-3">
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map(card => <StatCard key={card.label} card={card} />)}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {newUserCards.map(card => <StatCard key={card.label} card={card} />)}
      </motion.div>
    </div>
  );
}
