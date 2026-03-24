import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { InviteFriendDialog } from '@/components/profile/InviteFriendDialog';
import { LogOut, Edit2, Lock, Scale, UserPlus, Star, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PLAN_DISPLAY_NAMES, PlanKey } from '@/types/plans';
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
    invite: 'Freunde einladen',
    inviteDesc: 'Erhalte 5 Sterne pro Einladung!',
    account: 'Account',
  },
  en: {
    title: 'Profile',
    editProfile: 'Edit profile',
    changePassword: 'Change password',
    language: 'Language',
    plan: 'Your plan',
    logout: 'Sign out',
    loggedOut: 'Signed out successfully',
    invite: 'Invite friends',
    inviteDesc: 'Earn 5 stars per invitation!',
    account: 'Account',
  },
  es: {
    title: 'Perfil',
    editProfile: 'Editar perfil',
    changePassword: 'Cambiar contraseña',
    language: 'Idioma',
    plan: 'Tu plan',
    logout: 'Cerrar sesión',
    loggedOut: 'Sesión cerrada',
    invite: 'Invitar amigos',
    inviteDesc: '¡Gana 5 estrellas por invitación!',
    account: 'Cuenta',
  },
};

const LANG_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

const planConfig: Record<PlanKey, { label: string; icon: typeof Crown; gradient: string; textColor: string }> = {
  FREE:  { label: 'Free',  icon: Sparkles, gradient: 'from-slate-500 to-slate-600',  textColor: 'text-slate-200' },
  BASIC: { label: 'Basic', icon: Sparkles, gradient: 'from-blue-500 to-blue-700',   textColor: 'text-blue-100'  },
  PRO:   { label: 'Pro',   icon: Crown,    gradient: 'from-amber-400 to-orange-500', textColor: 'text-amber-100' },
};

export default function MobileProfilePage() {
  const { user, signOut } = useAuth();
  const { planKey: rawPlanKey } = useMembership();
  const planKey: PlanKey = (rawPlanKey === 'PREMIUM' as any) ? 'PRO' : rawPlanKey;
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

  const plan = planConfig[planKey] || planConfig.FREE;
  const PlanIcon = plan.icon;

  return (
    <MobileLayout>
      <div className="min-h-full pb-8">
        {/* Hero header */}
        <div
          className="relative px-6 pt-10 pb-24 flex flex-col items-center text-center"
          style={{
            background: 'linear-gradient(160deg, rgba(11,28,80,0.95) 0%, rgba(18,50,140,0.9) 60%, rgba(30,80,180,0.85) 100%)',
          }}
        >
          {/* Glow behind avatar */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-white/20 shadow-2xl">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback
                className="text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #1e4fc2, #3b82f6)', color: '#fff' }}
              >
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>
            {/* plan badge on avatar */}
            <div className={cn(
              'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg',
              `bg-gradient-to-br ${plan.gradient}`
            )}>
              <PlanIcon className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">
            {profile?.display_name || user?.email?.split('@')[0]}
          </h1>
          <p className="mt-1 text-sm text-white/50">{user?.email}</p>

          <div className={cn(
            'mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
            `bg-gradient-to-r ${plan.gradient}`, plan.textColor
          )}>
            <PlanIcon className="w-3 h-3" />
            {PLAN_DISPLAY_NAMES[planKey]}
          </div>
        </div>

        {/* Cards section floats over header */}
        <div className="px-4 -mt-14 space-y-3 relative z-10">

          {/* Account actions */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ background: 'rgba(15, 30, 80, 0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">
              {texts.account}
            </p>
            <ActionRow
              icon={<Edit2 className="w-4 h-4 text-blue-400" />}
              label={texts.editProfile}
              iconBg="rgba(59,130,246,0.15)"
              onClick={() => setEditDialogOpen(true)}
            />
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />
            <ActionRow
              icon={<Lock className="w-4 h-4 text-indigo-400" />}
              label={texts.changePassword}
              iconBg="rgba(99,102,241,0.15)"
              onClick={() => setPasswordDialogOpen(true)}
              last
            />
          </div>

          {/* Invite friends */}
          <button
            onClick={() => setInviteDialogOpen(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-4 shadow-xl transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(245,158,11,0.1) 100%)',
              border: '1px solid rgba(234,179,8,0.25)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-sm">{texts.invite}</p>
              <p className="text-amber-300/70 text-xs mt-0.5">{texts.inviteDesc}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <Star className="w-3.5 h-3.5 text-amber-400/60 fill-amber-400/60" />
            </div>
          </button>

          {/* Language */}
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'rgba(15, 30, 80, 0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest px-5 pt-4 pb-3">
              {texts.language}
            </p>
            <div className="px-4 pb-4 flex gap-2">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-[56px]',
                    language === opt.code
                      ? 'text-white scale-105'
                      : 'text-white/40 hover:text-white/70'
                  )}
                  style={language === opt.code ? {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25))',
                    border: '1.5px solid rgba(99,102,241,0.5)',
                    boxShadow: '0 0 16px rgba(99,102,241,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-xl">{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full rounded-2xl p-4 flex items-center gap-4 shadow-xl transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400 font-semibold text-sm">{texts.logout}</span>
          </button>

          {/* Impressum */}
          <div className="flex justify-center pt-2 pb-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors">
                  <Scale className="w-3 h-3" />
                  {tGlobal('profile.impressumTitle')}
                </button>
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
        </div>
      </div>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile || { id: user?.id || '', display_name: null, avatar_url: null, created_at: '' }}
        onUpdate={fetchProfile}
      />
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      <InviteFriendDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </MobileLayout>
  );
}

function ActionRow({
  icon, label, iconBg, onClick, last = false,
}: {
  icon: React.ReactNode;
  label: string;
  iconBg: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-5 py-3.5 transition-all active:bg-white/5',
        !last && ''
      )}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-medium text-white/90">{label}</span>
      <ChevronRight className="w-4 h-4 text-white/25" />
    </button>
  );
}
