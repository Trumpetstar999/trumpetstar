

# Digistore24 Produkt-Import im Adminbereich

## Uebersicht

Erweiterung des bestehenden Digistore24-Adminbereichs um eine API-basierte Import-Funktion, die Produkte direkt von Digistore24 abruft, idempotent in die Datenbank schreibt und eine komfortable Zuordnung zu den App-Plaenen (FREE/BASIC/PRO) ermoeglicht.

## Voraussetzungen

- Ein neues Secret `DIGISTORE24_API_KEY` muss gesetzt werden (Vendor API Key aus Digistore24 unter Einstellungen > Kontozugang > API Keys)
- Die Digistore24 API nutzt das Format: `GET https://www.digistore24.com/api/call/listProducts` mit Header `X-DS-API-KEY`

---

## Schritt 1: Secret einrichten

- `DIGISTORE24_API_KEY` als neues Secret anlegen (wird vom Nutzer eingegeben)

## Schritt 2: Datenbank erweitern

Migration auf die bestehende Tabelle `digistore24_products`:

```sql
ALTER TABLE digistore24_products
  ADD COLUMN IF NOT EXISTS raw_payload_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkout_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz DEFAULT now();
```

Neue Tabelle fuer Import-Logs:

```sql
CREATE TABLE digistore24_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',  -- running, success, error
  products_total integer DEFAULT 0,
  products_created integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  error_message text,
  triggered_by uuid REFERENCES auth.users(id)
);

ALTER TABLE digistore24_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import logs"
  ON digistore24_import_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

## Schritt 3: Edge Function `digistore24-import`

Neue Backend-Funktion (`supabase/functions/digistore24-import/index.ts`):

- Authentifizierung: Prueft ob anfragender User Admin-Rolle hat
- Ruft `https://www.digistore24.com/api/call/listProducts` mit dem gespeicherten API Key auf
- Retry-Logik: 1-2 Retries mit exponentiellem Backoff bei temporaeren Fehlern
- Upsert-Logik pro Produkt:
  - Existiert `digistore_product_id` bereits: Update von `name`, `is_active`, `raw_payload_json`, `updated_at`, `imported_at`
  - Existiert nicht: Insert mit `plan_key = 'FREE'` als Default
  - `plan_key` und `checkout_url` werden bei bestehenden Produkten NICHT ueberschrieben
- Schreibt Import-Log (Anzahl total/created/updated, Status, Fehler)
- Gibt Ergebnis als JSON zurueck

## Schritt 4: Admin UI erweitern

Neuer Sub-Tab "Import" im bestehenden `Digistore24Manager.tsx` (neben Settings, Produkte, Logs):

### 4a) Import-Bereich (oben)
- Button "Produkte importieren" mit Loading-Spinner und Erfolgsmeldung
- Anzeige: Letzter Import (Zeitpunkt, Anzahl), API Key Status (nur letzte 4 Zeichen)
- Kleines Import-Log der letzten 10 Imports als kompakte Tabelle

### 4b) Erweiterte Produkt-Tabelle (bestehende `Digistore24ProductsManager`)
- Neue Spalten: Checkout-Link (editierbares Textfeld), Importiert am
- Plan-Dropdown direkt in der Zeile (FREE/BASIC/PRO) mit Sofort-Speicherung + Toast
- Suchfeld/Filter nach Name, Produkt-ID, Plan
- Multi-Select mit Checkbox + Bulk-Plan-Zuweisung
- Sortierung nach Name/Plan klickbar

### 4c) Sicherheit
- API Key wird nie im Frontend angezeigt, nur maskiert (****...last4)
- Alle API-Aufrufe laufen ueber die Edge Function

## Schritt 5: Config

- `supabase/config.toml` erhaelt Eintrag fuer die neue Funktion:
  ```toml
  [functions.digistore24-import]
  verify_jwt = false
  ```

---

## Technische Details

### Digistore24 API Aufruf

```text
GET https://www.digistore24.com/api/call/listProducts
Header: X-DS-API-KEY: <api_key>
Header: Accept: application/json
```

Erwartete Antwort-Struktur (vereinfacht):
```json
{
  "api_version": "...",
  "result": "success",
  "data": {
    "products": [
      { "id": "12345", "name": "Basic Abo", "active": true, ... }
    ]
  }
}
```

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/digistore24-import/index.ts` | Neu: Edge Function |
| `supabase/config.toml` | Neuer Function-Eintrag |
| `src/components/admin/Digistore24Manager.tsx` | Neuer Sub-Tab "Import" |
| `src/components/admin/Digistore24ProductsManager.tsx` | Erweitert: Filter, Bulk, Checkout-Link, Sortierung |
| `src/components/admin/Digistore24ImportPanel.tsx` | Neu: Import-Button + Log-Anzeige |
| DB Migration | Spalten + Import-Log Tabelle |

