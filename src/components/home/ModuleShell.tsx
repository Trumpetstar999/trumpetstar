import { ReactNode, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { TabNavigationProvider } from '@/hooks/useTabNavigation';
import { TabId } from '@/types';
import { takeZoomOrigin } from './zoomOrigin';
import { Button } from '@/components/ui/button';

/** Maps legacy in-app tab jumps to the new module routes. */
const TAB_ROUTES: Partial<Record<TabId, string>> = {
  levels: '/videos', pdfs: '/noten', practice: '/playlists', recordings: '/profil',
  game: '/games', metronome: '/metronom', audios: '/audio', chats: '/feedback',
  classroom: '/app/classroom', profile: '/profil', musicxml: '/app/musicxml',
};

interface ModuleShellProps {
  title: string;
  icon?: string;
  tab?: TabId;
  /** Existing modules were designed on the signature gradient; new ones use the light surface. */
  surface?: 'gradient' | 'light';
  children: ReactNode;
}

export function ModuleShell({ title, icon, tab = 'levels', surface = 'gradient', children }: ModuleShellProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [origin] = useState(() => takeZoomOrigin());

  const initial = useMemo(() => {
    if (reduced || !origin) return { opacity: 0 };
    const sx = origin.width / window.innerWidth;
    const sy = origin.height / window.innerHeight;
    return { opacity: 0.6, x: origin.left, y: origin.top, scaleX: sx, scaleY: sy, borderRadius: 40 };
  }, [origin, reduced]);

  const onTabChange = useCallback((next: TabId) => {
    const route = TAB_ROUTES[next];
    if (route) navigate(route);
  }, [navigate]);

  return (
    <TabNavigationProvider activeTab={tab} onTabChange={onTabChange}>
      <motion.div
        className={`ts-system-font fixed inset-0 overflow-y-auto overflow-x-hidden ${surface === 'gradient' ? 'ts-gradient' : 'ts-light-module'}`}
        style={{ transformOrigin: '0 0' }}
        initial={initial}
        animate={{ opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <header className="ts-gradient sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="mx-auto max-w-[1100px] px-4 pt-2 pb-3">
            <div className="grid grid-cols-[90px_minmax(0,1fr)_90px] sm:grid-cols-[120px_minmax(0,1fr)_120px] items-center">
              <Button variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center justify-self-start min-h-11 -ml-2 pr-3 text-[17px] font-medium text-ts-on hover:bg-ts-on/10 hover:text-ts-on [&_svg]:size-7"
                aria-label={t('home.home')}
              >
                <ChevronLeft className="w-7 h-7" /> {t('home.home')}
              </Button>
              <h1 className="min-w-0 text-center text-[20px] sm:text-[32px] font-extrabold leading-tight text-ts-on break-words">{title}</h1>
              {icon && <img src={icon} alt="" className="w-10 h-10 justify-self-end" />}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1100px] px-0 pb-[calc(env(safe-area-inset-bottom)+24px)]">{children}</main>
      </motion.div>
    </TabNavigationProvider>
  );
}
