import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return;

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
      <div className="space-y-4">
        {/* Card Container */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6B7280]" />
              <span className="font-medium text-[#111827]">
                Nutzerliste ({filteredUsers.length})
              </span>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                placeholder="Nutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-[#EFF6FF]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#6B7280] mx-auto" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">
                {searchQuery ? 'Keine Nutzer gefunden' : 'Noch keine Nutzer registriert'}
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F7FA]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Nutzer
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Rolle
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Lehrer
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Registriert
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-b border-[#E5E7EB] hover:bg-[#EFF6FF] transition-colors ${
                        index % 2 === 1 ? 'bg-[#F9FAFB]' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <button
                          onClick={() => fetchUserDetail(user.id)}
                          className="flex items-center gap-3 hover:underline text-left"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-[#F5F7FA] text-[#6B7280]">
                              {user.display_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-[#111827]">
                            {user.display_name || 'Unbekannt'}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        {user.is_teacher ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#EFF6FF] text-[#3B82F6] rounded-full">
                            <GraduationCap className="w-3 h-3" />
                            Lehrer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#F5F7FA] text-[#6B7280] rounded-full">
                            Schüler
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {updatingTeacher === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                          ) : (
                            <Switch
                              checked={user.is_teacher}
                              onCheckedChange={() => handleToggleTeacher(user.id, user.is_teacher)}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#6B7280]">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md bg-white border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Nutzerprofil</DialogTitle>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#6B7280] mx-auto" />
            </div>
          ) : selectedUser && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-[#F5F7FA] text-[#6B7280]">
                    {selectedUser.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#111827]">
                    {selectedUser.display_name || 'Unbekannt'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_teacher ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#EFF6FF] text-[#3B82F6] rounded-full">
                        <GraduationCap className="w-3 h-3" />
                        Lehrer
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#F5F7FA] text-[#6B7280] rounded-full">
                        Schüler
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Lehrer</span>
                  {updatingTeacher === selectedUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                  ) : (
                    <Switch
                      checked={selectedUser.is_teacher}
                      onCheckedChange={() => handleToggleTeacher(selectedUser.id, selectedUser.is_teacher)}
                    />
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-[#F5F7FA]">
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Registriert
                  </div>
                  <p className="font-medium text-[#111827]">{formatDate(selectedUser.created_at)}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#F5F7FA]">
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Letzter Login
                  </div>
                  <p className="font-medium text-[#111827]">{formatDate(selectedUser.last_login)}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#F5F7FA]">
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                    <Star className="w-3.5 h-3.5" />
                    Sterne
                  </div>
                  <p className="font-bold text-xl text-[#111827]">{selectedUser.total_stars}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#F5F7FA]">
                  <div className="flex items-center gap-2 text-[#6B7280] text-xs mb-1">
                    <Video className="w-3.5 h-3.5" />
                    Videos
                  </div>
                  <p className="font-bold text-xl text-[#111827]">{selectedUser.videos_watched}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
