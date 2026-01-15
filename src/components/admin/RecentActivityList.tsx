import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, Play, Star, Video, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  login: { icon: LogIn, label: 'Login', color: 'text-[#005BBB]' },
  video_played: { icon: Play, label: 'Video abgespielt', color: 'text-emerald-500' },
  star_earned: { icon: Star, label: 'Stern erhalten', color: 'text-[#FFCC00]' },
  recording_created: { icon: Video, label: 'Aufnahme erstellt', color: 'text-violet-500' },
  classroom_joined: { icon: Users, label: 'Klassenzimmer betreten', color: 'text-[#E63946]' },
};

export function RecentActivityList() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    setIsLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(logs.map(l => l.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

      const enrichedLogs: ActivityLog[] = logs.map(log => ({
        ...log,
        metadata: (log.metadata || {}) as Record<string, unknown>,
        display_name: profileMap[log.user_id]?.display_name || 'Unbekannt',
        avatar_url: profileMap[log.user_id]?.avatar_url || null,
      }));

      setActivities(enrichedLogs);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd.MM. HH:mm', { locale: de });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Aktivitäten aufgezeichnet
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activities.map((activity) => {
                const config = actionConfig[activity.action] || {
                  icon: Activity,
                  label: activity.action,
                  color: 'text-muted-foreground',
                };
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={activity.avatar_url || undefined} />
                      <AvatarFallback>{activity.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.display_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span>{config.label}</span>
                      </div>
                    </div>
                    
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
