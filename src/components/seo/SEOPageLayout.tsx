import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/hooks/useLanguage';


interface SEOPageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

// hreflang URLs for all supported languages (single-domain setup)
const BASE_URL = 'https://www.trumpetstar.app';
const HREFLANG_LANGS: { lang: string; href: string }[] = [
  { lang: 'de', href: BASE_URL + '/' },
  { lang: 'en', href: BASE_URL + '/' },
  { lang: 'es', href: BASE_URL + '/' },
  { lang: 'sl', href: BASE_URL + '/' },
  { lang: 'x-default', href: BASE_URL + '/' },
];

export function SEOPageLayout({ children, title, description }: SEOPageLayoutProps) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Inject hreflang + update document title/meta description
  useEffect(() => {
    // Remove existing hreflang tags added by us
    document.querySelectorAll('link[data-hreflang="trumpetstar"]').forEach(el => el.remove());

    // Add new hreflang tags
    HREFLANG_LANGS.forEach(({ lang, href }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', lang);
      link.href = href;
      link.setAttribute('data-hreflang', 'trumpetstar');
      document.head.appendChild(link);
    });

    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    return () => {
      // Cleanup on unmount
      document.querySelectorAll('link[data-hreflang="trumpetstar"]').forEach(el => el.remove());
    };
  }, [title, description]);

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={user ? '/app' : '/'} className="flex items-center gap-2">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/trompete-lernen">{t('auth.navLearn')}</Link>
            </Button>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
              <Link to="/pricing">{t('auth.navPricing')}</Link>
            </Button>
            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 text-xs cursor-pointer backdrop-blur-sm hover:bg-white/20 transition-colors"
              title="Select language"
            >
              <option value="de">🇩🇪 DE</option>
              <option value="en">🇬🇧 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="sl">🇸🇮 SL</option>
            </select>
            {user ? (
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border border-white/20" asChild>
                <Link to="/app">{t('auth.toApp')}</Link>
              </Button>
            ) : (
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border border-white/20" asChild>
                <Link to="/login">{t('auth.login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img src={trumpetstarLogo} alt="Trumpetstar" className="h-6 w-auto mb-3" />
              <p className="text-sm text-white/60">
                {t('auth.footerTagline')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('auth.footerLearnTitle')}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/trompete-lernen" className="hover:text-white transition-colors">{t('auth.footerLinkLearn')}</Link></li>
                <li><Link to="/trompete-lernen-kinder" className="hover:text-white transition-colors">{t('auth.footerLinkKids')}</Link></li>
                <li><Link to="/trompete-lernen-erwachsene" className="hover:text-white transition-colors">{t('auth.footerLinkAdults')}</Link></li>
                <li><Link to="/trompete-ansatz-atmung" className="hover:text-white transition-colors">{t('auth.footerLinkEmbouchure')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('auth.footerHelpTitle')}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/trompete-erster-ton" className="hover:text-white transition-colors">{t('auth.footerLinkFirstNote')}</Link></li>
                <li><Link to="/hilfe/trompete-kein-ton" className="hover:text-white transition-colors">{t('auth.footerLinkNoSound')}</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">{t('auth.footerLinkPricing')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Trumpetstar. {t('auth.footerCopyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
