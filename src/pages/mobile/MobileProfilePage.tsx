import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { InviteFriendDialog } from '@/components/profile/InviteFriendDialog';
import { LogOut, Edit2, Lock, Scale, UserPlus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PLAN_DISPLAY_NAMES } from '@/types/plans';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const TEXTS = {
  de: {
    title: 'Profil',
    editProfile: 'Profil bearbeiten',
    changePassword: 'Passwort ändern',
    language: 'Sprache',
    plan: 'Dein Plan',
    logout: 'Abmelden',
    loggedOut: 'Erfolgreich abgemeldet',
  },
  en: {
    title: 'Profile',
    editProfile: 'Edit profile',
    changePassword: 'Change password',
    language: 'Language',
    plan: 'Your plan',
    logout: 'Sign out',
    loggedOut: 'Signed out successfully',
  },
  es: {
    title: 'Perfil',
    editProfile: 'Editar perfil',
    changePassword: 'Cambiar contraseña',
    language: 'Idioma',
    plan: 'Tu plan',
    logout: 'Cerrar sesión',
    loggedOut: 'Sesión cerrada',
  },
};

const LANG_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

export default function MobileProfilePage() {
  const { user, signOut } = useAuth();
  const { planKey } = useMembership();
  const { language, setLanguage, t: tGlobal } = useLanguage();
  const texts = TEXTS[language as keyof typeof TEXTS] || TEXTS.de;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(texts.loggedOut);
  };

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">{texts.title}</h1>

        {/* Profile Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-lg font-bold text-foreground">
                {profile?.display_name || user?.email?.split('@')[0]}
              </h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>

            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
              {texts.plan}: {PLAN_DISPLAY_NAMES[planKey]}
            </Badge>

            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit2 className="w-4 h-4" />
              {texts.editProfile}
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={() => setPasswordDialogOpen(true)}
            >
              <Lock className="w-4 h-4" />
              {texts.changePassword}
            </Button>
          </CardContent>
        </Card>

        {/* Invite Friends */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <Button
              variant="outline"
              className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5 gap-2 font-semibold"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              {language === 'en' ? 'Invite friends' : language === 'es' ? 'Invitar amigos' : 'Freunde einladen'}
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {language === 'en' ? 'Earn 5 stars per invitation!' : language === 'es' ? '¡Gana 5 estrellas por invitación!' : 'Erhalte 5 Sterne pro Einladung!'}
            </p>
          </CardContent>
        </Card>

        {/* Language Selector */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">{texts.language}</h3>
            <div className="flex gap-2">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]',
                    language === opt.code
                      ? 'bg-primary/10 border-2 border-primary text-primary'
                      : 'bg-muted border-2 border-transparent text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span>{opt.flag}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {texts.logout}
        </Button>

        {/* Impressum */}
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/30 hover:text-white/60 text-xs gap-1.5">
                <Scale className="w-3 h-3" />
                {tGlobal('profile.impressumTitle')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{tGlobal('profile.impressumTitle')}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">Trumpetstar GmbH</p>
                    <p>Verlag für Buch, Kunst und Musikalien</p>
                    <p>Geschäftsführer: Mario Schulter, MA</p>
                    <p>Mogersdorf 253, 8382 Mogersdorf, Österreich</p>
                  </div>
                  <div>
                    <p>UID-Nr. (AT): ATU81038878</p>
                    <p>UID-Nr. (DE): DE442429470</p>
                    <p>Firmenbuch: FN 633951g</p>
                  </div>
                  <div>
                    <p>Tel.: +43 677 / 628 053 57</p>
                    <p>E-Mail: info@trumpetstar.com</p>
                    <p>Web: www.trumpetstar.com</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{tGlobal('profile.disputeResolution')}</p>
                    <p>
                      Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
                      <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        ec.europa.eu/consumers/odr
                      </a>. Beschwerden können auch direkt per E-Mail an uns gerichtet werden.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{tGlobal('profile.liabilityNote')}</p>
                    <p>Trotz sorgfältiger Prüfung übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Inhalte.</p>
                  </div>
                  <p className="text-xs text-muted-foreground/60 pt-2">Angaben gemäß §5 ECG, §14 UGB, §63 GewO, §25 MedienG</p>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile || { id: user?.id || '', display_name: null, avatar_url: null, created_at: '' }}
          onUpdate={fetchProfile}
        />
        <ChangePasswordDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
        />
        <InviteFriendDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      </div>
    </MobileLayout>
  );
}
