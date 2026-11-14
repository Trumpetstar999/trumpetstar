/** Readable title for learners; raw titles stay unchanged for search, IDs and files. */
export function displayTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.trim()
    .replace(/\.(m4v|mp4|mov|webm|mp3|m4a|wav|pdf)$/i, '')
    .replace(/Werbnung/g, 'Werbung');
  if (/_/.test(t)) {
    t = t.replace(/^\d+_/, '').replace(/_/g, ' ');
    t = t.replace(/\bc(\d)\b/gi, (_, n) => `c${n === '1' ? '¹' : n === '2' ? '²' : n}`);
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t.replace(/\s{2,}/g, ' ').trim();
}
