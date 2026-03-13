import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, CheckCircle, Loader2, Pencil, Download, X, Building2, Calendar, Hash, CreditCard } from 'lucide-react';
import { useInvoice, useUpdateInvoiceStatus, useFinalizeInvoice } from '@/hooks/useInvoices';
import { printInvoice, downloadInvoice } from '@/lib/invoice-print';
import { formatCurrency, formatDate } from '@/lib/vat';
import type { Invoice } from '@/types/invoice';
import { InvoiceEditDialog } from './InvoiceEditDialog';

const STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  viewed: 'Gesehen',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
};

const STATUS_COLORS: Record<Invoice['status'], { bg: string; text: string; dot: string }> = {
  draft:     { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  sent:      { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  viewed:    { bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-500' },
  paid:      { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  overdue:   { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500' },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
};

interface Props {
  invoiceId: string | null;
  onClose: () => void;
}

export function InvoiceDetailDialog({ invoiceId, onClose }: Props) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const updateStatus = useUpdateInvoiceStatus();
  const finalizeInvoice = useFinalizeInvoice();
  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!invoiceId) return null;

  const statusStyle = invoice ? STATUS_COLORS[invoice.status] : STATUS_COLORS.draft;
  const remaining = invoice ? invoice.total_gross - invoice.paid_amount : 0;

  async function handlePrint() {
    if (!invoice) return;
    setPrinting(true);
    await printInvoice(invoice as any);
    setPrinting(false);
  }

  async function handleDownload() {
    if (!invoice) return;
    setDownloading(true);
    await downloadInvoice(invoice as any);
    setDownloading(false);
  }

  return (
    <Dialog open={!!invoiceId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-white border-0 shadow-2xl p-0 rounded-2xl [&>button:last-child]:hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-t-2xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Rechnung</p>
              <h2 className="text-2xl font-bold tracking-tight">
                {isLoading ? '...' : invoice?.invoice_number}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {invoice && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {STATUS_LABELS[invoice.status]}
                </span>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {invoice && (
          <div className="px-6 py-5 space-y-6">

            {/* ── Kunde + Metadaten ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Kunde */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kunde</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">
                  {invoice.customer?.company_name || invoice.customer?.name}
                </p>
                {invoice.customer?.company_name && (
                  <p className="text-slate-500 text-xs mt-0.5">{invoice.customer.name}</p>
                )}
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  {invoice.customer?.street}<br />
                  {invoice.customer?.postal_code} {invoice.customer?.city}<br />
                  {invoice.customer?.country === 'AT' ? 'Österreich' : 'Deutschland'}
                </p>
                {invoice.customer?.uid_number && (
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">UID: {invoice.customer.uid_number}</p>
                )}
              </div>

              {/* Metadaten */}
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Rechnungsdatum</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(invoice.invoice_date)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Fälligkeitsdatum</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                    <Hash className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">USt-Satz</p>
                    <p className="text-sm font-medium text-slate-800">
                      {invoice.vat_rate > 0 ? `${invoice.vat_rate}%` : 'Reverse Charge'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Positionen ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Beschreibung</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Menge</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Preis</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.length ? invoice.items.map((item, i) => (
                    <tr key={item.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
                      <td className="px-4 py-3 text-slate-800 font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right text-slate-600">EUR {formatCurrency(item.unit_price_gross)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">EUR {formatCurrency(item.line_total_gross)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm italic">Keine Positionen</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Summen ── */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              {invoice.vat_rate > 0 && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Zwischensumme (netto)</span>
                    <span>EUR {formatCurrency(invoice.subtotal_net)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>USt. {invoice.vat_rate}%</span>
                    <span>EUR {formatCurrency(invoice.vat_amount)}</span>
                  </div>
                  <div className="border-t border-slate-200 my-1" />
                </>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900">
                <span>Gesamt</span>
                <span>EUR {formatCurrency(invoice.total_gross)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <>
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>Bezahlt</span>
                    <span>− EUR {formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Noch offen</span>
                    <span className={remaining > 0 ? 'text-red-600' : 'text-emerald-600'}>
                      EUR {formatCurrency(remaining)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {invoice.notes && (
              <p className="text-sm text-slate-500 italic bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                💬 {invoice.notes}
              </p>
            )}

            {/* ── Aktionen ── */}
            <div className="space-y-3 pt-1">
              {/* Primäre Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Bearbeiten
                </button>
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  PDF drucken
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Herunterladen
                </button>
              </div>

              {/* Sekundäre Aktionen */}
              <div className="flex items-center gap-3">
                {invoice.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => finalizeInvoice.mutate(invoice.id!)}
                    disabled={finalizeInvoice.isPending}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {finalizeInvoice.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle className="w-4 h-4" />}
                    Finalisieren & Lager buchen
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">Status:</span>
                  <Select
                    value={invoice.status}
                    onValueChange={(v) => updateStatus.mutate({ id: invoice.id!, status: v as Invoice['status'] })}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs border-slate-200 bg-white text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>
        )}
      </DialogContent>

      <InvoiceEditDialog
        invoiceId={editOpen ? invoiceId : null}
        onClose={() => setEditOpen(false)}
      />
    </Dialog>
  );
}
