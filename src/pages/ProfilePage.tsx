import { StatsCard } from '@/components/profile/StatsCard';
import { CalendarView } from '@/components/profile/CalendarView';
import { mockStats, mockActivities } from '@/data/mockData';
import { User, Settings, Shield, LogOut, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function ProfilePage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const activity = selectedDay ? mockActivities.find(a => a.date === selectedDay) : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Profile header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mein Profil</h2>
            <p className="text-muted-foreground">Nur für dich sichtbar</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon">
            <Shield className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Heute</h3>
        <StatsCard stats={mockStats} />
      </div>
      
      {/* Weekly overview */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-gold" />
            <h3 className="font-semibold text-foreground">Diese Woche</h3>
          </div>
          <p className="text-4xl font-bold text-foreground">{mockStats.weekStars}</p>
          <p className="text-muted-foreground mt-1">Sterne gesammelt</p>
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Übungszeit</h3>
          </div>
          <p className="text-4xl font-bold text-foreground">{mockStats.weekMinutes}</p>
          <p className="text-muted-foreground mt-1">Minuten diese Woche</p>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Aktivitätskalender</h3>
          <CalendarView 
            activities={mockActivities} 
            onDayClick={setSelectedDay}
          />
        </div>
        
        {/* Day details */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDay ? new Date(selectedDay).toLocaleDateString('de-DE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            }) : 'Tag auswählen'}
          </h3>
          
          {activity ? (
            <div className="bg-card rounded-xl p-6 border border-border animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gold/10 rounded-lg">
                  <Star className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{activity.stars}</p>
                  <p className="text-sm text-muted-foreground">Sterne</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{activity.minutesPracticed}</p>
                  <p className="text-sm text-muted-foreground">Minuten</p>
                </div>
              </div>
              
              <h4 className="font-medium text-foreground mb-3">Gespielte Videos</h4>
              <ul className="space-y-2 text-muted-foreground">
                {activity.videosWatched.map(id => (
                  <li key={id} className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    Video {id.replace('video-', '#')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 border border-border text-center text-muted-foreground">
              Klicke auf einen Tag im Kalender, um Details zu sehen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
