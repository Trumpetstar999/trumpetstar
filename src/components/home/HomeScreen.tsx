import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Crown, Loader2, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { HOME_APPS, HomeApp, PROFILE_ROUTE } from '@/config/apps';
import { LanguageSelectionDialog } from '@/components/onboarding/LanguageSelectionDialog';
import { WelcomeSlideshow } from '@/components/onboarding/WelcomeSlideshow';
import { setZoomOrigin } from './zoomOrigin';
import { LoginSheet } from './LoginSheet';
import { LanguageSheet, HOME_LANGUAGES } from './LanguageSheet';
import { NewsSheet } from './NewsSheet';
import { ProfileSheet } from './ProfileSheet';
import { ShopCarousel } from './ShopCarousel';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { homeMembershipCopy } from '@/i18n/home-membership';

interface HomeScreenProps {
  /** When set, the login sheet opens immediately (guest hit a locked URL). */
  lockedNext?: string | null;
}

export function HomeScreen({ lockedNext = null }: HomeScreenProps) {
  const { user } = useAuth();
  const { t, language, isLoading: languageLoading, hasCompletedLanguageSetup, hasSeenWelcome, completeWelcome } = useLanguage();
  const unread = useUnreadMessages();
  const navigate = useNavigate();
  const [loginNext, setLoginNext] = useState<string | null>(lockedNext);
  const [loginOpen, setLoginOpen] = useState(!!lockedNext && !user);
  const [langOpen, setLangOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const news = useAppUpdates();
  const { planKey, isLoading: membershipLoading } = useMembership();
  const membershipCopy = homeMembershipCopy[language];
  const paidMember = !!user && planKey !== 'FREE';

  useEffect(() => {
    if (lockedNext && !user) { setLoginNext(lockedNext); setLoginOpen(true); }
  }, [lockedNext, user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('video_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setStars(count || 0));
  }, [user]);

  const name = (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0]
    || user?.email?.split('@')[0] || '';

  const openApp = (app: HomeApp, e: MouseEvent<HTMLButtonElement>) => {
    if (app.requiresAuth && !user) {
      setLoginNext(app.route);
      setLoginOpen(true);
      return;
    }
    const img = e.currentTarget.querySelector('img');
    setZoomOrigin(img ? img.getBoundingClientRect() : null);
    navigate(app.route);
  };

  const openProfile = () => {
    if (!user) { setLoginNext(PROFILE_ROUTE); setLoginOpen(true); return; }
    setProfileOpen(true);
  };

  const flag = HOME_LANGUAGES.find((l) => l.code === language)?.flag ?? '🇩🇪';

  const tile = (app: HomeApp) => {
    const locked = app.requiresAuth && !user;
    const badge = app.slug === 'feedback' && user && unread > 0 ? unread : 0;
    return (
      <button
        key={app.id}
        onClick={(e) => openApp(app, e)}
        aria-label={locked ? `${t(app.labelKey)} (${t('home.locked')})` : t(app.labelKey)}
        className="group flex flex-col items-center gap-1.5 min-w-0"
      >
        <span className="relative block w-16 h-16 md:w-20 md:h-20 rounded-[22.5%] transition-transform duration-200 group-active:scale-90 group-active:brightness-90" style={{ boxShadow: 'var(--ts-icon-shadow)', transitionTimingFunction: 'var(--ts-ease)' }}>
          <img src={app.icon} alt="" className="w-full h-full" draggable={false} />
          {locked && (
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-ts-card flex items-center justify-center shadow">
              <Lock className="w-3.5 h-3.5 text-ts-deep" strokeWidth={3} />
            </span>
          )}
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-ts-red text-ts-on text-xs font-bold flex items-center justify-center shadow">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <span className="text-xs font-medium text-ts-ink truncate max-w-full">{t(app.labelKey)}</span>
      </button>
    );
  };

  const glassBtn = 'ts-glass w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-full flex items-center justify-center text-ts-deep active:scale-95 transition';

  return (
    <div className="ts-wall ts-system-font min-h-[100dvh] w-full">
      <div
        className="mx-auto max-w-[720px] px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <img src="/logo_trumpetstar.png" alt="Trumpetstar" className="h-8 sm:h-[60px] w-auto" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              disabled={!!user && membershipLoading}
              title={paidMember ? `${membershipCopy.status}: ${planKey}` : membershipCopy.upgrade}
              aria-label={user && membershipLoading ? membershipCopy.loading : paidMember ? `${membershipCopy.status}: ${planKey}` : membershipCopy.upgrade}
              onClick={() => paidMember ? openProfile() : navigate('/pricing')}
              className="h-9 sm:h-11 rounded-full px-2 sm:px-3 bg-ts-gold text-ts-ink hover:bg-ts-gold/80 text-xs sm:text-sm font-bold"
            >
              {user && membershipLoading ? <Loader2 className="animate-spin" /> : <Crown aria-hidden="true" />}
              {user && membershipLoading ? '…' : paidMember ? planKey : membershipCopy.upgrade}
            </Button>
            <button className={glassBtn} aria-label={t('home.news')} onClick={() => { setNewsOpen(true); news.markAllRead(); }}>
              <span className="relative"><Bell className="w-5 h-5" />
                {news.unread > 0 && <span className="absolute -top-3 -right-3 min-w-5 h-5 px-1 rounded-full bg-ts-red text-ts-on text-[11px] font-bold flex items-center justify-center">{news.unread > 9 ? '9+' : news.unread}</span>}
              </span>
            </button>
            <button className={glassBtn} aria-label={t('home.lang')} onClick={() => setLangOpen(true)}>
              <span className="text-xl leading-none">{flag}</span>
            </button>
            <button className={glassBtn} aria-label={t('home.profile')} onClick={openProfile}>
              {user ? (
                <span className="w-9 h-9 rounded-full ts-gradient flex items-center justify-center font-bold text-sm uppercase">{name.slice(0, 1) || '★'}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        <section className="mt-5">
          <h1 className="text-[22px] font-bold text-ts-ink">{user ? t('home.hiUser', { name }) : t('home.hiGuest')}</h1>
          <p className="text-[15px] text-ts-muted mt-0.5">{user ? t('home.hiUserP') : t('home.hiGuestP')}</p>
          {user && (
            <span className="ts-glass inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-bold text-ts-ink">
              <span className="text-ts-gold">★</span> {stars} {t('home.stars')}
            </span>
          )}
        </section>

        <nav className="mt-7 grid grid-cols-4 gap-x-3 gap-y-6">
          {HOME_APPS.slice(0, 8).map(tile)}
        </nav>
        <ShopCarousel />
        <nav className="mt-8 grid grid-cols-4 gap-x-3 gap-y-6">
          {HOME_APPS.slice(8).map(tile)}
        </nav>
        <footer className="mt-8 border-t border-ts-ink/15 pt-4 text-ts-ink"><LegalLinks /></footer>
      </div>

      <LoginSheet open={loginOpen} next={loginNext} onClose={() => setLoginOpen(false)} />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <NewsSheet open={newsOpen} onClose={() => setNewsOpen(false)} updates={news.updates} />
      {user && <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} name={name} stars={stars} />}

      {user && (
        <>
          <LanguageSelectionDialog open={!languageLoading && !hasCompletedLanguageSetup} />
          <WelcomeSlideshow open={!languageLoading && hasCompletedLanguageSetup && !hasSeenWelcome} onComplete={completeWelcome} />
        </>
      )}
    </div>
  );
}
