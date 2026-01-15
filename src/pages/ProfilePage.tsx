import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StatsCard } from '@/components/profile/StatsCard';
import { CalendarView } from '@/components/profile/CalendarView';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { mockStats, mockActivities } from '@/data/mockData';
import { 
  User, Settings, Shield, LogOut, Star, TrendingUp, 
  Mail, Calendar, Key, Edit2, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  const activity = selectedDay ? mockActivities.find(a => a.date === selectedDay) : null;

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    setProfile(data);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Erfolgreich abgemeldet');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Profile header */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Profil'} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {profile?.display_name || 'Mein Profil'}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit2 className="w-4 h-4" />
            Bearbeiten
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">E-Mail-Adresse</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mitglied seit</p>
              <p className="font-medium text-foreground">
                {formatDate(user?.created_at || profile?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
        <h3 className="text-lg font-semibold text-foreground p-4 border-b border-border">
          Einstellungen
        </h3>
        
        <button
          onClick={() => setPasswordDialogOpen(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium text-foreground">Passwort ändern</p>
              <p className="text-sm text-muted-foreground">Aktualisiere dein Passwort</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <Separator />
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-destructive"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Abmelden</p>
              <p className="text-sm opacity-70">Von diesem Gerät abmelden</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
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

      {/* Dialogs */}
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
