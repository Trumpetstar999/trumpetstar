
## Integration: Rechnung & Lagerverwaltung im Adminbereich

### Was gebaut wird

Ein neues **"Rechnungen"**-Modul im Admin-Sidebar, bestehend aus zwei Unter-Tabs:
1. **Rechnungen** — Liste aller Rechnungen, neue Rechnung erstellen, PDF herunterladen
2. **Lager** — Aktueller Bestand pro Produkt, Wareneingang buchen, Bewegungshistorie

---

### Datenbankänderungen (Migration)

Neue Tabellen nach dem vorgegebenen Schema aus `database-schema.md`:

- `customers` — Kundenstammdaten (Name, Adresse, Land AT/DE, UID)
- `products` — Produktkatalog (TS-BAND1, TS-BAND2 als Initialdaten)
- `invoice_sequences` — Zähler für Rechnungsnummern pro Jahr
- `invoices` — Rechnungskopfdaten (Nummer, Kunde, Datum, Beträge, Status)
- `invoice_items` — Rechnungspositionen (Menge, Preis, Rabatt)
- `inventory` — Lagerbestand pro Produkt
- `inventory_movements` — Bestandsbewegungen

Datenbankfunktionen:
- `next_invoice_number(p_year)` — atomare Nummernvergabe
- `finalize_invoice(p_invoice_id)` — Rechnung abschließen + Lager reduzieren
- `add_stock(p_product_id, p_quantity, p_reason)` — Wareneingang buchen

RLS: Admin-only Zugriff via `has_role(auth.uid(), 'admin')`.

---

### PDF-Generierung

Das Skill-Dokument verwendet `jsPDF`. Da `jspdf` noch nicht installiert ist, wird die PDF-Logik mit dem bereits installierten `@react-pdf/renderer`-Pattern umgesetzt — **oder** direkt als Browser-`window.print()`-basiertes HTML-to-PDF, da `jspdf` als Paket hinzugefügt werden müsste.

**Entscheidung**: Wir nutzen eine reine HTML/CSS-Print-Preview-Seite (kein Extra-Paket nötig), die genau dem Rechnungstemplate aus `invoice-template.md` entspricht. Der Admin klickt "PDF drucken" → Browser-Druckdialog → "Als PDF speichern". Das ist zuverlässiger und braucht keine neue Abhängigkeit.

---

### Neue Dateien

```text
src/
  types/
    invoice.ts                    — Typdefinitionen (Customer, Invoice, etc.)
  lib/
    invoice-calc.ts               — Berechnungslogik (Bruttopreise, USt)
    vat.ts                        — USt-Regeln AT/DE
    invoice-print.ts              — HTML-Template für Druckansicht
  hooks/
    useInvoices.ts                — React Query hooks für Rechnungen
    useInventory.ts               — React Query hooks für Lager
  components/admin/
    invoices/
      InvoicesPanel.tsx           — Hauptkomponente (Tab: Rechnungen / Lager)
      InvoiceList.tsx             — Tabelle aller Rechnungen
      InvoiceCreateDialog.tsx     — Formular neue Rechnung
      InvoiceDetailDialog.tsx     — Rechnungsdetail + Druckvorschau
      InventoryPanel.tsx          — Lagerübersicht + Wareneingang
      CustomerSelectCombobox.tsx  — Kunden auswählen oder neu anlegen
```

---

### Änderungen an bestehenden Dateien

- **`src/components/admin/AdminSidebar.tsx`** — neuer Menüpunkt `invoices` mit `Receipt`-Icon, eingefügt zwischen `shipping` und `levels`
- **`src/pages/AdminPage.tsx`** — `AdminTab` Typ erweitern, Import `InvoicesPanel`, Tab-Rendering hinzufügen

---

### Sidebar-Eintrag

```text
{ id: 'invoices', label: 'Rechnungen', icon: Receipt }
```

---

### Technische Details (für Entwickler)

- USt-Logik: AT=10%, DE ohne UID=7%, DE mit UID=0% (Reverse Charge)
- Preise sind Bruttopreise; Netto wird rückgerechnet: `netto = brutto / (1 + vat/100)`
- Rechnungsnummer-Format: `YYYY-NNN` (z.B. `2026-001`), atomar via DB-Funktion
- Finalisieren einer Rechnung reduziert den Lagerbestand transaktional
- PDF: Browser-Print mit `@media print` CSS, A4-Format, exaktes Layout nach `invoice-template.md`
- Kein neues npm-Paket nötig
