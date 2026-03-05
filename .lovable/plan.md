
## Analyse

**CSV-Datei enthält 12 Nutzer** (Zeilen 2–13) mit diesen relevanten Feldern:
- Bestell-ID (z.B. `9ZMWKKXR`)
- Zahlungsstatus (`Zahlungen aktiv` = aktiv)
- Letzte Transaktion (Zahlung/Rückgabe)
- Nächste Zahlung am (Zukunftsdatum → Abo läuft noch)
- E-Mail, Vorname, Nachname, Land
- Produkt-ID `575565` → entspricht dem PRO/PREMIUM-Plan
- Abrechnungstyp: monatlich oder jährlich
- Wiederkehrende Umsätze (€59/Monat oder €600/Jahr)

**Abo-Prüfung auf Aktivität**: Alle 12 Nutzer haben `Zahlungsstatus = "Zahlungen aktiv"` und eine Nächste-Zahlung im März/April 2026 — also aktive Abos. Eine hat eine Rückgabe als letzte Transaktion (Gerald Kiedler, `geryk@gmx.at`) aber der Status ist trotzdem noch aktiv.

**Bestehende Infrastruktur**:
- `digistore24_customers` — CRM mit email, first_name, last_name, total_revenue, total_purchases
- `digistore24_subscriptions` — Abo-Tabelle mit digistore_order_id, digistore_product_id, status, period_end
- `user_memberships` — Plan pro Auth-User
- Nutzer haben **noch keinen Auth-Account** (kein Login) — da sie nur via Digistore24 gekauft haben, existieren sie bisher nicht in der App

**Was „importiere in die Nutzerliste" bedeutet**: Die Nutzer in `digistore24_customers` + `digistore24_subscriptions` anlegen, damit sie in der Admin-Nutzerliste unter dem Digistore24-Kunden-Wert erscheinen. Auth-Accounts werden **nicht** erstellt (Policy-Constraint aus Memory).

## Plan

### Was wird gemacht

1. **CSV-Upload-Funktion in der Admin-UI** (neues Panel "CSV-Import" im Digistore24-Bereich): Admin lädt die CSV-Datei hoch, die Funktion parst sie clientseitig und sendet die Daten.

2. **Edge Function `digistore24-csv-import`**: Nimmt die geparsten CSV-Zeilen entgegen und führt für jeden Eintrag folgendes durch:
   - Validierung: Nur Einträge mit `Zahlungen aktiv` werden importiert
   - Upsert in `digistore24_customers` (per E-Mail) mit Name, Land, Umsatz
   - Upsert in `digistore24_subscriptions` (per `digistore_order_id`) mit Status, Produkt-ID, Ablaufdatum (Nächste Zahlung - 1 Tag = current_period_end)
   - Bei vorhandenen Auth-Accounts: Membership auf PRO/PREMIUM setzen

3. **Ergebnis**: Die Nutzer erscheinen im Admin-Bereich unter "Kunden" mit Transaktionshistorie und im UserList unter Kundenwert.

### Dateien

- **NEU**: `supabase/functions/digistore24-csv-import/index.ts` — Edge Function
- **NEU**: `src/components/admin/Digistore24CSVImportPanel.tsx` — Upload-UI mit Vorschau und Import-Ergebnis
- **GEÄNDERT**: `src/components/admin/Digistore24Manager.tsx` — neuen Tab "CSV-Import" hinzufügen

### CSV-Mapping

```
"Bestell-ID"          → digistore_order_id
"Prd-ID"              → digistore_product_id
"E-Mail"              → email
"Vorname"             → first_name
"Nachname"            → last_name
"Land"                → country
"Erste Zahlung am"    → first_purchase_at
"Wiederkehrende Umsätze" → total_revenue (als Zahl)
"Zahlungsstatus"      → status check: "Zahlungen aktiv" → active, sonst → cancelled
"Nächste Zahlung am"  → current_period_end (in digistore24_subscriptions)
"Abrechnungstyp"      → monatlich/jährlich (info)
```

### Validierungslogik

- Nur Zeilen mit `Zahlungsstatus == "Zahlungen aktiv"` werden als aktive Abos importiert
- Zeilen mit anderem Status werden als `cancelled` markiert (z.B. bei Rückgabe)
- Duplikate werden per `ON CONFLICT` auf `digistore_order_id` verhindert (idempotent)
