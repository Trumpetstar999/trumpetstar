import { Star, Clock, Flame } from 'lucide-react';
import { UserStats } from '@/types';

interface StatsCardProps {
  stats: UserStats;
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Today's Stars */}
      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-gold fill-gold" />
        </div>
        <p className="text-3xl font-bold text-foreground">{stats.todayStars}</p>
        <p className="text-sm text-muted-foreground mt-1">Sterne heute</p>
      </div>
      
      {/* Practice time */}
      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <p className="text-3xl font-bold text-foreground">{stats.todayMinutes}</p>
        <p className="text-sm text-muted-foreground mt-1">Minuten heute</p>
      </div>
      
      {/* Streak */}
      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <Flame className="w-6 h-6 text-accent" />
        </div>
        <p className="text-3xl font-bold text-foreground">{stats.streak}</p>
        <p className="text-sm text-muted-foreground mt-1">Tage Streak</p>
      </div>
    </div>
  );
}
