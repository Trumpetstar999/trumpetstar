import { useState, useEffect, useRef } from 'react';
import { Star, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import {
  format, subDays, startOfDay, endOfDay,
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths, isSameMonth, isToday,
} from 'date-fns';
import { de, enUS, es, sl } from 'date-fns/locale';
import type { Locale } from 'date-fns';

type ViewMode = 'week' | 'month';

interface DayStars {
  date: Date;
  dayLabel: string;
  stars: number;
  isToday: boolean;
}

const WEEKDAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeeklyStarsWidget() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekData, setWeekData] = useState<DayStars[]>([]);
  const [monthStars, setMonthStars] = useState<Record<string, number>>({});
  const [totalWeekStars, setTotalWeekStars] = useState(0);
  const [totalMonthStars, setTotalMonthStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  const localeMap: Record<string, Locale> = { de, en: enUS, es, sl };
  const dateLocale = localeMap[language] ?? de;

  // Fetch week data
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function fetchWeeklyStars() {
      try {
        const today = new Date();
        const days: DayStars[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(today, i);
          days.push({ date, dayLabel: format(date, 'EEE', { locale: dateLocale }), stars: 0, isToday: i === 0 });
        }
        const weekStart = startOfDay(subDays(today, 6));
        const weekEnd = endOfDay(today);
        const { data: completions } = await supabase
          .from('video_completions').select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString());

        completions?.forEach(c => {
          const idx = days.findIndex(d => format(d.date, 'yyyy-MM-dd') === format(new Date(c.completed_at), 'yyyy-MM-dd'));
          if (idx !== -1) days[idx].stars++;
        });

        setWeekData(days);
        setTotalWeekStars(days.reduce((s, d) => s + d.stars, 0));
        setTimeout(() => setAnimationPhase(1), 100);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchWeeklyStars();
  }, [user]);

  // Fetch month data
  useEffect(() => {
    if (!user) return;
    async function fetchMonthStars() {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const { data: completions } = await supabase
        .from('video_completions').select('completed_at')
        .eq('user_id', user!.id)
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString());

      const map: Record<string, number> = {};
      completions?.forEach(c => {
        const key = format(new Date(c.completed_at), 'yyyy-MM-dd');
        map[key] = (map[key] || 0) + 1;
      });
      setMonthStars(map);
      setTotalMonthStars(Object.values(map).reduce((s, v) => s + v, 0));
    }
    fetchMonthStars();
  }, [user, currentMonth]);

  const maxStars = Math.max(...weekData.map(d => d.stars), 1);

  // Build month grid (Mon-first)
  const monthDays = (() => {
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    // 0=Sun → convert to Mon-first: Mon=0..Sun=6
    const firstDow = (getDay(days[0]) + 6) % 7;
    const grid: (Date | null)[] = Array(firstDow).fill(null);
    days.forEach(d => grid.push(d));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  })();

  const handlePrevMonth = () => { setSlideDir(-1); setCurrentMonth(m => subMonths(m, 1)); };
  const handleNextMonth = () => { setSlideDir(1); setCurrentMonth(m => addMonths(m, 1)); };
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-reward-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
    <div className="flex flex-col h-full space-y-3">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 shrink-0">
        {(['week', 'month'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewMode === mode ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            {mode === 'week' ? t('widgets.thisWeek') : 'Monat'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
      <AnimatePresence mode="wait">
        {viewMode === 'week' ? (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col h-full gap-3"
          >
            {/* Week header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/60">{t('widgets.thisWeek')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-reward-gold fill-reward-gold" />
                <span className="text-xl font-bold text-white">{totalWeekStars}</span>
                {totalWeekStars > 0 && <TrendingUp className="w-4 h-4 text-green-400 ml-1" />}
              </div>
            </div>

            {/* Bar chart — flex-1 fills remaining height */}
            <div className="flex-1 min-h-0 flex items-end justify-between gap-2">
              {weekData.map((day, index) => {
                const heightPercent = day.stars > 0 ? (day.stars / maxStars) * 100 : 0;
                const actualHeight = Math.max(heightPercent, day.stars > 0 ? 20 : 6);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                    <div className="relative w-full flex-1 flex items-end justify-center">
                      <div
                        className={`w-full max-w-10 rounded-t-lg transition-all duration-700 ease-out ${
                          day.isToday
                            ? 'bg-gradient-to-t from-reward-gold to-amber-400 shadow-lg shadow-reward-gold/30'
                            : day.stars > 0
                              ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                              : 'bg-white/10'
                        }`}
                        style={{ height: animationPhase === 1 ? `${actualHeight}%` : '4px', transitionDelay: `${index * 80}ms` }}
                      />
                      {day.stars > 0 && (
                        <div
                          className={`absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 transition-all duration-300 ${
                            animationPhase === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                          }`}
                          style={{ transitionDelay: `${index * 80 + 400}ms` }}
                        >
                          <Star className="w-3 h-3 text-reward-gold fill-reward-gold" />
                          <span className="text-xs font-bold text-white">{day.stars}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium shrink-0 ${day.isToday ? 'text-reward-gold' : 'text-white/60'}`}>
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0">
            {totalWeekStars === 0 && (
              <p className="text-center text-white/50 text-xs py-1">{t('widgets.watchVideosForStars')}</p>
            )}
            {totalWeekStars > 0 && totalWeekStars < 7 && (
              <p className="text-center text-white/60 text-xs">{t('widgets.keepGoing')}</p>
            )}
            {totalWeekStars >= 7 && (
              <p className="text-center text-reward-gold text-xs font-medium">{t('widgets.fantasticWeek')}</p>
            )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="month"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Month header with navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/70" />
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={format(currentMonth, 'yyyy-MM')}
                  initial={{ opacity: 0, y: slideDir * 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -slideDir * 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-semibold text-white">
                    {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-reward-gold fill-reward-gold" />
                    <span className="text-sm font-bold text-white">{totalMonthStars}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              <button
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS_DE.map(l => (
                <div key={l} className="text-center text-[10px] text-white/40 font-medium py-0.5">{l}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={format(currentMonth, 'yyyy-MM') + '-grid'}
                initial={{ opacity: 0, x: slideDir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -slideDir * 30 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-7 gap-1"
              >
                {monthDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const key = format(day, 'yyyy-MM-dd');
                  const stars = monthStars[key] || 0;
                  const today = isToday(day);
                  const hasStars = stars > 0;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.012, duration: 0.2 }}
                      className={`
                        relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5
                        ${hasStars
                          ? 'bg-reward-gold/25 ring-1 ring-reward-gold/50'
                          : today
                            ? 'bg-white/15 ring-1 ring-white/30'
                            : 'bg-white/5'
                        }
                      `}
                    >
                      <span className={`text-[11px] font-semibold leading-none ${
                        hasStars ? 'text-reward-gold' : today ? 'text-white' : 'text-white/60'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {hasStars && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-reward-gold fill-reward-gold" />
                          {stars > 1 && (
                            <span className="text-[9px] font-bold text-reward-gold leading-none">{stars}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {totalMonthStars === 0 && (
              <p className="text-center text-white/50 text-xs py-1">{t('widgets.watchVideosForStars')}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
