import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import {
  generateInvoiceHTML,
  getLogoDataUrl,
  buildInvoiceFilename,
} from '@/lib/invoice-print';
import type { Invoice, Customer, InvoiceItem } from '@/types/invoice';

export type FullInvoice = Invoice & { customer: Customer; items: InvoiceItem[] };

const STATUS_DE: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  viewed: 'Gesehen',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
};

export function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const from = new Date(Date.UTC(year, startMonth, 1));
  const to = new Date(Date.UTC(year, startMonth + 3, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export async function fetchQuarterInvoices(
  year: number,
  quarter: number,
  includeDrafts: boolean
): Promise<FullInvoice[]> {
  const { from, to } = quarterRange(year, quarter);
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*, product:products(*))')
    .gte('invoice_date', from)
    .lte('invoice_date', to)
    .order('invoice_number', { ascending: true });
  if (error) throw error;

  let list = (data ?? []) as unknown as FullInvoice[];
  if (!includeDrafts) {
    list = list.filter((inv) => !!inv.invoice_number && inv.status !== 'draft');
  }
  return list.map((inv) => ({
    ...inv,
    items: [...(inv.items ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));
}

/**
 * Render one invoice to a real PDF blob.
 * The invoice HTML is rendered inside an isolated off-screen iframe so its
 * global CSS (e.g. `* { margin: 0 }`) cannot leak into the app document.
 */
export async function invoiceToPdfBlob(
  invoice: FullInvoice,
  logoDataUrl?: string,
  html2pdfImpl?: typeof import('html2pdf.js').default
): Promise<Blob> {
  const html2pdf = html2pdfImpl ?? (await import('html2pdf.js')).default;
  const html = await generateInvoiceHTML(invoice, logoDataUrl);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:210mm;height:400mm;border:none;background:#ffffff;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('PDF-Rendering fehlgeschlagen (kein Dokument).');

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      doc.open();
      doc.write(html);
      doc.close();
      // Fallback in case onload already fired
      setTimeout(resolve, 800);
    });

    const body = doc.body;
    // Mirror the print margins (@media print) for the rendered PDF
    body.style.width = '210mm';
    body.style.padding = '18mm 20mm 20mm 25mm';
    body.style.background = '#ffffff';

    // Wait for images (logo, QR code) to finish decoding
    await Promise.all(
      Array.from(doc.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    const blob = (await html2pdf()
      .set({
        margin: 0,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: body.scrollWidth,
          windowHeight: body.scrollHeight,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(body)
      .output('blob')) as Blob;
    return blob;
  } finally {
    iframe.remove();
  }
}


function buildWorkbook(invoices: FullInvoice[], year: number, quarter: number) {
  const headers = [
    'Rechnungsnummer',
    'Rechnungsdatum',
    'Fälligkeitsdatum',
    'Kunde',
    'Firma',
    'Land',
    'UID-Nummer',
    'USt-Satz (%)',
    'Netto (EUR)',
    'USt (EUR)',
    'Brutto (EUR)',
    'Bezahlt (EUR)',
    'Offen (EUR)',
    'Status',
    'Beleg (Datei)',
  ];

  const rows = invoices.map((inv) => {
    const gross = Number(inv.total_gross) || 0;
    const paid = Number(inv.paid_amount) || 0;
    return [
      inv.invoice_number ?? 'Entwurf',
      inv.invoice_date ?? '',
      inv.due_date ?? '',
      inv.customer?.name ?? '',
      inv.customer?.company_name ?? '',
      inv.customer?.country ?? '',
      inv.customer?.uid_number ?? '',
      Number(inv.vat_rate) || 0,
      Number(inv.subtotal_net) || 0,
      Number(inv.vat_amount) || 0,
      gross,
      paid,
      Math.max(0, gross - paid),
      STATUS_DE[inv.status] ?? inv.status,
      `${buildInvoiceFilename(inv)}.pdf`,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const lastDataRow = rows.length + 1; // 1-based, header is row 1
  const sumRow = lastDataRow + 1;

  if (rows.length > 0) {
    const sumCols = ['I', 'J', 'K', 'L', 'M'];
    ws[`A${sumRow}`] = { t: 's', v: 'Summe' };
    sumCols.forEach((col) => {
      ws[`${col}${sumRow}`] = {
        t: 'n',
        f: `SUM(${col}2:${col}${lastDataRow})`,
        z: '#,##0.00',
      };
    });
    ws['!ref'] = `A1:O${sumRow}`;
  }

  // Number / date formats
  for (let r = 2; r <= lastDataRow; r++) {
    ['I', 'J', 'K', 'L', 'M'].forEach((col) => {
      const cell = ws[`${col}${r}`];
      if (cell) cell.z = '#,##0.00';
    });
    const vat = ws[`H${r}`];
    if (vat) vat.z = '0.0';
  }

  ws['!cols'] = [
    { wch: 16 }, { wch: 13 }, { wch: 13 }, { wch: 24 }, { wch: 24 },
    { wch: 7 }, { wch: 15 }, { wch: 11 }, { wch: 13 }, { wch: 12 },
    { wch: 13 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 36 },
  ];
  ws['!freeze'] = { xSplit: '0', ySplit: '1' };

  // ── VAT summary sheet ──
  const byRate = new Map<number, { net: number; vat: number; gross: number; count: number }>();
  invoices.forEach((inv) => {
    const rate = Number(inv.vat_rate) || 0;
    const entry = byRate.get(rate) ?? { net: 0, vat: 0, gross: 0, count: 0 };
    entry.net += Number(inv.subtotal_net) || 0;
    entry.vat += Number(inv.vat_amount) || 0;
    entry.gross += Number(inv.total_gross) || 0;
    entry.count += 1;
    byRate.set(rate, entry);
  });

  const rateLabel = (rate: number) => {
    if (rate === 0) return '0 % – Reverse Charge (innergemeinschaftliche Lieferung)';
    if (rate === 10) return '10 % – Österreich';
    if (rate === 7) return '7 % – Deutschland (B2C)';
    return `${rate} %`;
  };

  const summaryRows = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, v]) => [rateLabel(rate), v.count, v.net, v.vat, v.gross]);

  const ws2 = XLSX.utils.aoa_to_sheet([
    [`USt-Zusammenfassung ${year} Q${quarter}`],
    [],
    ['USt-Satz', 'Anzahl', 'Netto (EUR)', 'USt (EUR)', 'Brutto (EUR)'],
    ...summaryRows,
  ]);

  const sumStart = 4;
  const sumEnd = 3 + summaryRows.length;
  if (summaryRows.length > 0) {
    const totalRow = sumEnd + 1;
    ws2[`A${totalRow}`] = { t: 's', v: 'Gesamt' };
    ['B', 'C', 'D', 'E'].forEach((col) => {
      ws2[`${col}${totalRow}`] = {
        t: 'n',
        f: `SUM(${col}${sumStart}:${col}${sumEnd})`,
        z: col === 'B' ? '0' : '#,##0.00',
      };
    });
    ws2[`A${totalRow + 2}`] = {
      t: 's',
      v: 'Hinweis: Steuerfreie innergemeinschaftliche Lieferung gem. Art. 6 Abs 1 UStG 1994 (Reverse Charge).',
    };
    ws2['!ref'] = `A1:E${totalRow + 2}`;
    for (let r = sumStart; r <= sumEnd; r++) {
      ['C', 'D', 'E'].forEach((col) => {
        const cell = ws2[`${col}${r}`];
        if (cell) cell.z = '#,##0.00';
      });
    }
  }
  ws2['!cols'] = [{ wch: 52 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rechnungen');
  XLSX.utils.book_append_sheet(wb, ws2, 'USt-Zusammenfassung');
  return wb;
}

export interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

export async function buildQuarterExport(
  year: number,
  quarter: number,
  options: { includeDrafts: boolean },
  onProgress?: (p: ExportProgress) => void
): Promise<{ filename: string; blob: Blob; count: number }> {
  const invoices = await fetchQuarterInvoices(year, quarter, options.includeDrafts);
  if (invoices.length === 0) {
    throw new Error('Keine Rechnungen im gewählten Quartal.');
  }

  const { default: html2pdf } = await import('html2pdf.js');
  const logoDataUrl = await getLogoDataUrl();

  const zip = new JSZip();
  const belege = zip.folder('Belege')!;
  const usedNames = new Set<string>();

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    onProgress?.({
      current: i + 1,
      total: invoices.length,
      label: `Beleg ${i + 1} von ${invoices.length}`,
    });
    let name = `${buildInvoiceFilename(inv)}.pdf`;
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `${buildInvoiceFilename(inv)}_${suffix++}.pdf`;
    }
    usedNames.add(name);
    const pdf = await invoiceToPdfBlob(inv, logoDataUrl, html2pdf);
    belege.file(name, pdf);
  }

  onProgress?.({
    current: invoices.length,
    total: invoices.length,
    label: 'Excel-Übersicht wird erstellt…',
  });

  const wb = buildWorkbook(invoices, year, quarter);
  const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file(`Uebersicht_${year}_Q${quarter}.xlsx`, xlsxData);

  onProgress?.({
    current: invoices.length,
    total: invoices.length,
    label: 'ZIP wird gepackt…',
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return { filename: `Buchhaltung_${year}_Q${quarter}.zip`, blob, count: invoices.length };
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
