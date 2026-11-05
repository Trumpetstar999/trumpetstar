import { lazy, ReactNode, Suspense, useState } from 'react';
import { ShopCatalog } from '@/components/home/ShopCatalog';
import { Link, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getAppByRoute, safeNextPath } from '@/config/apps';
import { ModuleShell } from '@/components/home/ModuleShell';
import { RequireAuth } from '@/components/home/RequireAuth';
import { TunerPopup } from '@/components/tuner/TunerPopup';
import { TabId } from '@/types';
import { FingeringChart } from '@/components/home/FingeringChart';
import { RhythmusWerkstatt } from '@/components/home/RhythmusWerkstatt';
import { BeginnerCourse } from '@/components/home/BeginnerCourse';
import { ShopProductCard } from '@/components/home/ShopCarousel';
import { useShopProducts } from '@/hooks/useShopProducts';
import { Button } from '@/components/ui/button';
import { shopCopy } from '@/i18n/shop';

const LevelsPage = lazy(() => import('../LevelsPage').then((m) => ({ default: m.LevelsPage })));
const PdfsPage = lazy(() => import('../PdfsPage').then((m) => ({ default: m.PdfsPage })));
const PracticePage = lazy(() => import('../PracticePage').then((m) => ({ default: m.PracticePage })));
const RecordingsPage = lazy(() => import('../RecordingsPage').then((m) => ({ default: m.RecordingsPage })));
const ChatsPage = lazy(() => import('../ChatsPage').then((m) => ({ default: m.ChatsPage })));
const ProfilePage = lazy(() => import('../ProfilePage').then((m) => ({ default: m.ProfilePage })));
const GamePage = lazy(() => import('../GamePage').then((m) => ({ default: m.GamePage })));
const MetronomePage = lazy(() => import('../MetronomePage').then((m) => ({ default: m.MetronomePage })));
const AudiosPage = lazy(() => import('../AudiosPage').then((m) => ({ default: m.AudiosPage })));

const Fallback = () => (
  <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
);

function Module({ route, tab, children, surface = 'gradient' }: { route: string; tab?: TabId; children: ReactNode; surface?: 'gradient' | 'light' }) {
  const { t } = useLanguage();
  const app = getAppByRoute(route);
  return (
    <ModuleShell title={app ? t(app.labelKey) : t('home.profile')} icon={app?.icon} tab={tab} surface={surface}>
      <Suspense fallback={<Fallback />}>{children}</Suspense>
    </ModuleShell>
  );
}

function ComingSoon() {
  const { t } = useLanguage();
  return (
    <div className="m-4 rounded-[18px] bg-ts-card p-8 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-ts-ink">{t('home.soon')}</p>
      <p className="text-ts-muted mt-2">{t('home.soonP')}</p>
    </div>
  );
}

function TunerModule() {
  return <TunerPopup inline isOpen onClose={() => {}} />;
}

export const BeginnerModule = () => <RequireAuth><Module route="/beginner" surface="light"><BeginnerCourse /></Module></RequireAuth>;
export const VideosModule = () => <RequireAuth><Module route="/videos" tab="levels"><LevelsPage onStarEarned={() => {}} /></Module></RequireAuth>;
export const RhythmusModule = () => <RhythmusWerkstatt />;
export const GamesModule = () => <RequireAuth><Module route="/games" tab="game"><GamePage /></Module></RequireAuth>;
export const MetronomModule = () => <Module route="/metronom" tab="metronome" surface="light"><MetronomePage /></Module>;
export const PlaylistsModule = () => <RequireAuth><Module route="/playlists" tab="practice"><PracticePage /></Module></RequireAuth>;
export const FeedbackModule = () => <RequireAuth><Module route="/feedback" tab="chats"><ChatsPage /></Module></RequireAuth>;
export const AudioModule = () => <Module route="/audio" tab="audios" surface="light"><AudiosPage /></Module>;
export const NotenModule = () => <RequireAuth><Module route="/noten" tab="pdfs" surface="light"><PdfsPage /></Module></RequireAuth>;
export const TunerModulePage = () => <Module route="/tuner" surface="light"><TunerModule /></Module>;
export const GriffModule = () => <Module route="/grifftabelle" surface="light"><FingeringChart /></Module>;
function ShopGrid() {
  return <ShopCatalog loadingFallback={<Fallback />} />;
}
export const ShopModule = () => <Module route="/shop" surface="light"><ShopGrid /></Module>;
export const ProfileModule = () => (
  <RequireAuth>
    <Module route="/profil" tab="profile">
      <ProfilePage />
      <RecordingsPage />
    </Module>
  </RequireAuth>
);

/** Legacy /app entry: honour a pending post-login destination, otherwise go home. */
export function AppEntryRedirect() {
  const [target] = useState(() => {
    const next = safeNextPath(sessionStorage.getItem('returnTo'));
    sessionStorage.removeItem('returnTo');
    return next ?? '/';
  });
  return <Navigate to={target === '/app' ? '/' : target} replace />;
}
