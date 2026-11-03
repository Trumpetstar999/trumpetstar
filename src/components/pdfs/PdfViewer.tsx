import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PanelLeft, Search, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize, Hand, Pencil, Highlighter, Signature, Eraser, Undo2, Redo2, Trash2, Save, Printer, Loader2, Play, Pause, SkipBack, SkipForward, Music, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PDF_COPY } from '@/i18n/pdf-viewer';
import { buildCurrentPagePrint, clampPage, findTextMatches, EMPTY_MARKS, type PageMarks, type MarkTool, type InkColor } from '@/lib/pdf-viewer';
import { PdfThumbnail } from './PdfThumbnail';
import { PdfInk } from './PdfInk';

interface AudioTrack { id: string; title: string; audio_url: string; page_number: number; duration: number | null }
interface PdfViewerProps {
  pdf: { id: string; title: string; pdf_file_url: string; page_count: number };
  pdfBlobUrl: string; pdfBlob?: Blob | null; currentPage: number; onPageChange: (page: number) => void;
  audioTracks: AudioTrack[]; onClose: () => void; onRetry?: () => void;
}
interface SearchHit { page: number; snippet: string }
interface TextBox { text: string; left: number; top: number; width: number; height: number }

export function PdfViewer({ pdf, pdfBlobUrl, pdfBlob, currentPage, onPageChange, audioTracks, onClose, onRetry }: PdfViewerProps) {
  const { language } = useLanguage(); const copy = PDF_COPY[language]; const { user } = useAuth();
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 900);
  const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]); const [hitIndex, setHitIndex] = useState(0); const [searching, setSearching] = useState(false);
  const [boxes, setBoxes] = useState<TextBox[]>([]);
  const [tool, setTool] = useState<MarkTool | 'hand'>('hand'); const [color, setColor] = useState<InkColor>('ink'); const [width, setWidth] = useState(4);
  const [marks, setMarks] = useState<Record<number, PageMarks>>({});
  const marksRef = useRef(marks); marksRef.current = marks;
  const [dirty, setDirty] = useState<Set<number>>(new Set()); const [saving, setSaving] = useState(false); const [annotationsReady, setAnnotationsReady] = useState(false);
  const [history, setHistory] = useState<Record<number, PageMarks[]>>({}); const [future, setFuture] = useState<Record<number, PageMarks[]>>({});
  const [size, setSize] = useState({ width: 600, height: 800 }); const [area, setArea] = useState({ width: 800, height: 900 }); const [scale, setScale] = useState(1);
  const areaRef = useRef<HTMLDivElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const inkRef = useRef<HTMLCanvasElement>(null); const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const textCache = useRef(new Map<number, string>());
  const pageCount = doc?.numPages || pdf.page_count;
  const pageMarks = marks[currentPage] || EMPTY_MARKS;
  const changePage = useCallback((page: number) => { onPageChange(clampPage(page, pageCount)); }, [onPageChange, pageCount]);
  const close = useCallback(() => { if (dirty.size && !window.confirm(copy.discard)) return; onClose(); }, [dirty, copy.discard, onClose]);

  useEffect(() => {
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; };
  }, []);
  useEffect(() => {
    const el = areaRef.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => setArea({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false; let task: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined;
    setLoading(true); setError(false); textCache.current.clear();
    void (async () => {
      try {
        let buffer: ArrayBuffer;
        if (pdfBlob) buffer = await pdfBlob.arrayBuffer();
        else { const response = await fetch(pdfBlobUrl); if (!response.ok) throw new Error(); buffer = await response.arrayBuffer(); }
        const bytes = new Uint8Array(buffer);
        if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('Invalid PDF');
        const lib = await import('pdfjs-dist'); if (cancelled) return;
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        task = lib.getDocument({ data: bytes }); const loaded = await task.promise;
        if (!cancelled) { setDoc(loaded); onPageChange(clampPage(currentPage, loaded.numPages)); }
      } catch { if (!cancelled) { setError(true); setLoading(false); } }
    })();
    return () => { cancelled = true; void task?.destroy(); };
  }, [pdfBlob, pdfBlobUrl]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false; setAnnotationsReady(false);
    void supabase.from('pdf_user_annotations').select('page_number,annotations_json').eq('pdf_document_id', pdf.id).eq('user_id', user.id).then(({ data, error: loadError }) => {
      if (cancelled) return;
      if (loadError) { toast.error(copy.annotationError); return; }
      const loaded: Record<number, PageMarks> = {};
      for (const row of data || []) {
        const raw = row.annotations_json as unknown as PageMarks;
        loaded[row.page_number] = { strokes: Array.isArray(raw?.strokes) ? raw.strokes : [], ...(typeof raw?.imageData === 'string' ? { imageData: raw.imageData } : {}) };
      }
      setMarks(loaded); setAnnotationsReady(true);
    });
    return () => { cancelled = true; };
  }, [pdf.id, user?.id]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false; let render: RenderTask | undefined;
    setLoading(true); setBoxes([]);
    void (async () => {
      try {
        const page = await doc.getPage(currentPage); if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 }); setSize({ width: viewport.width, height: viewport.height });
        const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
        const display = page.getViewport({ scale: Math.min(1800 / viewport.width, 2.5) });
        canvas.width = Math.ceil(display.width); canvas.height = Math.ceil(display.height);
        render = page.render({ canvasContext: ctx, viewport: display }); await render.promise;
        if (cancelled) return;
        const content = await page.getTextContent(); const lib = await import('pdfjs-dist');
        const textBoxes: TextBox[] = [];
        for (const item of content.items) {
          if (!('str' in item)) continue;
          const t = lib.Util.transform(viewport.transform, item.transform);
          const height = Math.hypot(t[2], t[3]);
          textBoxes.push({ text: item.str, left: t[4] / viewport.width * 100, top: (t[5] - height) / viewport.height * 100, width: item.width / viewport.width * 100, height: height / viewport.height * 100 });
        }
        textCache.current.set(currentPage, content.items.map(i => 'str' in i ? i.str : '').join(' '));
        if (!cancelled) { setBoxes(textBoxes); setLoading(false); }
      } catch { if (!cancelled) { setError(true); setLoading(false); } }
    })();
    return () => { cancelled = true; render?.cancel(); };
  }, [doc, currentPage]);
  useEffect(() => { transformRef.current?.resetTransform(0); setScale(1); }, [currentPage, area.width, area.height]);

  useEffect(() => {
    if (!doc || !query.trim()) { setHits([]); setSearching(false); return; }
    let cancelled = false; setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const results: SearchHit[] = [];
          for (let n = 1; n <= doc.numPages; n++) {
            if (cancelled) return;
            let text = textCache.current.get(n);
            if (text === undefined) { const page = await doc.getPage(n); const content = await page.getTextContent(); text = content.items.map(i => 'str' in i ? i.str : '').join(' '); textCache.current.set(n, text); }
            for (const at of findTextMatches(text, query)) results.push({ page: n, snippet: text.slice(Math.max(0, at - 25), at + query.trim().length + 45) });
          }
          if (!cancelled) { setHits(results); setHitIndex(0); setSearching(false); if (results[0]) changePage(results[0].page); }
        } catch { if (!cancelled) { setSearching(false); toast.error(copy.searchError); } }
      })();
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [doc, query]);

  const commit = (next: PageMarks) => {
    setHistory(h => ({ ...h, [currentPage]: [...(h[currentPage] || []), pageMarks].slice(-40) }));
    setFuture(f => ({ ...f, [currentPage]: [] })); setMarks(m => ({ ...m, [currentPage]: next }));
    setDirty(d => new Set(d).add(currentPage));
  };
  const undo = () => {
    const past = history[currentPage] || []; const previous = past.at(-1); if (!previous) return;
    setFuture(f => ({ ...f, [currentPage]: [...(f[currentPage] || []), pageMarks] }));
    setHistory(h => ({ ...h, [currentPage]: past.slice(0, -1) })); setMarks(m => ({ ...m, [currentPage]: previous })); setDirty(d => new Set(d).add(currentPage));
  };
  const redo = () => {
    const stack = future[currentPage] || []; const next = stack.at(-1); if (!next) return;
    setHistory(h => ({ ...h, [currentPage]: [...(h[currentPage] || []), pageMarks] })); setFuture(f => ({ ...f, [currentPage]: stack.slice(0, -1) })); setMarks(m => ({ ...m, [currentPage]: next })); setDirty(d => new Set(d).add(currentPage));
  };
  const save = useCallback(async () => {
    if (!user || !annotationsReady || saving) return;
    setSaving(true); const snapshot = marksRef.current; const pending = [...dirty];
    try {
      for (const n of pending) {
        const page = snapshot[n] || EMPTY_MARKS;
        const { error: saveError } = await supabase.from('pdf_user_annotations').upsert({ user_id: user.id, pdf_document_id: pdf.id, page_number: n, annotations_json: JSON.parse(JSON.stringify(page)), updated_at: new Date().toISOString() }, { onConflict: 'pdf_document_id,user_id,page_number' });
        if (saveError) throw saveError;
        setDirty(d => { const next = new Set(d); if (marksRef.current[n] === snapshot[n]) next.delete(n); return next; });
      }
      toast.success(copy.saved);
    } catch { toast.error(copy.saveError); } finally { setSaving(false); }
  }, [user, annotationsReady, saving, dirty, pdf.id, copy]);
  const print = useCallback(() => {
    const page = canvasRef.current; if (!page || loading || error) return;
    const merged = document.createElement('canvas'); merged.width = page.width; merged.height = page.height;
    const ctx = merged.getContext('2d'); if (!ctx) return;
    ctx.drawImage(page, 0, 0); if (inkRef.current) ctx.drawImage(inkRef.current, 0, 0, page.width, page.height);
    document.getElementById('pdf-print-frame')?.remove();
    const frame = document.createElement('iframe'); frame.id = 'pdf-print-frame'; frame.className = 'pdf-print-frame'; frame.title = copy.print;
    frame.onload = () => {
      const img = frame.contentDocument?.querySelector('img');
      const run = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); };
      frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true });
      if (img?.complete) run(); else img?.addEventListener('load', run, { once: true });
    };
    frame.srcdoc = buildCurrentPagePrint(merged.toDataURL('image/png'), page.width, page.height); document.body.appendChild(frame);
  }, [loading, error, copy.print]);
  const selectHit = (index: number) => { if (!hits.length) return; const n = (index + hits.length) % hits.length; setHitIndex(n); changePage(hits[n].page); };

  const audioRef = useRef<HTMLAudioElement>(null);
  const tracks = audioTracks.filter(t => t.page_number === currentPage);
  const [trackId, setTrackId] = useState(''); const track = tracks.find(t => t.id === trackId) || tracks[0];
  const [audioUrl, setAudioUrl] = useState(''); const [playing, setPlaying] = useState(false); const [progress, setProgress] = useState(0); const [duration, setDuration] = useState(0); const [tempo, setTempo] = useState(100);
  useEffect(() => {
    let cancelled = false; setAudioUrl(''); setPlaying(false); setProgress(0);
    if (track) {
      const path = track.audio_url.split('/pdf-audio/').pop()?.split('?')[0];
      if (path) void supabase.storage.from('pdf-audio').createSignedUrl(decodeURIComponent(path), 3600).then(({ data }) => { if (!cancelled && data) setAudioUrl(data.signedUrl); });
    }
    return () => { cancelled = true; };
  }, [track?.id]);
  const play = async () => { const audio = audioRef.current; if (!audio) return; if (playing) { audio.pause(); setPlaying(false); } else { try { await audio.play(); setPlaying(true); } catch { setPlaying(false); } } };
  const seek = (n: number) => { if (audioRef.current) { audioRef.current.currentTime = Math.max(0, Math.min(duration, n)); setProgress(audioRef.current.currentTime); } };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.matches('input,textarea') || e.target.isContentEditable)) return;
      if (e.key === 'ArrowLeft') changePage(currentPage - 1);
      if (e.key === 'ArrowRight') changePage(currentPage + 1);
      if (e.key === 'Escape') close();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void save(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); print(); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [currentPage, changePage, close, save, print]);

  const fit = Math.max(0.1, Math.min((area.width - 40) / size.width, (area.height - 40) / size.height));
  const icon = (label: string, glyph: React.ReactNode, action: () => void, disabled = false, selected = false) => <Button size="icon" variant="ghost" aria-label={label} title={label} disabled={disabled} onClick={action} aria-pressed={selected || undefined} className={cn('shrink-0 text-muted-foreground', selected && 'bg-secondary text-primary')}>{glyph}</Button>;
  return <div className="pdf-workspace ts-light-module ts-system-font fixed inset-0 z-[100] flex flex-col" role="dialog" aria-modal="true" aria-label={pdf.title}>
    <header className="pdf-topbar flex shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      {icon(copy.pages, <PanelLeft />, () => setSidebar(s => !s), false, sidebar)}
      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{pdf.title}</h2>
      {icon(copy.search, <Search />, () => setSearchOpen(s => !s), !doc, searchOpen)}
      {icon(copy.print, <Printer />, print, loading || error)}
      {icon(copy.close, <X />, close)}
    </header>
    {searchOpen && <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input autoFocus aria-label={copy.search} placeholder={copy.search} value={query} onChange={e => setQuery(e.target.value)} className="h-9 min-w-0 flex-1 border-0 bg-muted shadow-none" />
      <span className="text-xs text-muted-foreground whitespace-nowrap" role="status">{searching ? copy.searching : query ? hits.length ? `${hitIndex + 1}/${hits.length}` : copy.noResults : ''}</span>
      {icon(copy.previousResult, <ChevronLeft />, () => selectHit(hitIndex - 1), !hits.length)}
      {icon(copy.nextResult, <ChevronRight />, () => selectHit(hitIndex + 1), !hits.length)}
    </div>}
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {sidebar && <aside aria-label={copy.pages} className="pdf-sidebar z-20 flex w-40 shrink-0 flex-col border-r border-border bg-background md:w-44">
        <div className="flex items-center justify-between px-3 py-2"><span className="text-xs font-semibold text-muted-foreground">{copy.pages}</span>{icon(copy.close, <X />, () => setSidebar(false))}</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">{doc && Array.from({ length: doc.numPages }, (_, i) => <PdfThumbnail key={i} doc={doc} page={i + 1} selected={i + 1 === currentPage} label={copy.page} onSelect={() => { changePage(i + 1); if (window.innerWidth < 640) setSidebar(false); }} />)}</div>
      </aside>}
      <div ref={areaRef} className="relative min-w-0 flex-1 overflow-hidden bg-muted/50">
        <TransformWrapper ref={transformRef} minScale={0.6} maxScale={5} centerOnInit centerZoomedOut limitToBounds panning={{ excluded: tool === 'hand' ? [] : ['pdf-mark-surface'] }} wheel={{ step: 0.002 }} doubleClick={{ disabled: tool !== 'hand', mode: 'toggle', step: 1 }} onTransform={(_, state) => setScale(state.scale)}>
          <TransformComponent wrapperClass="pdf-zoom-viewport" contentClass="pdf-zoom-content">
            <div className="pdf-paper relative shrink-0" style={{ width: size.width * fit, height: size.height * fit }}>
              <canvas ref={canvasRef} className="block h-full w-full" aria-label={`${copy.page} ${currentPage}`} />
              {query.trim() && boxes.filter(b => findTextMatches(b.text, query).length).map((b, i) => <div key={i} className="pdf-search-match pointer-events-none absolute" style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` }} />)}
              <PdfInk key={currentPage} marks={pageMarks} tool={tool} color={color} width={width} ratio={size.height / size.width} canvasRef={inkRef} onCommit={commit} disabled={loading || !annotationsReady || saving} />
            </div>
          </TransformComponent>
        </TransformWrapper>
        {loading && !error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="text-sm text-muted-foreground">{copy.loading}</span></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background px-6 text-center"><AlertCircle className="h-8 w-8 text-destructive" /><p>{copy.error}</p><Button onClick={() => onRetry ? onRetry() : close()}>{copy.retry}</Button></div>}
      </div>
    </div>
    <div className="pdf-markbar shrink-0 border-t border-border bg-card">
      <div className="flex items-center justify-center gap-1 overflow-x-auto px-2 py-1">
        {icon(copy.hand, <Hand />, () => setTool('hand'), false, tool === 'hand')}
        {icon(copy.pencil, <Pencil />, () => setTool('pencil'), !annotationsReady, tool === 'pencil')}
        {icon(copy.highlight, <Highlighter />, () => { setTool('highlight'); setColor('gold'); }, !annotationsReady, tool === 'highlight')}
        {icon(copy.signature, <Signature />, () => { setTool('signature'); setColor('ink'); setWidth(3); }, !annotationsReady, tool === 'signature')}
        {icon(copy.eraser, <Eraser />, () => setTool('eraser'), !annotationsReady, tool === 'eraser')}
        <span className="mx-1 h-6 w-px shrink-0 bg-border" />
        {icon(copy.undo, <Undo2 />, undo, !history[currentPage]?.length || saving)}
        {icon(copy.redo, <Redo2 />, redo, !future[currentPage]?.length || saving)}
        {icon(copy.clear, <Trash2 />, () => { if (window.confirm(copy.clearConfirm)) commit(EMPTY_MARKS); }, !annotationsReady || saving)}
        {icon(saving ? copy.saving : copy.save, saving ? <Loader2 className="animate-spin" /> : dirty.size ? <Save /> : <Check />, () => void save(), !dirty.size || saving)}
      </div>
      {tool !== 'hand' && <div className="flex items-center justify-center gap-3 border-t border-border/60 px-3 py-1">
        <div role="group" aria-label={copy.colors} className="flex gap-1">{(['ink', 'blue', 'red', 'green', 'gold'] as InkColor[]).map(c => <Button key={c} variant="ghost" size="icon" className="h-9 w-9" title={copy[c]} aria-label={copy[c]} aria-pressed={color === c} onClick={() => setColor(c)}><span className={cn('pdf-swatch', `pdf-swatch-${c}`, color === c && 'ring-2 ring-primary ring-offset-2 ring-offset-card')} /></Button>)}</div>
        <Slider aria-label={copy.width} value={[width]} min={2} max={12} step={1} onValueChange={([value]) => setWidth(value)} className="w-24" />
      </div>}
    </div>
    <footer className="pdf-footer shrink-0 border-t border-border bg-card px-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">{icon(copy.previous, <ChevronLeft />, () => changePage(currentPage - 1), currentPage <= 1)}
          <Input aria-label={copy.page} type="number" min={1} max={pageCount} key={currentPage} defaultValue={currentPage} onBlur={e => changePage(Number(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} className="h-8 w-14 text-center tabular-nums" />
          <span className="text-xs tabular-nums text-muted-foreground">/ {pageCount}</span>{icon(copy.next, <ChevronRight />, () => changePage(currentPage + 1), currentPage >= pageCount)}
        </div>
        <span className="hidden text-xs text-muted-foreground md:block" role="status">{dirty.size ? copy.unsaved : annotationsReady ? copy.saved : ''}</span>
        <div className="flex items-center gap-0">{icon(copy.zoomOut, <ZoomOut />, () => transformRef.current?.zoomOut(0.25), !doc)}<span className="w-11 text-center text-xs tabular-nums text-muted-foreground">{Math.round(scale * 100)}%</span>{icon(copy.zoomIn, <ZoomIn />, () => transformRef.current?.zoomIn(0.25), !doc)}{icon(copy.fit, <Maximize />, () => transformRef.current?.resetTransform(), !doc)}</div>
      </div>
      {audioUrl && track && <div className="flex flex-wrap items-center gap-2 border-t border-border py-2">
        <audio ref={audioRef} src={audioUrl} onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => { setDuration(audioRef.current?.duration || 0); if (audioRef.current) audioRef.current.playbackRate = tempo / 100; }} onEnded={() => setPlaying(false)} />
        {icon(playing ? copy.pause : copy.play, playing ? <Pause /> : <Play />, () => void play())}
        {icon(copy.back, <SkipBack />, () => seek(progress - 10))}
        <Slider aria-label={copy.seek} value={[progress]} min={0} max={duration || 1} step={0.1} onValueChange={([n]) => seek(n)} className="min-w-16 flex-1" />
        {icon(copy.forward, <SkipForward />, () => seek(progress + 10))}
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={copy.audio} title={track.title}><Music /></Button></DropdownMenuTrigger><DropdownMenuContent>{tracks.map(t => <DropdownMenuItem key={t.id} onClick={() => setTrackId(t.id)}>{t.title}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
        <span className="text-xs tabular-nums">{tempo}%</span><Slider aria-label={copy.tempo} value={[tempo]} min={50} max={150} step={5} onValueChange={([n]) => { setTempo(n); if (audioRef.current) audioRef.current.playbackRate = n / 100; }} className="w-20" />
      </div>}
    </footer>
  </div>;
}
