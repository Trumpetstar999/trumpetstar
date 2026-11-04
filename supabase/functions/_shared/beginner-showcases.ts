export const BEGINNER_SHOWCASES = {
  de: ['11436499', '11332971'],
  en: ['12143230'],
  es: ['12198352'],
  sl: ['12143230'],
} as const;

export function beginnerShowcases(language: keyof typeof BEGINNER_SHOWCASES): readonly string[] {
  return BEGINNER_SHOWCASES[language];
}