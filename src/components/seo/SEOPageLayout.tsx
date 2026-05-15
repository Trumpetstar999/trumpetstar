import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/hooks/useLanguage';


interface ArticleSchema {
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  image?: string;
}

interface SEOPageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Path part of the canonical URL, e.g. "/blog/erster-ton-trompete". Defaults to current pathname. */
  canonicalPath?: string;
  /** When set, an Article JSON-LD block is injected for the page. */
  article?: ArticleSchema;
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

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'content') el!.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  if (attrs.content !== undefined) el.setAttribute('content', attrs.content);
}

export function SEOPageLayout({ children, title, description, canonicalPath, article }: SEOPageLayoutProps) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    // hreflang
    document.querySelectorAll('link[data-hreflang="trumpetstar"]').forEach(el => el.remove());
    HREFLANG_LANGS.forEach(({ lang, href }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', lang);
      link.href = href;
      link.setAttribute('data-hreflang', 'trumpetstar');
      document.head.appendChild(link);
    });

    // Title + description
    if (title) document.title = title;
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
    }

    // Canonical
    const path = canonicalPath ?? window.location.pathname;
    const canonicalHref = BASE_URL + path;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

    // Open Graph (per-page)
    if (title) upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    if (description) upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalHref });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: article ? 'article' : 'website' });

    // Twitter
    if (title) upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    if (description) upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    // Article JSON-LD
    let articleScript: HTMLScriptElement | null = null;
    if (article) {
      articleScript = document.createElement('script');
      articleScript.type = 'application/ld+json';
      articleScript.id = 'article-schema';
      const existing = document.getElementById('article-schema');
      if (existing) existing.remove();
      articleScript.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.headline,
        description: article.description,
        datePublished: article.datePublished,
        dateModified: article.dateModified ?? article.datePublished,
        author: { '@type': 'Person', name: article.author ?? 'Trumpetstar' },
        publisher: {
          '@type': 'Organization',
          name: 'Trumpetstar',
          logo: { '@type': 'ImageObject', url: BASE_URL + '/logo.png' },
        },
        mainEntityOfPage: canonicalHref,
        image: article.image,
      });
      document.head.appendChild(articleScript);
    }

    return () => {
      document.querySelectorAll('link[data-hreflang="trumpetstar"]').forEach(el => el.remove());
      const a = document.getElementById('article-schema');
      if (a) a.remove();
    };
  }, [title, description, canonicalPath, article]);

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
              className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 text-xs cursor-pointer hover:bg-white/20 transition-colors"
              style={{ WebkitAppearance: 'none', appearance: 'none' }}
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
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span>© {new Date().getFullYear()} Trumpetstar. {t('auth.footerCopyright')}</span>
            <div className="flex items-center gap-4">
              <Link to="/impressum" className="hover:text-white/60 transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="hover:text-white/60 transition-colors">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
