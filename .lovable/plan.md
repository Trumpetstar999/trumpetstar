

## Digistore24: Kunden-, Transaktions- und Abo-Import

### Bestandsaufnahme

Es existiert bereits eine solide Digistore24-Infrastruktur:
- **Tabellen**: `digistore24_settings`, `digistore24_products`, `digistore24_subscriptions`, `digistore24_entitlements`, `digistore24_ipn_events`, `digistore24_import_logs`
- **Edge Functions**: `digistore24-ipn` (Webhook), `digistore24-import` (Produkt-Import)
- **Admin-UI**: Settings, Import, Produkte, IPN-Logs Tabs

Was fehlt: **Kunden-Stammdaten**, **Transaktionshistorie** und ein **Vollimport** aller Bestellungen/Abos via API.

---

### 1. Neue Datenbank-Tabellen

**Tabelle `digistore24_customers`**
- Deduplizierte Kundendaten (nach E-Mail)
- Felder: `digistore_customer_id`, `email` (unique), `first_name`, `last_name`, `company`, `country`, `phone`, `total_purchases`, `total_revenue`, `first_purchase_at`, `last_purchase_at`
- RLS: Nur Admins

**Tabelle `digistore24_transactions`**
- Einzelne Kaufvorgaenge
- Felder: `digistore_transaction_id` (unique), `customer_id` (FK), `product_id`, `product_name`, `amount`, `currency`, `status`, `payment_method`, `pay_date`, `refund_date`, `raw_data` (jsonb)
- RLS: Nur Admins

**Tabelle `digistore24_sync_log`**
- Protokoll aller Sync-Vorgaenge (manuell + webhook)
- Felder: `sync_type`, `status`, `records_imported`, `records_updated`, `error_message`, `started_at`, `completed_at`
- RLS: Nur Admins

---

### 2. Neue Edge Functions

**`digistore24-sync`** (Manueller Vollimport)
- Liest API-Key aus Supabase Secret `DIGISTORE24_API_KEY`
- Ruft `listTransactions` paginiert ab (alle Seiten)
- Dedupliziert Kunden nach E-Mail, fuehrt UPSERT durch
- Berechnet `total_purchases` und `total_revenue` pro Kunde
- Aktualisiert bestehende `digistore24_subscriptions` mit Abo-Daten
- Schreibt Log in `digistore24_sync_log`
- Admin-Auth-Check via `getClaims()` + `user_roles`

**`digistore24-test-connection`** (API-Verbindungstest)
- Nimmt keinen API-Key als Parameter (nutzt den gespeicherten Secret)
- Macht einen Minimal-Call (`listProducts` mit `items_per_page=1`)
- Gibt `{ valid: true/false, message: "..." }` zurueck
- Admin-Auth-Check

---

### 3. Erweiterung der Admin-UI

Neuer Sub-Tab **"Kunden"** im bestehenden `Digistore24Manager`:

```
Einstellungen | Import | Produkte | Kunden | IPN Logs
```

**Sektion: Statistik-Karten** (oben, 4 Cards)
- Gesamtkunden (Users-Icon)
- Gesamtumsatz in EUR (Euro-Icon, formatiert)
- Aktive Abos (CreditCard-Icon)
- Transaktionen (Receipt-Icon)

**Sektion: Import-Steuerung**
- "Alle Daten jetzt importieren" Button (ruft `digistore24-sync` auf)
- "Verbindung testen" Button (ruft `digistore24-test-connection` auf)
- Letzte 10 Sync-Logs als Tabelle

**Sektion: Kunden-Tabelle**
- Suche nach Name/E-Mail
- Sortierung nach Name, Umsatz, letztem Kauf
- Spalten: Name, E-Mail, Kaeufe, Umsatz (EUR), Aktive Abos, Letzter Kauf
- Detail-Button pro Zeile

**Kunden-Detail Sheet**
- Header: Initialen-Avatar, Name, E-Mail, Land, Umsatz
- Tab "Transaktionen": Alle Kaeufe mit Datum, Produkt, Betrag, Status (farbcodiert)
- Tab "Abonnements": Alle Abos mit Status-Badge, Betrag, Intervall
- Tab "Rohdaten": JSON-Viewer

---

### 4. Anpassung bestehender IPN-Function

Die bestehende `digistore24-ipn` wird erweitert, um bei jedem Event auch `digistore24_customers` und `digistore24_transactions` zu befuellen -- so wachsen die Daten auch zwischen manuellen Imports automatisch mit.

---

### Technische Details

**Neue Dateien:**
- `supabase/functions/digistore24-sync/index.ts`
- `supabase/functions/digistore24-test-connection/index.ts`
- `src/components/admin/Digistore24CustomersPanel.tsx` (Kunden-Tab mit Stats, Tabelle, Detail-Sheet)

**Geaenderte Dateien:**
- `src/components/admin/Digistore24Manager.tsx` -- neuer "Kunden" Sub-Tab
- `supabase/functions/digistore24-ipn/index.ts` -- zusaetzliche Writes in `customers` + `transactions`
- `supabase/config.toml` -- neue Edge Functions registrieren
- Migration: 3 neue Tabellen mit RLS-Policies

**Sicherheit:**
- Alle neuen Tabellen: RLS mit `has_role(auth.uid(), 'admin')` fuer ALL
- Edge Functions: `verify_jwt = false`, Auth-Check im Code
- API-Key wird nur serverseitig in Edge Functions verwendet (aus Secret)
- Webhook-Endpoints antworten immer HTTP 200

