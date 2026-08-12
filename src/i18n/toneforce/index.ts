import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import { useLanguage } from "@/hooks/useLanguage";

type Dict = Record<string, unknown>;

const DICTS: Record<string, Dict> = { de, en, es };

function lookup(dict: Dict, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Dict)[part];
    return undefined;
  }, dict);
  return typeof value === "string" ? value : undefined;
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`,
  );
}

export type TfTranslate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Tone Force translations. Slovenian falls back to German (no SL source texts).
 */
export function useTfT(): TfTranslate {
  const { language } = useLanguage();
  const dict = DICTS[language] ?? DICTS.de;
  return (key, vars) => interpolate(lookup(dict, key) ?? lookup(DICTS.de, key) ?? key, vars);
}
