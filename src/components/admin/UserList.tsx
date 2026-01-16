import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Users, Star, Video, Calendar, GraduationCap, Loader2, Shield, ShieldCheck, User, Crown, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_teacher: boolean;
  role?: AppRole | null;
  plan_key?: string | null;
}

interface UserDetail extends UserProfile {
  total_stars: number;
  videos_watched: number;
  recordings_count: number;
  last_login: string | null;
}

interface Plan {
  key: string;
  display_name: string;
  rank: number;
}

export function UserList() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [updatingTeacher, setUpdatingTeacher] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('key, display_name, rank')
        .order('rank', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback plans
      setPlans([
        { key: 'FREE', display_name: 'Free', rank: 0 },
        { key: 'BASIC', display_name: 'Basic', rank: 10 },
        { key: 'PREMIUM', display_name: 'Premium', rank: 20 },
      ]);
    }
  }

  async function fetchUsers() {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Fetch memberships for all users
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('user_id, plan_key');

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
      }

      // Merge profiles with roles and plans
      const usersWithData = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userMembership = memberships?.find(m => m.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
          plan_key: userMembership?.plan_key || 'FREE',
        };
      });

      setUsers(usersWithData);
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

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

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
        role: roleData?.role || null,
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

  const handleRoleChange = async (userId: string, newRole: AppRole | 'none') => {
    setUpdatingRole(userId);
    try {
      if (newRole === 'none') {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Check if role exists
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          // Update existing role
          const { error } = await supabase
            .from('user_roles')
            .update({ role: newRole })
            .eq('user_id', userId);

          if (error) throw error;
        } else {
          // Insert new role
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: newRole });

          if (error) throw error;
        }
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole === 'none' ? null : newRole } : u
      ));

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole === 'none' ? null : newRole });
      }

      toast({
        title: 'Berechtigung aktualisiert',
        description: newRole === 'none' 
          ? 'Berechtigung wurde entfernt.' 
          : `Nutzer ist jetzt ${getRoleLabel(newRole)}.`
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Fehler',
        description: 'Berechtigung konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handlePlanChange = async (userId: string, newPlanKey: string) => {
    setUpdatingPlan(userId);
    try {
      // Check if membership exists
      const { data: existing } = await supabase
        .from('user_memberships')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const selectedPlan = plans.find(p => p.key === newPlanKey);
      const planRank = selectedPlan?.rank || 0;

      if (existing) {
        // Update existing membership
        const { error } = await supabase
          .from('user_memberships')
          .update({ 
            plan_key: newPlanKey, 
            plan_rank: planRank,
            current_plan: selectedPlan?.display_name || newPlanKey,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new membership
        const { error } = await supabase
          .from('user_memberships')
          .insert({ 
            user_id: userId, 
            plan_key: newPlanKey, 
            plan_rank: planRank,
            current_plan: selectedPlan?.display_name || newPlanKey
          });

        if (error) throw error;
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, plan_key: newPlanKey } : u
      ));

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, plan_key: newPlanKey });
      }

      toast({
        title: 'Plan aktualisiert',
        description: `Nutzer hat jetzt den ${selectedPlan?.display_name || newPlanKey} Plan.`
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Fehler',
        description: 'Plan konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingPlan(null);
    }
  };

  const getRoleLabel = (role: AppRole | null | undefined) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      case 'user': return 'Nutzer';
      default: return 'Keine';
    }
  };

  const getRoleIcon = (role: AppRole | null | undefined) => {
    switch (role) {
      case 'admin': return ShieldCheck;
      case 'moderator': return Shield;
      default: return User;
    }
  };

  const getRoleBadgeClass = (role: AppRole | null | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'moderator': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPlanIcon = (planKey: string | null | undefined) => {
    switch (planKey?.toUpperCase()) {
      case 'PREMIUM': return Crown;
      case 'BASIC': return Sparkles;
      default: return User;
    }
  };

  const getPlanColor = (planKey: string | null | undefined) => {
    switch (planKey?.toUpperCase()) {
      case 'PREMIUM': return 'text-amber-600';
      case 'BASIC': return 'text-blue-600';
      default: return 'text-slate-500';
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
                      Plan
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Berechtigung
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
                  {filteredUsers.map((user, index) => {
                    const RoleIcon = getRoleIcon(user.role);
                    const PlanIcon = getPlanIcon(user.plan_key);
                    return (
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
                          {updatingPlan === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                          ) : (
                            <Select
                              value={user.plan_key || 'FREE'}
                              onValueChange={(value) => handlePlanChange(user.id, value)}
                            >
                              <SelectTrigger className={`w-[120px] h-8 text-xs bg-white border-slate-200 ${getPlanColor(user.plan_key)}`}>
                                <div className="flex items-center gap-2">
                                  <PlanIcon className="w-3.5 h-3.5" />
                                  <SelectValue>
                                    {plans.find(p => p.key === user.plan_key)?.display_name || 'Free'}
                                  </SelectValue>
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                                {plans.map((plan) => {
                                  const Icon = getPlanIcon(plan.key);
                                  return (
                                    <SelectItem 
                                      key={plan.key} 
                                      value={plan.key} 
                                      className={getPlanColor(plan.key)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon className="w-3.5 h-3.5" />
                                        {plan.display_name}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {updatingRole === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                          ) : (
                            <Select
                              value={user.role || 'none'}
                              onValueChange={(value) => handleRoleChange(user.id, value as AppRole | 'none')}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-slate-200 text-slate-700">
                                <div className="flex items-center gap-2">
                                  <RoleIcon className="w-3.5 h-3.5" />
                                  <SelectValue>{getRoleLabel(user.role)}</SelectValue>
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                                <SelectItem value="none" className="text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    Keine
                                  </div>
                                </SelectItem>
                                <SelectItem value="user" className="text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    Nutzer
                                  </div>
                                </SelectItem>
                                <SelectItem value="moderator" className="text-amber-700">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    Moderator
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin" className="text-red-700">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
                    );
                  })}
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
