import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Printer, Trash2, Search, Plus, FileText, Download } from 'lucide-react';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { printInvoice } from '@/lib/invoice-print';
import { formatCurrency, formatDate } from '@/lib/vat';
import type { Invoice, Customer } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Printer, Trash2, Search, Plus, FileText, Download } from 'lucide-react';
import { useInvoices, useDeleteInvoice } from '@/hooks/useInvoices';
import { printInvoice } from '@/lib/invoice-print';
import { formatCurrency, formatDate } from '@/lib/vat';
import type { Invoice, Customer } from '@/types/invoice';

function exportSteuerberaterCSV(invoices: (Invoice & { customer: Customer })[]) {
  const SEP = ';';
  const headers = [
    'Rechnungsnummer',
    'Rechnungsdatum',
    'Fälligkeitsdatum',
    'Status',
    'Kundenname',
    'Firmenname',
    'Straße',
    'PLZ',
    'Ort',
    'Land',
    'UID-Nummer',
    'Steuersatz (%)',
    'Nettobetrag (EUR)',
    'MwSt-Betrag (EUR)',
    'Bruttobetrag (EUR)',
    'Bezahlt (EUR)',
    'Offen (EUR)',
  ];

  const STATUS_DE: Record<string, string> = {
    draft: 'Entwurf',
    sent: 'Gesendet',
    viewed: 'Gesehen',
    paid: 'Bezahlt',
    overdue: 'Überfällig',
    cancelled: 'Storniert',
  };

  const rows = invoices
    .filter((inv) => inv.invoice_number) // only finalized invoices
    .map((inv) => {
      const offen = Math.max(0, Number(inv.total_gross) - Number(inv.paid_amount));
      return [
        inv.invoice_number ?? '',
        inv.invoice_date ?? '',
        inv.due_date ?? '',
        STATUS_DE[inv.status] ?? inv.status,
        inv.customer?.name ?? '',
        inv.customer?.company_name ?? '',
        inv.customer?.street ?? '',
        inv.customer?.postal_code ?? '',
        inv.customer?.city ?? '',
        inv.customer?.country ?? '',
        inv.customer?.uid_number ?? '',
        Number(inv.vat_rate).toFixed(2).replace('.', ','),
        Number(inv.subtotal_net).toFixed(2).replace('.', ','),
        Number(inv.vat_amount).toFixed(2).replace('.', ','),
        Number(inv.total_gross).toFixed(2).replace('.', ','),
        Number(inv.paid_amount).toFixed(2).replace('.', ','),
        offen.toFixed(2).replace('.', ','),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(SEP);
    });

  const csv = '\uFEFF' + [headers.join(SEP), ...rows].join('\r\n'); // BOM for Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rechnungen_Steuerberater_${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
  onView: (id: string) => void;
  onCreate: () => void;
}

export function InvoiceList({ onView, onCreate }: Props) {
  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.company_name?.toLowerCase().includes(q) ||
      inv.status.includes(q)
    );
  });

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_gross), 0);

  const openAmount = invoices
    .filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (Number(i.total_gross) - Number(i.paid_amount)), 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">Rechnungen gesamt</p>
          <p className="text-2xl font-bold mt-1">{invoices.length}</p>
        </div>
        <div className="p-4 bg-white border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">Bezahlter Umsatz</p>
          <p className="text-2xl font-bold mt-1 text-green-600">EUR {formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-4 bg-white border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">Offen / Ausstehend</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">EUR {formatCurrency(openAmount)}</p>
        </div>
      </div>


      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => exportSteuerberaterCSV(invoices)}
          size="sm"
          variant="outline"
          className="gap-1.5"
          title="CSV-Export für Steuerberater (Österreich)"
        >
          <Download className="w-4 h-4" />
          Steuerberater Export
        </Button>
        <Button onClick={onCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Neue Rechnung
        </Button>
      </div>


      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Lade...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Keine Rechnungen gefunden</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nr.</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kunde</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fällig</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Betrag</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {inv.invoice_number ?? <span className="text-muted-foreground italic">Entwurf</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.customer?.company_name || inv.customer?.name}</p>
                    {inv.customer?.company_name && (
                      <p className="text-xs text-muted-foreground">{inv.customer.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.invoice_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">EUR {formatCurrency(Number(inv.total_gross))}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onView(inv.id!)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Ansehen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          // Need full invoice with items — open detail dialog
                          onView(inv.id!);
                        }}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Drucken"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => {
                           const label = inv.invoice_number ?? 'diesen Entwurf';
                            if (confirm(`Rechnung ${label} wirklich löschen?`)) {
                              deleteInvoice.mutate(inv.id!);
                            }
                          }}
                          className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
