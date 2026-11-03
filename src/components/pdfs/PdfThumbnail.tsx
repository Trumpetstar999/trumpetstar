import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PdfThumbnail({ doc, page, selected, label, onSelect }: { doc: PDFDocumentProxy; page: number; selected: boolean; label: string; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '200px' });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false; let task: RenderTask | undefined;
    void doc.getPage(page).then(p => {
      const canvas = ref.current; if (!canvas || cancelled) return;
      const viewport = p.getViewport({ scale: 120 / p.getViewport({ scale: 1 }).width });
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      task = p.render({ canvasContext: ctx, viewport }); return task.promise;
    }).catch(() => { /* Main page exposes document errors. */ });
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, page, visible]);
  useEffect(() => { if (selected) root.current?.scrollIntoView({ block: 'nearest' }); }, [selected]);
  return <Button ref={root} variant="ghost" onClick={onSelect} aria-label={`${label} ${page}`} aria-current={selected ? 'page' : undefined} className={cn('h-auto w-full flex-col gap-2 rounded-lg p-3', selected && 'bg-secondary text-primary')}>
    <div className={cn('pdf-thumbnail-paper', selected && 'ring-2 ring-primary')}><canvas ref={ref} className="w-full" /></div>
    <span className="text-xs tabular-nums">{page}</span>
  </Button>;
}