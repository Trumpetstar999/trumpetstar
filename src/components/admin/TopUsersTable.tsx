import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserActivity {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  login_count: number;
  last_login: string | null;
}

interface UserStars {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_stars: number;
  weekly_stars: number;
  last_activity: string | null;
}

type TimeFilter = '7days' | '30days' | 'all';

export function TopUsersTable() {
  const [loginTimeFilter, setLoginTimeFilter] = useState<TimeFilter>('all');
  const [topLogins, setTopLogins] = useState<UserActivity[]>([]);
  const [topStars, setTopStars] = useState<UserStars[]>([]);
  const [isLoadingLogins, setIsLoadingLogins] = useState(true);
  const [isLoadingStars, setIsLoadingStars] = useState(true);

  useEffect(() => {
    fetchTopLogins();
  }, [loginTimeFilter]);

  useEffect(() => {
    fetchTopStars();
  }, []);

  async function fetchTopLogins() {
    setIsLoadingLogins(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('user_id, created_at')
        .eq('action', 'login');

      // Apply time filter
      if (loginTimeFilter === '7days') {
        query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (loginTimeFilter === '30days') {
        query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      const { data: logins, error } = await query;

      if (error) throw error;

      // Aggregate by user
      const userLogins = (logins || []).reduce((acc, log) => {
        if (!acc[log.user_id]) {
          acc[log.user_id] = { count: 0, lastLogin: log.created_at };
        }
        acc[log.user_id].count++;
        if (log.created_at > acc[log.user_id].lastLogin) {
          acc[log.user_id].lastLogin = log.created_at;
        }
        return acc;
      }, {} as Record<string, { count: number; lastLogin: string }>);

      // Get user profiles
      const userIds = Object.keys(userLogins);
      if (userIds.length === 0) {
        setTopLogins([]);
        setIsLoadingLogins(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

      const result: UserActivity[] = Object.entries(userLogins)
        .map(([userId, data]) => ({
          user_id: userId,
          display_name: profileMap[userId]?.display_name || 'Unbekannt',
          avatar_url: profileMap[userId]?.avatar_url || null,
          login_count: data.count,
          last_login: data.lastLogin,
        }))
        .sort((a, b) => b.login_count - a.login_count)
        .slice(0, 10);

      setTopLogins(result);
    } catch (error) {
      console.error('Error fetching top logins:', error);
    } finally {
      setIsLoadingLogins(false);
    }
  }

  async function fetchTopStars() {
    setIsLoadingStars(true);
    try {
      // Get all video completions
      const { data: completions, error } = await supabase
        .from('video_completions')
        .select('user_id, completed_at');

      if (error) throw error;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Aggregate by user
      const userStars = (completions || []).reduce((acc, c) => {
        if (!acc[c.user_id]) {
          acc[c.user_id] = { total: 0, weekly: 0, lastActivity: c.completed_at };
        }
        acc[c.user_id].total++;
        if (c.completed_at >= sevenDaysAgo) {
          acc[c.user_id].weekly++;
        }
        if (c.completed_at > acc[c.user_id].lastActivity) {
          acc[c.user_id].lastActivity = c.completed_at;
        }
        return acc;
      }, {} as Record<string, { total: number; weekly: number; lastActivity: string }>);

      // Get user profiles
      const userIds = Object.keys(userStars);
      if (userIds.length === 0) {
        setTopStars([]);
        setIsLoadingStars(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

      const result: UserStars[] = Object.entries(userStars)
        .map(([userId, data]) => ({
          user_id: userId,
          display_name: profileMap[userId]?.display_name || 'Unbekannt',
          avatar_url: profileMap[userId]?.avatar_url || null,
          total_stars: data.total,
          weekly_stars: data.weekly,
          last_activity: data.lastActivity,
        }))
        .sort((a, b) => b.total_stars - a.total_stars)
        .slice(0, 10);

      setTopStars(result);
    } catch (error) {
      console.error('Error fetching top stars:', error);
    } finally {
      setIsLoadingStars(false);
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Logins */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-[#005BBB]" />
            Top Nutzer – Logins
          </CardTitle>
          <Select value={loginTimeFilter} onValueChange={(v) => setLoginTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Letzte 7 Tage</SelectItem>
              <SelectItem value="30days">Letzte 30 Tage</SelectItem>
              <SelectItem value="all">Gesamt</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoadingLogins ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topLogins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Keine Login-Daten vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nutzer</TableHead>
                  <TableHead className="text-right">Logins</TableHead>
                  <TableHead className="text-right">Letzter Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLogins.map((user, index) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span>{user.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{user.login_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(user.last_login)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Stars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#FFCC00]" />
            Top Nutzer – Sterne ⭐
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStars ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topStars.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Keine Sterne-Daten vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nutzer</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                  <TableHead className="text-right">7 Tage</TableHead>
                  <TableHead className="text-right">Letzte Aktivität</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStars.map((user, index) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span>{user.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#FFCC00]">
                      {user.total_stars} ⭐
                    </TableCell>
                    <TableCell className="text-right">{user.weekly_stars}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(user.last_activity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
