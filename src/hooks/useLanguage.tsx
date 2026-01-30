import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Import translation files
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';

export type Language = 'de' | 'en' | 'es';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

const translations: Record<Language, Translations> = { de, en, es };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  hasCompletedLanguageSetup: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  if (browserLang === 'de' || browserLang === 'en' || browserLang === 'es') {
    return browserLang as Language;
  }
  return 'de'; // Default to German
}

// Get nested value from object using dot notation
function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split('.');
  let current: TranslationValue | undefined = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as { [key: string]: TranslationValue })[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first for immediate UI
    const stored = localStorage.getItem('trumpetstar_language') as Language;
    if (stored && ['de', 'en', 'es'].includes(stored)) {
      return stored;
    }
    // Fall back to browser detection
    return detectBrowserLanguage();
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedLanguageSetup, setHasCompletedLanguageSetup] = useState(true); // Default true to avoid flash

  // Load user preference from database when authenticated
  useEffect(() => {
    async function loadUserLanguage() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.language && ['de', 'en', 'es'].includes(data.language)) {
          // User has a saved language preference - they've completed setup
          setLanguageState(data.language as Language);
          localStorage.setItem('trumpetstar_language', data.language);
          setHasCompletedLanguageSetup(true);
        } else {
          // No language preference exists - show language selection on first login
          setHasCompletedLanguageSetup(false);
        }
      } catch (error) {
        console.error('[useLanguage] Error loading language preference:', error);
        setHasCompletedLanguageSetup(true); // Default to true on error to avoid blocking
      } finally {
        setIsLoading(false);
      }
    }

    loadUserLanguage();
  }, [user]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('trumpetstar_language', lang);

    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: user.id, language: lang }, { onConflict: 'user_id' });
        // Mark setup as complete after saving
        setHasCompletedLanguageSetup(true);
      } catch (error) {
        console.error('[useLanguage] Error saving language preference:', error);
      }
    }
  }, [user]);

  // Translation function with interpolation support
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[language], key);
    
    // Fallback to German if key not found
    if (!translation) {
      translation = getNestedValue(translations.de, key);
    }
    
    // Return key if still not found
    if (!translation) {
      console.warn(`[i18n] Missing translation for key: ${key}`);
      return key;
    }

    // Handle pluralization (basic _other suffix)
    if (params?.count !== undefined) {
      const count = Number(params.count);
      if (count !== 1) {
        const pluralKey = `${key}_other`;
        const pluralTranslation = getNestedValue(translations[language], pluralKey);
        if (pluralTranslation) {
          translation = pluralTranslation;
        }
      }
    }

    // Interpolate parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }

    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading, hasCompletedLanguageSetup }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook to get localized content from database objects
export function useLocalizedContent() {
  const { language } = useLanguage();

  const getLocalizedField = useCallback(<T extends Record<string, any>>(
    item: T,
    fieldName: string
  ): string => {
    if (language === 'de') {
      return item[fieldName] || '';
    }
    
    const localizedFieldName = `${fieldName}_${language}`;
    return item[localizedFieldName] || item[fieldName] || '';
  }, [language]);

  return { getLocalizedField, language };
}
