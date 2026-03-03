import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/hooks/useLanguage';

const SUPPORTED_LANGS: Language[] = ['de', 'en', 'es', 'sl'];

/**
 * Reads ?lang=XX from the URL and sets the app language accordingly.
 * This allows external links to target a specific language:
 *   https://www.trumpetstar.app/?lang=en
 *   https://www.trumpetstar.app/?lang=sl
 */
export function LanguageDetector() {
  const [searchParams] = useSearchParams();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const langParam = searchParams.get('lang') as Language | null;
    if (langParam && SUPPORTED_LANGS.includes(langParam)) {
      setLanguage(langParam);
    }
  }, [searchParams, setLanguage]);

  return null;
}
