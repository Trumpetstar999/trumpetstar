import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageViewStats {
  today: number;
  this_week: number;
  this_month: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
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

export function LandingPageViewsCard() {
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setIsLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from('landing_page_views').select('id', { count: 'exact', head: true }).gte('visited_at', todayStart),
        supabase.from('landing_page_views').select('id', { count: 'exact', head: true }).gte('visited_at', weekStart),
        supabase.from('landing_page_views').select('id', { count: 'exact', head: true }).gte('visited_at', monthStart),
      ]);

      setStats({
        today: todayRes.count ?? 0,
        this_week: weekRes.count ?? 0,
        this_month: monthRes.count ?? 0,
      });
    } catch (e) {
      console.error('LandingPageViewsCard fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const cards = [
    { label: 'HEUTE',        value: stats?.today ?? 0,      accent: 'bg-sky-50',    iconColor: 'text-sky-500' },
    { label: 'DIESE WOCHE',  value: stats?.this_week ?? 0,  accent: 'bg-blue-50',   iconColor: 'text-blue-500' },
    { label: 'DIESEN MONAT', value: stats?.this_month ?? 0, accent: 'bg-indigo-50', iconColor: 'text-indigo-500' },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-pulse">
            <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-3" />
            <div className="h-8 w-12 bg-[#E5E7EB] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
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
              {card.label === 'HEUTE'
                ? <Globe className={`w-5 h-5 ${card.iconColor}`} />
                : <TrendingUp className={`w-5 h-5 ${card.iconColor}`} />}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
