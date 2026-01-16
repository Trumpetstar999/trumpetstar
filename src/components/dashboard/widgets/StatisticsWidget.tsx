import { BarChart3, Clock, Video, Calendar } from 'lucide-react';
import { mockStats, mockActivities } from '@/data/mockData';

export function StatisticsWidget() {
  const stats = mockStats;
  
  // Calculate active days this month
  const activeDaysThisMonth = mockActivities.filter(a => {
    const date = new Date(a.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  // Total videos watched (approximate from activities)
  const totalVideosWatched = mockActivities.reduce((acc, a) => acc + a.videosWatched.length, 0);

  const statItems = [
    {
      icon: Clock,
      label: 'Spielzeit gesamt',
      value: `${Math.floor(stats.weekMinutes * 4)} Min`,
      color: 'text-brand-blue-start',
      bgColor: 'bg-brand-blue-start/20',
    },
    {
      icon: Video,
      label: 'Videos angeschaut',
      value: totalVideosWatched.toString(),
      color: 'text-reward-gold',
      bgColor: 'bg-reward-gold/20',
    },
    {
      icon: Calendar,
      label: 'Aktive Tage',
      value: activeDaysThisMonth.toString(),
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-brand-blue-start" />
        <h3 className="text-white font-semibold">Statistik</h3>
      </div>

      <div className="space-y-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
          >
            <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-white/50 text-xs">{item.label}</p>
              <p className="text-white font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
