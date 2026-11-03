export interface AppUpdate {
  id: string;
  created_at: string;
  title_i18n: Record<string, string>;
  body_i18n: Record<string, string>;
  link: string | null;
}

export const GUEST_READS_KEY = 'ts_read_updates';

export function countUnread(updates: Pick<AppUpdate, 'id'>[], readIds: Iterable<string>): number {
  const read = new Set(readIds);
  return updates.filter((u) => !read.has(u.id)).length;
}

/** Localized text with German, then any available language, as fallback. */
export function pickLocalized(map: Record<string, string> | null | undefined, lang: string): string {
  if (!map) return '';
  return map[lang] || map.de || Object.values(map).find(Boolean) || '';
}

export function readGuestIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_READS_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
