import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Star, Video, Calendar, GraduationCap, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_teacher: boolean;
}

interface UserDetail extends UserProfile {
  total_stars: number;
  videos_watched: number;
  recordings_count: number;
  last_login: string | null;
}

export function UserList() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [updatingTeacher, setUpdatingTeacher] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserDetail(userId: string) {
    setIsLoadingDetail(true);
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return;

      // Fetch stats in parallel
      const [starsRes, videosRes, recordingsRes, lastLoginRes] = await Promise.all([
        supabase
          .from('video_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('user_video_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('user_recordings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('activity_logs')
          .select('created_at')
          .eq('user_id', userId)
          .eq('action', 'login')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      setSelectedUser({
        ...profile,
        total_stars: starsRes.count || 0,
        videos_watched: videosRes.count || 0,
        recordings_count: recordingsRes.count || 0,
        last_login: lastLoginRes.data?.[0]?.created_at || null,
      });
    } catch (error) {
      console.error('Error fetching user detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  };

  const handleToggleTeacher = async (userId: string, currentValue: boolean) => {
    setUpdatingTeacher(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_teacher: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_teacher: !currentValue } : u
      ));

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_teacher: !currentValue });
      }

      toast({
        title: !currentValue ? 'Lehrer-Status aktiviert' : 'Lehrer-Status entfernt',
        description: `Der Nutzer ist jetzt ${!currentValue ? 'ein Lehrer' : 'kein Lehrer mehr'}.`
      });
    } catch (error) {
      console.error('Error updating teacher status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingTeacher(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutzer</h1>
          <p className="text-muted-foreground mt-1">Alle registrierten Nutzer</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Nutzerliste ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchQuery ? 'Keine Nutzer gefunden' : 'Noch keine Nutzer registriert'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nutzer</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Lehrer</TableHead>
                    <TableHead>Registriert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <button
                          onClick={() => fetchUserDetail(user.id)}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.display_name || 'Unbekannt'}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        {user.is_teacher ? (
                          <Badge variant="secondary" className="gap-1">
                            <GraduationCap className="w-3 h-3" />
                            Lehrer
                          </Badge>
                        ) : (
                          <Badge variant="outline">Schüler</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {updatingTeacher === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Switch
                              checked={user.is_teacher}
                              onCheckedChange={() => handleToggleTeacher(user.id, user.is_teacher)}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nutzerprofil</DialogTitle>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          ) : selectedUser && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {selectedUser.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedUser.display_name || 'Unbekannt'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_teacher ? (
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Lehrer
                      </Badge>
                    ) : (
                      <Badge variant="outline">Schüler</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">Lehrer-Status</span>
                  {updatingTeacher === selectedUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Switch
                      checked={selectedUser.is_teacher}
                      onCheckedChange={() => handleToggleTeacher(selectedUser.id, selectedUser.is_teacher)}
                    />
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Registriert seit
                  </div>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Letzter Login
                  </div>
                  <p className="font-medium">{formatDate(selectedUser.last_login)}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#FFCC00]/10">
                  <div className="flex items-center gap-2 text-[#FFCC00] text-sm mb-1">
                    <Star className="w-4 h-4" />
                    Sterne
                  </div>
                  <p className="font-bold text-xl">{selectedUser.total_stars}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#005BBB]/10">
                  <div className="flex items-center gap-2 text-[#005BBB] text-sm mb-1">
                    <Video className="w-4 h-4" />
                    Videos
                  </div>
                  <p className="font-bold text-xl">{selectedUser.videos_watched}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Lehrer-Status kann oben umgeschaltet werden
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
