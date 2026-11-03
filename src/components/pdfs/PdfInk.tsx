import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { normalizePoint, type PageMarks, type InkStroke, type InkColor, type MarkTool } from '@/lib/pdf-viewer';

export function paintStroke(ctx: CanvasRenderingContext2D, stroke: InkStroke, width: number, height: number, colors: Record<InkColor, string>) {
  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = stroke.tool === 'highlight' ? 0.28 : 1;
  ctx.strokeStyle = colors[stroke.color]; ctx.fillStyle = colors[stroke.color]; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const base = stroke.width * width / 1000;
  if (stroke.points.length === 1) {
    const p = stroke.points[0]; ctx.beginPath(); ctx.arc(p.x * width, p.y * height, base / 2, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1], b = stroke.points[i];
    ctx.lineWidth = base * (stroke.tool === 'pencil' || stroke.tool === 'signature' ? 0.5 + b.pressure : 1);
    ctx.beginPath(); ctx.moveTo(a.x * width, a.y * height); ctx.lineTo(b.x * width, b.y * height); ctx.stroke();
  }
  ctx.restore();
}

export function PdfInk({ marks, tool, color, width, ratio, canvasRef, onCommit, disabled }: {
  marks: PageMarks; tool: MarkTool | 'hand'; color: InkColor; width: number; ratio: number;
  canvasRef: React.RefObject<HTMLCanvasElement>; onCommit: (marks: PageMarks) => void; disabled: boolean;
}) {
  const stroke = useRef<InkStroke | null>(null);
  const pointers = useRef(new Set<number>());
  const snapshot = useRef<ImageData | null>(null);
  const colors = useRef<Record<InkColor, string>>({ ink: '', blue: '', red: '', green: '', gold: '' });
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
    let cancelled = false;
    canvas.width = 1400; canvas.height = Math.round(1400 * ratio);
    const style = getComputedStyle(canvas);
    for (const c of Object.keys(colors.current) as InkColor[]) colors.current[c] = style.getPropertyValue(`--pdf-ink-${c}`).trim();
    const draw = () => { for (const s of marks.strokes) paintStroke(ctx, s, canvas.width, canvas.height, colors.current); };
    if (marks.imageData) {
      const img = new Image(); img.onload = () => { if (!cancelled) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); draw(); } }; img.src = marks.imageData;
    } else draw();
    return () => { cancelled = true; stroke.current = null; pointers.current.clear(); };
  }, [marks, ratio, canvasRef]);
  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return normalizePoint(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, e.pointerType === 'pen' ? e.pressure : 0.5);
  };
  const cancel = () => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (ctx && snapshot.current) ctx.putImageData(snapshot.current, 0, 0);
    stroke.current = null; snapshot.current = null;
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'hand' || disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    pointers.current.add(e.pointerId);
    if (pointers.current.size > 1) { cancel(); return; }
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext('2d'); if (!ctx) return;
    snapshot.current = ctx.getImageData(0, 0, e.currentTarget.width, e.currentTarget.height);
    stroke.current = { tool, color, width: tool === 'highlight' ? width * 7 : tool === 'eraser' ? width * 9 : width, points: [point(e)] };
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const s = stroke.current; const ctx = e.currentTarget.getContext('2d'); if (!s || !ctx || pointers.current.size !== 1) return;
    s.points.push(point(e));
    if (snapshot.current) ctx.putImageData(snapshot.current, 0, 0);
    paintStroke(ctx, s, e.currentTarget.width, e.currentTarget.height, colors.current);
  };
  const end = (e: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (stroke.current) { const s = stroke.current; stroke.current = null; snapshot.current = null; onCommit({ ...marks, strokes: [...marks.strokes, s] }); }
  };
  return <canvas ref={canvasRef} aria-label={tool} className={`pdf-ink absolute inset-0 h-full w-full ${tool === 'hand' ? 'pointer-events-none' : 'pdf-mark-surface cursor-crosshair'}`} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={e => { pointers.current.delete(e.pointerId); cancel(); }} />;
}