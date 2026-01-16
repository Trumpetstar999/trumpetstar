import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { mockActivities } from '@/data/mockData';
import { DayActivity } from '@/types';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function CalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const activities = mockActivities;

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const getActivity = (day: number): DayActivity | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activities.find(a => a.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(selectedDay === dateStr ? null : dateStr);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  
  const selectedActivity = selectedDay ? activities.find(a => a.date === selectedDay) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-white font-semibold">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-white/60 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before first of month */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const activity = getActivity(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDay === dateStr;
          
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                ${isToday ? 'ring-2 ring-reward-gold' : ''}
                ${isSelected ? 'bg-white/30' : 'hover:bg-white/20'}
                ${activity ? 'text-white font-medium' : 'text-white/60'}
              `}
            >
              <span className={`${isToday ? 'font-bold text-reward-gold' : ''}`}>
                {day}
              </span>
              {activity && activity.stars > 0 && (
                <Star className="w-3 h-3 text-reward-gold fill-reward-gold mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedActivity && (
        <div className="mt-4 p-3 bg-white/15 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-reward-gold fill-reward-gold" />
              <span className="text-white font-medium">{selectedActivity.stars} Sterne</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-white/80 text-sm">{selectedActivity.minutesPracticed} Min</span>
            </div>
          </div>
          <p className="text-white/70 text-xs mt-2">
            {selectedActivity.videosWatched.length} Videos geschaut
          </p>
        </div>
      )}
    </div>
  );
}
