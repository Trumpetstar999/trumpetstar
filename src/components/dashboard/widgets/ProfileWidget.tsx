import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit2, Settings, LogOut } from 'lucide-react';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { MembershipStatusBadge } from '@/components/levels/MembershipStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function ProfileWidget() {
  const { user, signOut } = useAuth();
  const { planKey } = useMembership();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Erfolgreich abgemeldet');
  };

  return (
    <div className="flex flex-col items-center text-center">
      <Avatar className="w-24 h-24 mb-4 ring-4 ring-white/20">
        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Profil'} />
        <AvatarFallback className="text-2xl bg-brand-blue-mid text-white font-bold">
          {getInitials(profile?.display_name)}
        </AvatarFallback>
      </Avatar>
      
      <h2 className="text-xl font-bold text-white mb-1">
        {profile?.display_name || 'Mein Profil'}
      </h2>
      <p className="text-white/60 text-sm mb-3">{user?.email}</p>
      
      <MembershipStatusBadge />
      
      <div className="flex gap-2 mt-4 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditDialogOpen(true)}
          className="flex-1 text-white/80 hover:text-white hover:bg-white/10"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPasswordDialogOpen(true)}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-accent-red hover:text-accent-red hover:bg-accent-red/10"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {profile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onUpdate={fetchProfile}
        />
      )}

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}
