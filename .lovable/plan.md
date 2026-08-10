# Quartals-Export für die Buchhaltung

Neuer Bereich im Adminbereich → Rechnungen: ein Quartals-Export, der alle Rechnungen eines Quartals als ZIP-Datei bereitstellt — fertig zum Weitergeben an die Steuerberaterin.

## Was der Nutzer sieht

Im Tab „Rechnungen" ein neuer Button **„Quartals-Export"**. Er öffnet einen kleinen Dialog:

- Auswahl Jahr (z. B. 2026) und Quartal (Q1–Q4)
- Anzeige, wie viele Rechnungen im Zeitraum liegen und die Summe (Netto / USt / Brutto)
- Option: nur finalisierte Rechnungen (Standard) oder inkl. Entwürfe
- Button „ZIP herunterladen" mit Fortschrittsanzeige (z. B. „Rechnung 4 von 17")

Ergebnis: `Buchhaltung_2026_Q1.zip`

```text
Buchhaltung_2026_Q1.zip
├── Uebersicht_2026_Q1.xlsx
└── Belege/
    ├── 2026-001_Musterkunde.pdf
    ├── 2026-002_Musik-Instrumentenhaus.pdf
    └── ...
```

## Excel-Übersicht

Ein Blatt „Rechnungen" mit einer Zeile pro Rechnung:
Rechnungsnummer, Rechnungsdatum, Fälligkeitsdatum, Kunde, Firma, Land, UID, USt-Satz, Netto, USt-Betrag, Brutto, bezahlt, offen, Status, Dateiname des Belegs.

Darunter eine Summenzeile mit Excel-Formeln (SUMME über die Spalten Netto/USt/Brutto), damit die Steuerberaterin nachrechnen kann. Zusätzlich ein Blatt „USt-Zusammenfassung": Summen je USt-Satz (10 % AT, 7 % DE B2C, 0 % Reverse Charge) mit Hinweistext für steuerfreie innergemeinschaftliche Lieferungen.

Formatierung: Arial, Kopfzeile fett mit dezenter Füllung, Beträge als `#,##0.00`, Datum als `TT.MM.JJJJ`, Spaltenbreiten gesetzt, Kopfzeile fixiert.

## Technische Umsetzung

- Neue Abhängigkeiten: `jszip` und `html2pdf.js` (Typdeklaration für html2pdf existiert bereits im Projekt). `xlsx` ist bereits installiert — für Zellformatierung und Formeln nutze ich `xlsx` mit expliziten Cell-Objekten (`t`, `f`, `z`).
- Datenabruf: eine Query auf Rechnungen im Zeitraum `invoice_date >= Quartalsstart` und `<= Quartalsende`, inklusive Kunde und Positionen (gleiche Select-Struktur wie im bestehenden Detail-Dialog), sortiert nach Rechnungsnummer.
- PDF-Erzeugung: das bestehende `generateInvoiceHTML` aus `src/lib/invoice-print.ts` wird wiederverwendet. Das HTML wird in einen versteckten Off-Screen-Container gerendert und über `html2pdf.js` als A4-PDF-Blob (`output('blob')`) erzeugt — also echte PDF-Dateien im ZIP, kein Druckdialog pro Rechnung.
- Neue Datei `src/lib/accounting-export.ts` mit `buildQuarterExport(year, quarter, options, onProgress)`: lädt Daten, erzeugt PDFs sequenziell (verhindert Speicherspitzen), baut die XLSX-Datei, packt alles per JSZip und löst den Download aus.
- Neue Komponente `src/components/admin/invoices/QuarterExportDialog.tsx`, eingebunden über einen Button in `InvoiceList` (neben „Neue Rechnung"), im bestehenden Admin-Design (`admin.css`).
- Keine Datenbank- oder Schemaänderungen nötig.

## Verifikation

Nach der Umsetzung erzeuge ich einen Test-Export für das Quartal mit vorhandenen Rechnungen, entpacke die ZIP, prüfe die PDFs seitenweise als Bild auf korrekte Darstellung (Positionen, Summen, Logo) und öffne die XLSX zur Kontrolle von Werten, Formeln und Formatierung.
