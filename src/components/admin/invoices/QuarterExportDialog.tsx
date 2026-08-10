import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/vat';
import {
  buildQuarterExport,
  fetchQuarterInvoices,
  quarterRange,
  triggerDownload,
  type FullInvoice,
} from '@/lib/accounting-export';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuarterExportDialog({ open, onOpenChange }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [preview, setPreview] = useState<FullInvoice[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) list.push(y);
    return list;
  }, [now]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPreview(true);
    fetchQuarterInvoices(year, quarter, includeDrafts)
      .then((data) => { if (!cancelled) setPreview(data); })
      .catch((e: Error) => { if (!cancelled) toast.error(e.message); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [open, year, quarter, includeDrafts]);

  const totals = useMemo(() => {
    const list = preview ?? [];
    return {
      net: list.reduce((s, i) => s + (Number(i.subtotal_net) || 0), 0),
      vat: list.reduce((s, i) => s + (Number(i.vat_amount) || 0), 0),
      gross: list.reduce((s, i) => s + (Number(i.total_gross) || 0), 0),
    };
  }, [preview]);

  const range = quarterRange(year, quarter);

  async function handleExport() {
    setProgress('Vorbereitung…');
    try {
      const { blob, filename, count } = await buildQuarterExport(
        year,
        quarter,
        { includeDrafts },
        (p) => setProgress(p.label)
      );
      triggerDownload(blob, filename);
      toast.success(`${count} Belege exportiert: ${filename}`);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileArchive className="w-5 h-5 text-blue-600" />
            Quartals-Export für die Buchhaltung
          </DialogTitle>
          <DialogDescription>
            Alle Rechnungen des Quartals als ZIP mit Belegen (PDF) und Excel-Übersicht.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jahr</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={busy}
                className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Quartal</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
                disabled={busy}
                className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>Q{q}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Zeitraum: {range.from} bis {range.to}
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeDrafts}
              onChange={(e) => setIncludeDrafts(e.target.checked)}
              disabled={busy}
              className="w-4 h-4 accent-blue-600"
            />
            Entwürfe mit einbeziehen
          </label>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {loadingPreview ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Lade Rechnungen…
              </span>
            ) : (
              <>
                <p className="font-medium">{preview?.length ?? 0} Rechnungen im Zeitraum</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Netto</p>
                    <p className="font-semibold">EUR {formatCurrency(totals.net)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">USt</p>
                    <p className="font-semibold">EUR {formatCurrency(totals.vat)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Brutto</p>
                    <p className="font-semibold">EUR {formatCurrency(totals.gross)}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {busy && (
            <p className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" /> {progress}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Abbrechen
            </Button>
            <Button
              onClick={handleExport}
              disabled={busy || loadingPreview || (preview?.length ?? 0) === 0}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              ZIP herunterladen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
