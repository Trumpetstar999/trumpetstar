import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { DayActivity } from '@/types';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  activities: DayActivity[];
  onDayClick: (date: string) => void;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export function CalendarView({ activities, onDayClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();
  
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const getActivity = (day: number): DayActivity | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activities.find(a => a.date === dateStr);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold text-foreground">
          {MONTHS[month]} {year}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const activity = getActivity(day);
          const isToday = 
            new Date().getDate() === day && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;
          
          return (
            <button
              key={day}
              onClick={() => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onDayClick(dateStr);
              }}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',
                isToday && 'ring-2 ring-primary',
                activity?.stars ? 'bg-gold/10 hover:bg-gold/20' : 'hover:bg-muted'
              )}
            >
              <span className={cn(
                'text-sm font-medium',
                isToday ? 'text-primary' : 'text-foreground'
              )}>
                {day}
              </span>
              {activity && activity.stars > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs font-medium text-gold">{activity.stars}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
