export interface HomeApp {
  id: number;
  slug: string;
  route: string;
  icon: string;
  labelKey: string;
  requiresAuth: boolean;
}

/** Single source of truth for homescreen icons, lock badges and route guarding. */
export const HOME_APPS: HomeApp[] = [
  { id: 1, slug: 'beginner', route: '/beginner', icon: '/icons/01-beginnerkurs.svg', labelKey: 'home.beg', requiresAuth: true },
  { id: 2, slug: 'videos', route: '/videos', icon: '/icons/02-videos.svg', labelKey: 'home.vid', requiresAuth: true },
  { id: 3, slug: 'rhythmus', route: '/rhythmus', icon: '/icons/03-rhythmus.svg', labelKey: 'home.rhy', requiresAuth: false },
  { id: 4, slug: 'games', route: '/games', icon: '/icons/04-games.svg', labelKey: 'home.gam', requiresAuth: true },
  { id: 5, slug: 'metronom', route: '/metronom', icon: '/icons/05-metronom.svg', labelKey: 'home.met', requiresAuth: false },
  { id: 6, slug: 'playlists', route: '/playlists', icon: '/icons/06-playlists.svg', labelKey: 'home.pla', requiresAuth: true },
  { id: 7, slug: 'feedback', route: '/feedback', icon: '/icons/07-feedback.svg', labelKey: 'home.fee', requiresAuth: true },
  { id: 8, slug: 'audio', route: '/audio', icon: '/icons/08-audioplayer.svg', labelKey: 'home.aud', requiresAuth: false },
  { id: 9, slug: 'shop', route: '/shop', icon: '/icons/09-shop.svg', labelKey: 'home.sho', requiresAuth: false },
  { id: 10, slug: 'noten', route: '/noten', icon: '/icons/10-noten.svg', labelKey: 'home.not', requiresAuth: true },
  { id: 11, slug: 'tuner', route: '/tuner', icon: '/icons/11-tuner.svg', labelKey: 'home.tun', requiresAuth: false },
  { id: 12, slug: 'grifftabelle', route: '/grifftabelle', icon: '/icons/12-grifftabelle.svg', labelKey: 'home.gri', requiresAuth: false },
];

export const PROFILE_ROUTE = '/profil';

export function getAppByRoute(path: string): HomeApp | undefined {
  return HOME_APPS.find((a) => a.route === path);
}

/** Only same-site paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
