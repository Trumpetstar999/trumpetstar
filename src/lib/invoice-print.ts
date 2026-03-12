import type { Invoice, Customer, InvoiceItem } from '@/types/invoice';
import { formatCurrency, formatDate, getVatNote } from './vat';

const COMPANY = {
  name: 'Trumpetstar GmbH',
  street: 'Mogersdorf 253',
  city: '8382 Mogersdorf, Burgenland',
  email: 'info@trumpetstar.com',
  phone: '+436644530873',
  web: 'www.trumpetstar.com',
  uid: 'ATU81038878',
  bank: 'Raiffeisen Regionalbank Güssing-Jennersdorf',
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
  const remaining = invoice.total_gross - invoice.paid_amount;

  const itemRows = (invoice.items || [])
    .map((item, i) => {
      const discountStr = item.discount_percent > 0 ? `${item.discount_percent}%` : '–';
      return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
        <td style="padding:7px 8px;font-size:9pt;border-bottom:1px solid #e8ecef;">
          ${item.description}${item.notes ? `<br><span style="font-size:7.5pt;color:#666;">${item.notes}</span>` : ''}
        </td>
        <td style="padding:7px 8px;text-align:center;font-size:9pt;border-bottom:1px solid #e8ecef;">${item.quantity}</td>
        <td style="padding:7px 8px;font-size:9pt;border-bottom:1px solid #e8ecef;">${item.unit}</td>
        <td style="padding:7px 8px;text-align:right;font-size:9pt;border-bottom:1px solid #e8ecef;">€ ${formatCurrency(item.unit_price_gross)}</td>
        <td style="padding:7px 8px;text-align:center;font-size:9pt;border-bottom:1px solid #e8ecef;">${discountStr}</td>
        <td style="padding:7px 8px;text-align:center;font-size:9pt;border-bottom:1px solid #e8ecef;">${invoice.vat_rate}%</td>
        <td style="padding:7px 8px;text-align:right;font-size:9pt;font-weight:600;border-bottom:1px solid #e8ecef;">€ ${formatCurrency(item.line_total_gross)}</td>
      </tr>`;
    })
    .join('');

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Trumpetstar" style="height:70px;object-fit:contain;">`
    : `<div style="font-size:22pt;font-weight:800;letter-spacing:-0.5px;line-height:1;color:#1a1a1a;">TRUMPET<br><span style="color:#c0392b;">STAR</span></div>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Rechnung ${invoice.invoice_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: A4 portrait;
    margin: 18mm 20mm 22mm 25mm;
  }
  @media print {
    body { margin: 0 !important; }
    .no-print { display: none !important; }
    html, body { width: 210mm; }
  }
  html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.4;
  }
  .page-wrap {
    width: 100%;
    max-width: 170mm;
    margin: 0 auto;
  }
  table { border-collapse: collapse; width: 100%; }
  .items-table th {
    background: #2c3e50;
    color: #ffffff;
    padding: 8px 8px;
    text-align: left;
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .items-table td { vertical-align: top; }
  .totals-table td { padding: 4px 10px; font-size: 9.5pt; }
  .total-final td { 
    background: #2c3e50; 
    color: #ffffff; 
    font-weight: 700; 
    font-size: 11pt; 
    padding: 8px 10px;
  }
  .sender-line {
    font-size: 7pt;
    color: #555;
    text-decoration: underline;
    margin-bottom: 18px;
    display: block;
  }
  .footer {
    font-size: 7.5pt;
    color: #555;
    border-top: 1px solid #ccc;
    padding-top: 8px;
    margin-top: 20px;
  }
  .payment-box {
    margin-top: 18px;
    padding: 12px 14px;
    background: #f0f4f8;
    border-left: 3px solid #2c3e50;
    font-size: 8.5pt;
  }
</style>
</head>
<body>

<!-- PRINT/CLOSE BUTTONS -->
<div class="no-print" style="position:fixed;top:14px;right:14px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:9px 18px;background:#2c3e50;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
    🖨️ Als PDF speichern
  </button>
  <button onclick="window.close()" style="padding:9px 14px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;cursor:pointer;">
    ✕ Schließen
  </button>
</div>

<div class="page-wrap">

<!-- ═══ HEADER: Logo + Empfänger + Rechnungsinfo ═══ -->
<table style="margin-bottom:28px;">
  <tr>
    <!-- Empfänger links -->
    <td style="vertical-align:top;width:55%;">
      <span class="sender-line">${COMPANY.name} &nbsp;${COMPANY.street} &ndash; ${COMPANY.city}</span>
      <p style="line-height:1.6;font-size:10pt;">
        <strong style="font-size:11pt;">${customer.company_name || customer.name}</strong><br>
        ${customer.company_name ? customer.name + '<br>' : ''}
        ${customer.street}<br>
        ${customer.postal_code} ${customer.city}<br>
        ${customer.country === 'AT' ? 'Österreich' : 'Deutschland'}
        ${customer.uid_number ? `<br>UID ${customer.uid_number}` : ''}
      </p>
    </td>

    <!-- Logo + Rechnungsinfo rechts -->
    <td style="vertical-align:top;text-align:right;width:45%;">
      <div style="margin-bottom:14px;">${logoHtml}</div>
      <table style="margin-left:auto;min-width:160px;">
        <tr>
          <td colspan="2" style="padding-bottom:6px;">
            <span style="font-size:18pt;font-weight:700;letter-spacing:-0.5px;color:#1a1a1a;">Rechnung</span>
          </td>
        </tr>
        <tr>
          <td style="padding:3px 14px 3px 0;color:#666;font-size:8.5pt;white-space:nowrap;">Rechnungsnummer</td>
          <td style="padding:3px 0;font-size:9pt;font-weight:700;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding:3px 14px 3px 0;color:#666;font-size:8.5pt;">Rechnungsdatum</td>
          <td style="padding:3px 0;font-size:9pt;">${formatDate(invoice.invoice_date)}</td>
        </tr>
        <tr>
          <td style="padding:3px 14px 3px 0;color:#666;font-size:8.5pt;">Fälligkeitsdatum</td>
          <td style="padding:3px 0;font-size:9pt;font-weight:700;color:#c0392b;">${formatDate(invoice.due_date)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══ ARTIKELTABELLE ═══ -->
<table class="items-table" style="margin-bottom:12px;">
  <thead>
    <tr>
      <th style="width:38%;">Beschreibung</th>
      <th style="width:8%;text-align:center;">Menge</th>
      <th style="width:10%;">Einheit</th>
      <th style="width:13%;text-align:right;">Preis</th>
      <th style="width:9%;text-align:center;">Rabatt</th>
      <th style="width:9%;text-align:center;">USt.</th>
      <th style="width:13%;text-align:right;">Betrag</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows || `<tr><td colspan="7" style="padding:12px 8px;text-align:center;color:#999;font-size:9pt;font-style:italic;">Keine Positionen</td></tr>`}
  </tbody>
</table>

<!-- ═══ SUMMEN ═══ -->
<table class="totals-table" style="width:240px;margin-left:auto;margin-bottom:4px;">
  ${invoice.vat_rate > 0 ? `
  <tr>
    <td style="color:#555;">Zwischensumme ohne USt.</td>
    <td style="text-align:right;">€&nbsp;${formatCurrency(invoice.subtotal_net)}</td>
  </tr>
  <tr>
    <td style="color:#555;">${vatLabel} von ${formatCurrency(invoice.subtotal_net)}</td>
    <td style="text-align:right;color:#555;">€&nbsp;${formatCurrency(invoice.vat_amount)}</td>
  </tr>` : `
  <tr>
    <td style="color:#555;">Nettobetrag</td>
    <td style="text-align:right;">€&nbsp;${formatCurrency(invoice.subtotal_net)}</td>
  </tr>`}
  <tr class="total-final">
    <td>Gesamt EUR</td>
    <td style="text-align:right;">€&nbsp;${formatCurrency(invoice.total_gross)}</td>
  </tr>
  <tr>
    <td style="color:#555;padding-top:6px;">Bezahlter Betrag</td>
    <td style="text-align:right;color:#555;padding-top:6px;">€&nbsp;${formatCurrency(invoice.paid_amount)}</td>
  </tr>
  <tr style="border-top:2px solid #2c3e50;">
    <td style="font-weight:700;font-size:11pt;padding:8px 10px 4px;">Zu zahlender Betrag EUR</td>
    <td style="text-align:right;font-weight:700;font-size:11pt;padding:8px 10px 4px;">€&nbsp;${formatCurrency(remaining)}</td>
  </tr>
</table>

${vatNote ? `<p style="margin-top:14px;font-size:8pt;color:#555;font-style:italic;">${vatNote}</p>` : ''}
${invoice.notes ? `<p style="margin-top:10px;font-size:9pt;"><strong>Anmerkung:</strong> ${invoice.notes}</p>` : ''}

<!-- ═══ ZAHLUNGSINFO ═══ -->
<div class="payment-box">
  <strong style="font-size:9pt;">Zahlung bitte unter Angabe der Rechnungsnummer ${invoice.invoice_number}:</strong><br><br>
  <table style="width:auto;">
    <tr>
      <td style="padding:1px 16px 1px 0;color:#555;">Kontoinhaber</td>
      <td style="font-weight:600;">${COMPANY.kontoinhaber}</td>
    </tr>
    <tr>
      <td style="padding:1px 16px 1px 0;color:#555;">IBAN</td>
      <td style="font-family:monospace;font-size:9pt;font-weight:600;">${COMPANY.iban}</td>
    </tr>
    <tr>
      <td style="padding:1px 16px 1px 0;color:#555;">BIC</td>
      <td>${COMPANY.bic}</td>
    </tr>
    <tr>
      <td style="padding:1px 16px 1px 0;color:#555;">Bank</td>
      <td>${COMPANY.bank}</td>
    </tr>
  </table>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <table>
    <tr>
      <td style="font-size:7.5pt;">${COMPANY.name} &bull; ${COMPANY.street} &bull; ${COMPANY.city}</td>
      <td style="text-align:right;font-size:7.5pt;">Seite 1 von 1 &nbsp;|&nbsp; Rechnung ${invoice.invoice_number}</td>
    </tr>
    <tr>
      <td style="font-size:7.5pt;">E-Mail: ${COMPANY.email} &bull; Tel: ${COMPANY.phone} &bull; ${COMPANY.web}</td>
      <td style="text-align:right;font-size:7.5pt;">UID: ${COMPANY.uid}</td>
    </tr>
  </table>
</div>

</div><!-- /page-wrap -->
</body>
</html>`;
}

// Convert local image to base64 data URL for embedding in print window
async function getLogoDataUrl(): Promise<string | undefined> {
  try {
    // Dynamic import of the logo asset
    const logoModule = await import('@/assets/trumpetstar-logo.png');
    const logoUrl = logoModule.default;
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function printInvoice(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
) {
  const logoDataUrl = await getLogoDataUrl();
  const html = generateInvoiceHTML(invoice, logoDataUrl);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Give images time to load before triggering print dialog
  win.onload = () => {
    setTimeout(() => win.focus(), 200);
  };
}
