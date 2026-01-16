import { Star, Flame, Clock, TrendingUp } from 'lucide-react';
import { mockStats } from '@/data/mockData';

export function StarsProgressWidget() {
  const stats = mockStats;
  
  // Calculate progress (0-5 stars based on today's activity)
  const todayProgress = Math.min(stats.todayStars, 5);
  const progressPercent = (todayProgress / 5) * 100;

  return (
    <div>
      {/* Main Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/80 font-medium">Heute</h3>
          <span className="text-reward-gold font-bold text-lg">
            {todayProgress}/5 Sterne
          </span>
        </div>
        
        {/* Star Progress Bar */}
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-reward-gold to-reward-gold/80 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Star Icons */}
        <div className="flex justify-between mt-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <div
              key={star}
              className={`transition-all duration-300 ${
                star <= todayProgress 
                  ? 'text-reward-gold scale-110' 
                  : 'text-white/20'
              }`}
            >
              <Star 
                className={`w-6 h-6 ${star <= todayProgress ? 'fill-reward-gold' : ''}`} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-reward-gold/20">
            <Star className="w-4 h-4 text-reward-gold fill-reward-gold" />
          </div>
          <p className="text-xl font-bold text-white">{stats.weekStars}</p>
          <p className="text-xs text-white/50">Diese Woche</p>
        </div>
        
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-accent-red/20">
            <Flame className="w-4 h-4 text-accent-red" />
          </div>
          <p className="text-xl font-bold text-white">{stats.streak}</p>
          <p className="text-xs text-white/50">Tage Streak</p>
        </div>
        
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-brand-blue-start/30">
            <Clock className="w-4 h-4 text-brand-blue-start" />
          </div>
          <p className="text-xl font-bold text-white">{stats.todayMinutes}</p>
          <p className="text-xs text-white/50">Minuten heute</p>
        </div>
      </div>
    </div>
  );
}
