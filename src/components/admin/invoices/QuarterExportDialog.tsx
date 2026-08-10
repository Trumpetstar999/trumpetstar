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

  const selectCls =
    'mt-1 w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition disabled:opacity-60';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-w-lg bg-white border border-gray-200 shadow-xl p-0 rounded-xl [&>button:last-child]:hidden">
        <VisuallyHidden>
          <DialogTitle>Quartals-Export für die Buchhaltung</DialogTitle>
          <DialogDescription>Alle Rechnungen des Quartals als ZIP mit Belegen und Excel-Übersicht.</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FileArchive className="w-4 h-4 text-blue-600" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quartals-Export</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ZIP mit Belegen (PDF) und Excel-Übersicht für die Buchhaltung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !busy && onOpenChange(false)}
            disabled={busy}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">Jahr</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={busy}
                className={selectCls}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Quartal</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
                disabled={busy}
                className={selectCls}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>Q{q}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Zeitraum: <span className="font-medium text-gray-700">{range.from}</span> bis{' '}
              <span className="font-medium text-gray-700">{range.to}</span>
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                disabled={busy}
                className="w-4 h-4 accent-blue-600"
              />
              Entwürfe einbeziehen
            </label>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            {loadingPreview ? (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Lade Rechnungen…
              </span>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {preview?.length ?? 0} Rechnungen im Zeitraum
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Netto', value: totals.net },
                    { label: 'USt', value: totals.vat },
                    { label: 'Brutto', value: totals.gross },
                  ].map((row) => (
                    <div key={row.label} className="rounded-md bg-white border border-gray-200 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        EUR {formatCurrency(row.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {busy && (
            <p className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" /> {progress}
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="px-4 h-9 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={busy || loadingPreview || (preview?.length ?? 0) === 0}
              className="px-4 h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              ZIP herunterladen
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
