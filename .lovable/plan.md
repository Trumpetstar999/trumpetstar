## Ziel
Im Adminbereich → Rechnungen eine neue Rubrik **„Produkte"** hinzufügen, in der Produkte angelegt und bearbeitet werden können. Jedes Produkt erhält **zwei Preise**: Händlerpreis und UVP (Endkundenpreis). Beim Erstellen einer Rechnung wird pro Position ausgewählt, welcher Preis gilt.

Die 4 Produkte aus dem PDF werden automatisch angelegt.

## Änderungen

### 1. Datenbank-Migration
- `products`-Tabelle erweitern:
  - `dealer_price_gross numeric NOT NULL DEFAULT 0` (Händlerpreis)
  - bestehendes `price_gross` = UVP / Endkundenpreis
- 4 Produkte aus dem PDF anlegen (Insert via SQL):

| SKU | Name | Händlerpreis | UVP |
|---|---|---|---|
| TS-BAND1 | Trumpetstar Band 1 | 25,00 | 35,00 |
| TS-BAND2 | Trumpetstar Band 2 | 29,00 | 39,00 |
| TS-XMAS | Trumpetstar X-Mas Special | 16,00 | 24,00 |
| TS-BAND1-KLAV | Trumpetstar Band 1 – Klavierbegleitungen | 20,00 | 29,00 |

USt-Sätze bleiben Default (AT 10 %, DE 7 % — Bücher).

### 2. Neue Sub-Rubrik „Produkte"
- `InvoicesPanel.tsx`: vierter Tab **Produkte** (Icon `Package2` o.ä.) — neben Rechnungen / Kunden / Lager.
- Neue Komponente `ProductsPanel.tsx`:
  - Tabelle mit allen Produkten (SKU, Name, Händlerpreis, UVP, aktiv).
  - Buttons: **Neu**, **Bearbeiten**, **Aktiv/Inaktiv**, **Löschen**.
- Dialog `ProductFormDialog.tsx`: SKU, Name, Beschreibung, Händlerpreis, UVP, USt AT/DE, aktiv.

### 3. Neue Hooks in `useInvoices.ts`
- `useAllProducts` (inkl. inaktiv, für Admin-Liste).
- `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`.
- `useInvoiceProducts` (bestehend) liefert weiterhin nur aktive.

### 4. Rechnungsdialog: Preisauswahl pro Position
- `InvoiceCreateDialog.tsx`:
  - In jeder Positionszeile nach der Produktauswahl ein kleiner Toggle/Select **„Händlerrabatt / Endkunde"** (Default: Endkunde / UVP).
  - Beim Wechsel oder Produktwechsel wird `unit_price_gross` automatisch auf `dealer_price_gross` bzw. `price_gross` gesetzt.
  - Manuelle Übersteuerung des Preisfelds bleibt möglich.

### 5. TypeScript-Typ
- `src/types/invoice.ts`: `Product` erhält `dealer_price_gross: number`.

## Nicht geändert
- Bestehende Rechnungen, Kunden- und Lager-Logik.
- VAT-Berechnung, Finalisierung, PDF-Druck.
- Andere Adminbereiche.

## Technische Details
- Migration fügt Spalte mit Default 0 hinzu (keine NOT-NULL-Verletzung bei Bestand), danach Seed-Insert mit `ON CONFLICT (sku) DO UPDATE` für Idempotenz.
- Pro Rechnungsposition wird der gewählte Preistyp **nicht** in der DB persistiert — nur der finale `unit_price_gross` zählt (entspricht aktueller Datenstruktur).
