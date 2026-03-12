import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, CheckCircle, Loader2, Pencil } from 'lucide-react';
import { useInvoice, useUpdateInvoiceStatus, useFinalizeInvoice } from '@/hooks/useInvoices';
import { printInvoice } from '@/lib/invoice-print';
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

const STATUS_COLORS: Record<Invoice['status'], string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
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

  if (!invoiceId) return null;

  return (
    <Dialog open={!!invoiceId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Lade...' : `Rechnung ${invoice?.invoice_number}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {invoice && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kunde</p>
                <p className="font-semibold">{invoice.customer?.company_name || invoice.customer?.name}</p>
                {invoice.customer?.company_name && (
                  <p className="text-muted-foreground">{invoice.customer.name}</p>
                )}
                <p className="text-muted-foreground">{invoice.customer?.street}</p>
                <p className="text-muted-foreground">{invoice.customer?.postal_code} {invoice.customer?.city}, {invoice.customer?.country}</p>
                {invoice.customer?.uid_number && (
                  <p className="text-xs mt-1">UID: {invoice.customer.uid_number}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rechnungsdatum</span>
                  <span>{formatDate(invoice.invoice_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fälligkeitsdatum</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USt-Satz</span>
                  <span>{invoice.vat_rate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[invoice.status]}`}>
                    {STATUS_LABELS[invoice.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 font-medium text-muted-foreground">Beschreibung</th>
                  <th className="text-center pb-2 font-medium text-muted-foreground">Menge</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Preis</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right">EUR {formatCurrency(item.unit_price_gross)}</td>
                    <td className="py-2 text-right font-medium">EUR {formatCurrency(item.line_total_gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              {invoice.vat_rate > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Zwischensumme (netto)</span>
                    <span>EUR {formatCurrency(invoice.subtotal_net)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>USt. {invoice.vat_rate}%</span>
                    <span>EUR {formatCurrency(invoice.vat_amount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>Gesamt</span>
                <span>EUR {formatCurrency(invoice.total_gross)}</span>
              </div>
            </div>

            {invoice.notes && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">{invoice.notes}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printInvoice(invoice as any)}
                className="gap-1.5"
              >
                <Printer className="w-4 h-4" />
                PDF drucken
              </Button>

              {invoice.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => finalizeInvoice.mutate(invoice.id!)}
                  disabled={finalizeInvoice.isPending}
                  className="gap-1.5"
                >
                  {finalizeInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Finalisieren & Lager buchen
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={invoice.status}
                  onValueChange={(v) =>
                    updateStatus.mutate({ id: invoice.id!, status: v as Invoice['status'] })
                  }
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
