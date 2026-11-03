export type InkColor = 'ink' | 'blue' | 'red' | 'green' | 'gold';
export type MarkTool = 'pencil' | 'highlight' | 'signature' | 'eraser';
export interface InkPoint { x: number; y: number; pressure: number }
export interface InkStroke { tool: MarkTool; color: InkColor; width: number; points: InkPoint[] }
export interface PageMarks { strokes: InkStroke[]; imageData?: string }
export const EMPTY_MARKS: PageMarks = { strokes: [] };
export function normalizePoint(x: number, y: number, width: number, height: number, pressure = 0.5): InkPoint {
  return { x: Math.max(0, Math.min(1, x / width)), y: Math.max(0, Math.min(1, y / height)), pressure: Math.max(0.1, Math.min(1, pressure || 0.5)) };
}
export function clampPage(page: number, count: number) { return Math.max(1, Math.min(count, Math.trunc(page) || 1)); }
export function findTextMatches(text: string, query: string): number[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const haystack = text.toLocaleLowerCase();
  const positions: number[] = [];
  for (let from = 0; from < haystack.length;) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    positions.push(at); from = at + needle.length;
  }
  return positions;
}
// This accepts only the already-rendered current page, never a document or page range.
export function buildCurrentPagePrint(image: string, width: number, height: number) {
  if (!image.startsWith('data:image/png;base64,')) throw new Error('Invalid print image');
  const orientation = width > height ? 'landscape' : 'portrait';
  return `<!doctype html><html><head><style>@page{size:A4 ${orientation};margin:0}*{box-sizing:border-box;margin:0}html,body{height:100%;overflow:hidden}img{display:block;width:100%;height:100%;object-fit:contain;break-inside:avoid}</style></head><body><img src="${image}" /></body></html>`;
}