import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { LEGAL_COPY } from '@/i18n/legal';

export function LegalLinks() {
  const { language } = useLanguage();
  const copy = LEGAL_COPY[language];
  return <nav aria-label={copy.notice} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
    <Link className="py-2 underline underline-offset-4" to="/impressum">{copy.notice}</Link>
    <Link className="py-2 underline underline-offset-4" to="/datenschutz">{copy.privacy}</Link>
    <Link className="py-2 underline underline-offset-4" to="/datenschutz#settings">{copy.settings}</Link>
  </nav>;
}