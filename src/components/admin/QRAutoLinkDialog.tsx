import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Suggestion {
  qr_id: string;
  qr_code: string;
  qr_label: string | null;
  content_type: string;
  current_id: string | null;
  current_title: string | null;
  suggested_id: string | null;
  suggested_title: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'legacy' | 'ai' | 'exact-title' | 'none';
  reason: string;
}

interface Props {
  onApplied: () => void;
}

export function QRAutoLinkDialog({ onApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const progressTimer = useRef<number | null>(null);

  // Simulated progress while waiting for the edge function (which is a single blocking call)
  const startProgress = () => {
    setProgress(2);
    setProgressLabel('Lade QR-Codes & Inhalte...');
    let p = 2;
    // Estimated total ~60s; advance asymptotically toward 90% then wait for response
    progressTimer.current = window.setInterval(() => {
      // Slow down as we approach 90
      const step = p < 30 ? 1.5 : p < 60 ? 0.8 : p < 85 ? 0.3 : 0.1;
      p = Math.min(90, p + step);
      setProgress(p);
      if (p < 15) setProgressLabel('Lade QR-Codes & Inhalte...');
      else if (p < 35) setProgressLabel('Wende Legacy-Mapping an...');
      else if (p < 60) setProgressLabel('Suche exakte Titel-Treffer...');
      else if (p < 88) setProgressLabel('KI analysiert verbleibende Codes...');
      else setProgressLabel('Fast fertig...');
    }, 500);
  };

  const stopProgress = (final = 100) => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setProgress(final);
  };

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const runAnalysis = async () => {
    setOpen(true);
    setLoading(true);
    setSuggestions([]);
    startProgress();
    try {
      const { data, error } = await supabase.functions.invoke('qr-auto-link', { body: { mode: 'suggest' } });
      if (error) throw error;
      const sugs = (data?.suggestions || []) as Suggestion[];
      setSuggestions(sugs);
      // Pre-select all "high confidence" suggestions where the suggested_id differs from current
      const auto = new Set<string>();
      sugs.forEach(s => {
        if (s.suggested_id && s.suggested_id !== s.current_id && s.confidence === 'high') {
          auto.add(s.qr_id);
        }
      });
      setSelected(auto);
      stopProgress(100);
      setProgressLabel('Analyse abgeschlossen');
      toast.success(`${sugs.length} QR-Codes analysiert`);
    } catch (e: any) {
      stopProgress(0);
      toast.error('Analyse fehlgeschlagen: ' + (e?.message || 'Unbekannt'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const apply = async () => {
    if (selected.size === 0) {
      toast.error('Keine Vorschläge ausgewählt');
      return;
    }
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('qr-auto-link', {
        body: { mode: 'apply', applyIds: Array.from(selected) },
      });
      if (error) throw error;
      toast.success(`${data?.applied || 0} QR-Codes verknüpft`);
      setOpen(false);
      onApplied();
    } catch (e: any) {
      toast.error('Anwenden fehlgeschlagen: ' + (e?.message || 'Unbekannt'));
    } finally {
      setApplying(false);
    }
  };

  const proposals = suggestions.filter(s => s.suggested_id && s.suggested_id !== s.current_id);
  const noChange = suggestions.filter(s => s.suggested_id && s.suggested_id === s.current_id);
  const noMatch = suggestions.filter(s => !s.suggested_id);

  const confBadge = (s: Suggestion) => {
    const map = {
      high: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Sicher' },
      medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Möglich' },
      low: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Unsicher' },
      none: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Kein Match' },
    } as const;
    const c = map[s.confidence];
    return <Badge variant="outline" className={c.color}>{c.label}</Badge>;
  };

  const sourceBadge = (s: Suggestion) => {
    const map: Record<string, string> = {
      legacy: '🗂️ Legacy',
      'exact-title': '📝 Titel',
      ai: '🤖 KI',
      none: '—',
    };
    return <span className="text-xs text-slate-500">{map[s.source]}</span>;
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={runAnalysis} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
        KI-Verknüpfung
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              KI-gestützte QR-Code-Verknüpfung
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-slate-600">Analysiere QR-Codes mit Legacy-Mapping & KI...</p>
              <p className="text-xs text-slate-400">Kann bei vielen Codes 30–60 Sekunden dauern.</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Keine Daten geladen.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm py-2 border-b border-slate-200">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> {proposals.length} Vorschläge
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <CheckCircle2 className="w-4 h-4" /> {noChange.length} bereits korrekt
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <XCircle className="w-4 h-4" /> {noMatch.length} kein Match
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {proposals.length > 0 && (
                  <>
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
                      <h4 className="font-semibold text-slate-900">Änderungsvorschläge ({proposals.length})</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(proposals.map(s => s.qr_id)))}>
                          Alle auswählen
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                          Keine
                        </Button>
                      </div>
                    </div>
                    {proposals.map(s => (
                      <div key={s.qr_id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <Checkbox
                          checked={selected.has(s.qr_id)}
                          onCheckedChange={() => toggle(s.qr_id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{s.qr_code}</code>
                            {confBadge(s)}
                            {sourceBadge(s)}
                            <span className="text-xs text-slate-400">{s.content_type}</span>
                          </div>
                          {s.qr_label && <div className="text-sm text-slate-700 mb-1">📌 {s.qr_label}</div>}
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-500">
                              <span className="font-medium">Aktuell:</span> {s.current_title || <em className="text-slate-400">– nicht verknüpft –</em>}
                            </div>
                            <div className="text-emerald-700">
                              <span className="font-medium">→ Neu:</span> {s.suggested_title}
                            </div>
                            <div className="text-slate-400 italic">{s.reason}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {noMatch.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700 py-2">
                      Kein Match gefunden ({noMatch.length})
                    </summary>
                    <div className="space-y-1 mt-2">
                      {noMatch.map(s => (
                        <div key={s.qr_id} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                          <code className="font-mono bg-white px-1.5 py-0.5 rounded">{s.qr_code}</code>
                          <span className="text-slate-600">{s.qr_label || '—'}</span>
                          <span className="text-slate-400 ml-auto">{s.reason}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <DialogFooter className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-slate-600">
                    {selected.size} von {proposals.length} ausgewählt
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={applying}>
                      Abbrechen
                    </Button>
                    <Button onClick={apply} disabled={applying || selected.size === 0}>
                      {applying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      {selected.size} verknüpfen
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
