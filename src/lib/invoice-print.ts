import type { Invoice, Customer, InvoiceItem } from '@/types/invoice';
import { formatCurrency, formatDate, getVatNote } from './vat';
import QRCode from 'qrcode';

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

/** EPC-QR (GiroCode) — SEPA Credit Transfer standard */
async function generateEpcQrCode(invoice: Invoice): Promise<string> {
  const amount = (invoice.total_gross - invoice.paid_amount).toFixed(2);
  const reference = invoice.invoice_number ?? '';
  const epcData = [
    'BCD', '002', '1', 'SCT',
    COMPANY.bic,
    COMPANY.kontoinhaber,
    COMPANY.iban,
    `EUR${amount}`,
    '', '',
    `Rechnung ${reference}`,
  ].join('\n');

  return QRCode.toDataURL(epcData, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 140,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
}

/** Build a safe filename: e.g. "2026-001_Jennifer_Ederer" */
function buildInvoiceFilename(invoice: Invoice & { customer: Customer }): string {
  const customerLabel = (invoice.customer.company_name || invoice.customer.name)
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\-_. ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
  return `${invoice.invoice_number}_${customerLabel}`;
}

export async function generateInvoiceHTML(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
  logoDataUrl?: string,
  titleOverride?: string
): Promise<string> {
  const customer = invoice.customer;
  const hasUid = !!customer.uid_number;
  const vatNote = getVatNote(invoice.country as 'AT' | 'DE', hasUid);
  const vatLabel = invoice.vat_rate === 0 ? 'Reverse Charge' : `USt. ${invoice.vat_rate}%`;
  const remaining = invoice.total_gross - invoice.paid_amount;
  const docTitle = titleOverride ?? buildInvoiceFilename(invoice);

  const qrDataUrl = await generateEpcQrCode(invoice);

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
    ? `<img src="${logoDataUrl}" alt="Trumpetstar" style="height:80px;object-fit:contain;">`
    : `<div style="font-size:18pt;font-weight:800;letter-spacing:-0.5px;line-height:1;color:#1a1a1a;">TRUMPET<br><span style="color:#c0392b;">STAR</span></div>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: A4 portrait;
    margin: 0mm;
  }
  @media print {
    body { margin: 0 !important; padding: 18mm 20mm 20mm 25mm !important; }
    .no-print { display: none !important; }
    html, body { width: 210mm; }
  }
  html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 9.5pt;
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
    padding: 6px 8px;
    text-align: left;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .items-table td { vertical-align: top; }
  .totals-table td { padding: 3px 8px; font-size: 9pt; }
  .total-final td { 
    background: #2c3e50; 
    color: #ffffff; 
    font-weight: 700; 
    font-size: 10pt; 
    padding: 6px 8px;
  }
  .sender-line {
    font-size: 7pt;
    color: #555;
    text-decoration: underline;
    margin-bottom: 12px;
    display: block;
  }
  .footer {
    font-size: 7pt;
    color: #555;
    border-top: 1px solid #ccc;
    padding-top: 6px;
    margin-top: 12px;
  }
  .payment-box {
    margin-top: 25mm;
    padding: 10px 14px;
    background: #f0f4f8;
    border-left: 3px solid #2c3e50;
    font-size: 8pt;
  }
</style>
</head>
<body>

<div class="page-wrap">

<!-- ═══ HEADER ═══ -->
<table style="margin-bottom:20mm;">
  <tr>
    <td style="vertical-align:top;width:55%;">
      <span class="sender-line">${COMPANY.name} &nbsp;${COMPANY.street} &ndash; ${COMPANY.city}</span>
      <p style="line-height:1.6;font-size:9.5pt;">
        <strong style="font-size:10.5pt;">${customer.company_name || customer.name}</strong><br>
        ${customer.company_name ? customer.name + '<br>' : ''}
        ${customer.street}<br>
        ${customer.postal_code} ${customer.city}<br>
        ${customer.country === 'AT' ? 'Österreich' : 'Deutschland'}
        ${customer.uid_number ? `<br>UID ${customer.uid_number}` : ''}
      </p>
    </td>

    <td style="vertical-align:top;text-align:right;width:45%;">
      <div style="margin-bottom:24px;">${logoHtml}</div>
      <table style="margin-left:auto;min-width:150px;">
        <tr>
          <td colspan="2" style="padding-bottom:6px;">
            <span style="font-size:16pt;font-weight:700;letter-spacing:-0.5px;color:#1a1a1a;">Rechnung</span>
          </td>
        </tr>
        <tr>
          <td style="padding:3px 12px 3px 0;color:#666;font-size:8pt;white-space:nowrap;">Rechnungsnummer</td>
          <td style="padding:3px 0;font-size:8.5pt;font-weight:700;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding:3px 12px 3px 0;color:#666;font-size:8pt;">Rechnungsdatum</td>
          <td style="padding:3px 0;font-size:8.5pt;">${formatDate(invoice.invoice_date)}</td>
        </tr>
        <tr>
          <td style="padding:3px 12px 3px 0;color:#666;font-size:8pt;vertical-align:middle;">Fälligkeitsdatum</td>
          <td style="padding:3px 0;font-size:8.5pt;font-weight:700;color:#c0392b;vertical-align:middle;">${formatDate(invoice.due_date)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ═══ ARTIKELTABELLE ═══ -->
<table class="items-table" style="margin-bottom:8px;">
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
    ${itemRows || `<tr><td colspan="7" style="padding:8px;text-align:center;color:#999;font-size:8.5pt;font-style:italic;">Keine Positionen</td></tr>`}
  </tbody>
</table>

<!-- ═══ SUMMEN ═══ -->
<table class="totals-table" style="width:230px;margin-left:auto;margin-bottom:4px;">
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
    <td style="color:#555;padding-top:4px;">Bezahlter Betrag</td>
    <td style="text-align:right;color:#555;padding-top:4px;">€&nbsp;${formatCurrency(invoice.paid_amount)}</td>
  </tr>
  <tr style="border-top:2px solid #2c3e50;">
    <td style="font-weight:700;font-size:10pt;padding:5px 8px;">Zu zahlender Betrag EUR</td>
    <td style="text-align:right;font-weight:700;font-size:10pt;padding:5px 8px;">€&nbsp;${formatCurrency(remaining)}</td>
  </tr>
</table>

${vatNote ? `<p style="margin-top:8px;font-size:7.5pt;color:#555;font-style:italic;">${vatNote}</p>` : ''}
${invoice.notes ? `<p style="margin-top:6px;font-size:8.5pt;"><strong>Anmerkung:</strong> ${invoice.notes}</p>` : ''}

<!-- ═══ ZAHLUNGSINFO ═══ -->
<div class="payment-box">
  <table style="width:100%;">
    <tr>
      <td style="vertical-align:top;padding-right:12px;">
        <strong style="font-size:8.5pt;display:block;margin-bottom:5px;">Zahlung bitte unter Angabe der Rechnungsnummer ${invoice.invoice_number}:</strong>
        <table style="width:auto;">
          <tr>
            <td style="padding:2px 12px 2px 0;color:#555;font-size:8pt;">Kontoinhaber</td>
            <td style="font-weight:600;font-size:8pt;">${COMPANY.kontoinhaber}</td>
          </tr>
          <tr>
            <td style="padding:2px 12px 2px 0;color:#555;font-size:8pt;">IBAN</td>
            <td style="font-family:monospace;font-size:8pt;font-weight:600;">${COMPANY.iban}</td>
          </tr>
          <tr>
            <td style="padding:2px 12px 2px 0;color:#555;font-size:8pt;">BIC</td>
            <td style="font-size:8pt;">${COMPANY.bic}</td>
          </tr>
          <tr>
            <td style="padding:2px 12px 2px 0;color:#555;font-size:8pt;">Bank</td>
            <td style="font-size:8pt;">${COMPANY.bank}</td>
          </tr>
        </table>
      </td>
      <td style="vertical-align:top;text-align:center;padding-left:8px;border-left:1px solid #d1d5db;width:110px;">
        <img src="${qrDataUrl}" alt="EPC QR Code" style="width:85px;height:85px;display:block;margin:0 auto 3px;">
        <span style="font-size:6pt;color:#777;display:block;">GiroCode / EPC QR</span>
        <span style="font-size:6pt;color:#777;display:block;">Scannen zum Bezahlen</span>
      </td>
    </tr>
  </table>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <table>
    <tr>
      <td style="font-size:7pt;">${COMPANY.name} &bull; ${COMPANY.street} &bull; ${COMPANY.city}</td>
      <td style="text-align:right;font-size:7pt;">Seite 1 von 1 &nbsp;|&nbsp; Rechnung ${invoice.invoice_number}</td>
    </tr>
    <tr>
      <td style="font-size:7pt;">E-Mail: ${COMPANY.email} &bull; Tel: ${COMPANY.phone} &bull; ${COMPANY.web}</td>
      <td style="text-align:right;font-size:7pt;">UID: ${COMPANY.uid}</td>
    </tr>
  </table>
</div>

</div><!-- /page-wrap -->
</body>
</html>`;
}

// Convert local image to base64 data URL for embedding
async function getLogoDataUrl(): Promise<string | undefined> {
  try {
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
  const html = await generateInvoiceHTML(invoice, logoDataUrl);

  const existing = document.getElementById('invoice-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;';

  return new Promise<void>((resolve) => {
    // Set onload BEFORE appending to DOM
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve();
      }, 400);
    };

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { resolve(); return; }
    doc.open();
    doc.write(html);
    doc.close();
  });
}

export async function downloadInvoice(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
) {
  const filename = buildInvoiceFilename(invoice);
  const logoDataUrl = await getLogoDataUrl();
  // Pass filename as title so the browser uses it as the suggested PDF save name
  const html = await generateInvoiceHTML(invoice, logoDataUrl, filename);

  // Use a hidden iframe so popup-blockers don't interfere and
  // the title (= filename) is set correctly for the PDF save dialog.
  const existing = document.getElementById('invoice-download-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-download-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;';

  return new Promise<void>((resolve) => {
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // onafterprint fires when the user closes the print/save dialog
        if (iframe.contentWindow) {
          iframe.contentWindow.onafterprint = () => {
            iframe.remove();
            resolve();
          };
        } else {
          setTimeout(() => { iframe.remove(); resolve(); }, 2000);
        }
      }, 500);
    };

    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { resolve(); return; }
    doc.open();
    doc.write(html);
    doc.close();
  });
}
