import type { Invoice, Customer, InvoiceItem } from '@/types/invoice';
import { formatCurrency, formatDate, getVatNote } from './vat';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

const COMPANY = {
  name: 'Trumpetstar GmbH',
  street: 'Mogersdorf 253',
  city: '8382 Mogersdorf, Burgenland',
  email: 'info@trumpetstar.com',
  phone: '+436644530873',
  web: 'www.trumpetstar.com',
  uid: 'ATU81038878',
  bank: 'Raiffeisen Regionalbank Guessing-Jennersdorf',
  bic: 'RLBBAT2E027',
  iban: 'AT103302700002691756',
  kontoinhaber: 'Trumpetstar GmbH',
};

export function generateInvoiceHTML(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
  logoDataUrl?: string
): string {
  const customer = invoice.customer;
  const hasUid = !!customer.uid_number;
  const vatNote = getVatNote(invoice.country as 'AT' | 'DE', hasUid);
  const vatLabel = invoice.vat_rate === 0 ? 'Reverse Charge' : `USt. ${invoice.vat_rate}%`;

  const itemRows = invoice.items
    .map((item, i) => {
      const discountStr =
        item.discount_percent > 0 ? `${item.discount_percent}%` : '0%';
      return `
      <tr style="${i % 2 === 0 ? 'background:#fff' : 'background:#f9f9f9'}">
        <td style="padding:6px 8px;font-size:9pt;">${item.description}${
          item.notes ? `<br><span style="font-size:7.5pt;color:#555;">${item.notes}</span>` : ''
        }</td>
        <td style="padding:6px 8px;text-align:center;font-size:9pt;">${item.quantity}</td>
        <td style="padding:6px 8px;font-size:9pt;">${item.unit}</td>
        <td style="padding:6px 8px;text-align:right;font-size:9pt;">EUR ${formatCurrency(item.unit_price_gross)}</td>
        <td style="padding:6px 8px;text-align:center;font-size:9pt;">${discountStr}</td>
        <td style="padding:6px 8px;text-align:center;font-size:9pt;">${invoice.vat_rate}%</td>
        <td style="padding:6px 8px;text-align:right;font-size:9pt;font-weight:500;">EUR ${formatCurrency(item.line_total_gross)}</td>
      </tr>`;
    })
    .join('');

  const remaining = invoice.total_gross - invoice.paid_amount;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Rechnung ${invoice.invoice_number}</title>
<style>
  @page { size: A4; margin: 20mm 20mm 25mm 25mm; }
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
  }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; }
  table { border-collapse: collapse; width: 100%; }
  .items-table th { background: #F0F0F0; padding: 7px 8px; text-align: left; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #ccc; }
  .items-table td { border-bottom: 1px solid #eee; }
  .totals-table td { padding: 4px 8px; font-size: 10pt; }
  .total-row { background: #FFF8E1; font-weight: 700; }
  .footer { font-size: 8pt; color: #555; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 20px; }
  h1 { font-size: 14pt; margin: 0 0 6px; }
</style>
</head>
<body>
<!-- PRINT BUTTON (not printed) -->
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">🖨️ PDF drucken</button>
  <button onclick="window.close()" style="padding:10px 16px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;cursor:pointer;">Schließen</button>
</div>

<!-- LOGO -->
<table>
  <tr>
    <td style="vertical-align:top;width:60%;">
      <!-- Sender-Zeile -->
      <p style="font-size:7pt;color:#666;text-decoration:underline;margin:0 0 20px;">
        ${COMPANY.name} ${COMPANY.street} &ndash; ${COMPANY.city}
      </p>
      <!-- Empfänger -->
      <p style="margin:0;line-height:1.5;">
        <strong style="font-size:11pt;">${customer.company_name || customer.name}</strong><br>
        ${customer.company_name ? customer.name + '<br>' : ''}
        ${customer.street}<br>
        ${customer.postal_code} ${customer.city}<br>
        ${customer.country === 'AT' ? 'Österreich' : 'Deutschland'}
        ${customer.uid_number ? `<br>UID ${customer.uid_number}` : ''}
      </p>
    </td>
    <td style="text-align:right;vertical-align:top;">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Trumpetstar" style="width:50mm;margin-bottom:12px;">` : `<p style="font-size:20pt;font-weight:700;margin:0 0 12px;">TRUMPETSTAR</p>`}
      <table style="margin-left:auto;">
        <tr>
          <td colspan="2"><h1>Rechnung</h1></td>
        </tr>
        <tr>
          <td style="padding:2px 12px 2px 0;color:#555;font-size:9pt;">Rechnungsnummer</td>
          <td style="padding:2px 0;font-size:9pt;font-weight:600;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding:2px 12px 2px 0;color:#555;font-size:9pt;">Rechnungsdatum</td>
          <td style="padding:2px 0;font-size:9pt;">${formatDate(invoice.invoice_date)}</td>
        </tr>
        <tr>
          <td style="padding:2px 12px 2px 0;color:#555;font-size:9pt;">Fälligkeitsdatum</td>
          <td style="padding:2px 0;font-size:9pt;font-weight:700;">${formatDate(invoice.due_date)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ITEMS TABLE -->
<table class="items-table" style="margin-top:24px;">
  <thead>
    <tr>
      <th style="width:40%;">Beschreibung</th>
      <th style="width:8%;text-align:center;">Menge</th>
      <th style="width:10%;">Einheit</th>
      <th style="width:13%;text-align:right;">Preis</th>
      <th style="width:8%;text-align:center;">Rabatt</th>
      <th style="width:8%;text-align:center;">USt.</th>
      <th style="width:13%;text-align:right;">Betrag</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<!-- TOTALS -->
<table class="totals-table" style="margin-top:8px;width:300px;margin-left:auto;">
  ${invoice.vat_rate > 0 ? `
  <tr>
    <td>Zwischensumme ohne USt.</td>
    <td style="text-align:right;">EUR ${formatCurrency(invoice.subtotal_net)}</td>
  </tr>
  <tr>
    <td>${vatLabel} von EUR ${formatCurrency(invoice.subtotal_net)}</td>
    <td style="text-align:right;">EUR ${formatCurrency(invoice.vat_amount)}</td>
  </tr>` : `
  <tr>
    <td>Nettobetrag</td>
    <td style="text-align:right;">EUR ${formatCurrency(invoice.subtotal_net)}</td>
  </tr>`}
  <tr class="total-row">
    <td style="padding:6px 8px;">Gesamt</td>
    <td style="text-align:right;padding:6px 8px;">EUR ${formatCurrency(invoice.total_gross)}</td>
  </tr>
  <tr>
    <td style="color:#555;">Bezahlter Betrag</td>
    <td style="text-align:right;color:#555;">EUR ${formatCurrency(invoice.paid_amount)}</td>
  </tr>
  <tr style="border-top:2px solid #000;">
    <td style="font-weight:700;font-size:11pt;padding:6px 8px;">Zu zahlender Betrag</td>
    <td style="text-align:right;font-weight:700;font-size:11pt;padding:6px 8px;">EUR ${formatCurrency(remaining)}</td>
  </tr>
</table>

${vatNote ? `<p style="margin-top:16px;font-size:8.5pt;color:#444;font-style:italic;">${vatNote}</p>` : ''}
${invoice.notes ? `<p style="margin-top:12px;font-size:9pt;"><strong>Anmerkung:</strong> ${invoice.notes}</p>` : ''}

<!-- PAYMENT INFO -->
<div style="margin-top:20px;padding:12px;background:#f8f9fa;border:1px solid #e2e8f0;border-radius:4px;font-size:9pt;">
  <strong>Zahlung bitte unter Angabe der Rechnungsnummer ${invoice.invoice_number}:</strong><br>
  IBAN: ${COMPANY.iban} &nbsp;|&nbsp; BIC: ${COMPANY.bic}<br>
  Bank: ${COMPANY.bank}
</div>

<!-- FOOTER -->
<div class="footer" style="margin-top:24px;">
  <table>
    <tr>
      <td>${COMPANY.name} &bull; ${COMPANY.street} &bull; ${COMPANY.city}</td>
      <td style="text-align:right;">Seite 1 von 1 &nbsp;|&nbsp; Rechnung ${invoice.invoice_number}</td>
    </tr>
    <tr>
      <td>E-Mail: ${COMPANY.email} &bull; Tel: ${COMPANY.phone} &bull; ${COMPANY.web}</td>
      <td style="text-align:right;">UID ${COMPANY.uid}</td>
    </tr>
  </table>
</div>
</body>
</html>`;
}

export function printInvoice(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
) {
  const html = generateInvoiceHTML(invoice);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
