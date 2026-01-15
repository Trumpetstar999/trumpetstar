import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface DayData {
  date: string;
  label: string;
  logins: number;
  stars: number;
}

export function ActivityCharts() {
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    setIsLoading(true);
    try {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

      // Fetch logins
      const { data: logins } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('action', 'login')
        .gte('created_at', fourteenDaysAgo);

      // Fetch stars (video completions)
      const { data: stars } = await supabase
        .from('video_completions')
        .select('completed_at')
        .gte('completed_at', fourteenDaysAgo);

      // Generate date buckets for last 14 days
      const days: DayData[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        days.push({
          date: dateStr,
          label: format(date, 'dd.MM.', { locale: de }),
          logins: 0,
          stars: 0,
        });
      }

      // Count logins per day
      (logins || []).forEach((log) => {
        const dateStr = format(new Date(log.created_at), 'yyyy-MM-dd');
        const day = days.find((d) => d.date === dateStr);
        if (day) day.logins++;
      });

      // Count stars per day
      (stars || []).forEach((completion) => {
        const dateStr = format(new Date(completion.completed_at), 'yyyy-MM-dd');
        const day = days.find((d) => d.date === dateStr);
        if (day) day.stars++;
      });

      setChartData(days);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logins Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logins pro Tag (letzte 14 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#005BBB"
                strokeWidth={2}
                dot={{ fill: '#005BBB', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
                name="Logins"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stars Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sterne pro Tag (letzte 14 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar
                dataKey="stars"
                fill="#FFCC00"
                radius={[4, 4, 0, 0]}
                name="Sterne"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
