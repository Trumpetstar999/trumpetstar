import { useState, useEffect } from 'react';
import { Star, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface DayStars {
  date: Date;
  dayLabel: string;
  stars: number;
  isToday: boolean;
}

export function WeeklyStarsWidget() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayStars[]>([]);
  const [totalWeekStars, setTotalWeekStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchWeeklyStars() {
      try {
        const today = new Date();
        const days: DayStars[] = [];

        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = subDays(today, i);
          days.push({
            date,
            dayLabel: format(date, 'EEE', { locale: de }),
            stars: 0,
            isToday: i === 0,
          });
        }

        // Fetch completions for the week
        const weekStart = startOfDay(subDays(today, 6));
        const weekEnd = endOfDay(today);

        const { data: completions, error } = await supabase
          .from('video_completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString());

        if (error) throw error;

        // Count stars per day
        completions?.forEach(completion => {
          const completionDate = new Date(completion.completed_at);
          const dayIndex = days.findIndex(d => 
            format(d.date, 'yyyy-MM-dd') === format(completionDate, 'yyyy-MM-dd')
          );
          if (dayIndex !== -1) {
            days[dayIndex].stars++;
          }
        });

        setWeekData(days);
        setTotalWeekStars(days.reduce((sum, d) => sum + d.stars, 0));
        
        // Trigger animation after data loads
        setTimeout(() => setAnimationPhase(1), 100);
      } catch (err) {
        console.error('Error fetching weekly stars:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklyStars();
  }, [user]);

  const maxStars = Math.max(...weekData.map(d => d.stars), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-reward-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/60">Diese Woche</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-reward-gold fill-reward-gold" />
          <span className="text-xl font-bold text-white">{totalWeekStars}</span>
          {totalWeekStars > 0 && (
            <TrendingUp className="w-4 h-4 text-green-400 ml-1" />
          )}
        </div>
      </div>

      {/* Animated Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((day, index) => {
          const heightPercent = day.stars > 0 ? (day.stars / maxStars) * 100 : 0;
          const minHeight = day.stars > 0 ? 20 : 8;
          const actualHeight = Math.max(heightPercent, minHeight);
          
          return (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center gap-2"
            >
              {/* Bar container */}
              <div className="relative w-full h-24 flex items-end justify-center">
                {/* Bar */}
                <div
                  className={`
                    w-full max-w-8 rounded-t-lg transition-all duration-700 ease-out
                    ${day.isToday 
                      ? 'bg-gradient-to-t from-reward-gold to-amber-400 shadow-lg shadow-reward-gold/30' 
                      : day.stars > 0 
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                        : 'bg-white/10'
                    }
                  `}
                  style={{
                    height: animationPhase === 1 
                      ? `${actualHeight}%` 
                      : '4px',
                    transitionDelay: `${index * 80}ms`,
                  }}
                />
                
                {/* Star count on top of bar */}
                {day.stars > 0 && (
                  <div 
                    className={`
                      absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5
                      transition-all duration-300 
                      ${animationPhase === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}
                    style={{ transitionDelay: `${index * 80 + 400}ms` }}
                  >
                    <Star className="w-3 h-3 text-reward-gold fill-reward-gold" />
                    <span className="text-xs font-bold text-white">{day.stars}</span>
                  </div>
                )}
              </div>
              
              {/* Day label */}
              <span 
                className={`
                  text-xs font-medium
                  ${day.isToday 
                    ? 'text-reward-gold' 
                    : 'text-white/60'
                  }
                `}
              >
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Encouragement message */}
      {totalWeekStars === 0 && (
        <p className="text-center text-white/50 text-sm py-2">
          Schau Videos um Sterne zu sammeln! ⭐
        </p>
      )}
      
      {totalWeekStars > 0 && totalWeekStars < 7 && (
        <p className="text-center text-white/60 text-sm">
          Weiter so! 🎯
        </p>
      )}
      
      {totalWeekStars >= 7 && (
        <p className="text-center text-reward-gold text-sm font-medium">
          Fantastische Woche! 🏆
        </p>
      )}
    </div>
  );
}
