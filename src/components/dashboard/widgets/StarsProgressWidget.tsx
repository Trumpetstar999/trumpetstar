import { Star, Flame, Clock } from 'lucide-react';
import { mockStats } from '@/data/mockData';

export function StarsProgressWidget() {
  const stats = mockStats;

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-white/10 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-reward-gold/20">
            <Star className="w-5 h-5 text-reward-gold fill-reward-gold" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.weekStars}</p>
          <p className="text-xs text-white/70">Diese Woche</p>
        </div>
        
        <div className="text-center p-4 bg-white/10 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-accent-red/20">
            <Flame className="w-5 h-5 text-accent-red" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.streak}</p>
          <p className="text-xs text-white/70">Tage Streak</p>
        </div>
        
        <div className="text-center p-4 bg-white/10 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-blue-400/20">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.todayMinutes}</p>
          <p className="text-xs text-white/70">Minuten heute</p>
        </div>
      </div>
    </div>
  );
}
