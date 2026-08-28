# Brevo-Anbindung im Adminbereich

Ziel: Alle Kontakte (Leads, registrierte App-Nutzer, Digistore24-Kunden) landen automatisch in Brevo — getrennt nach Sprache (DE / EN / ES / SL). Zusätzlich ein Voll-Sync-Button im Adminbereich für den bestehenden Bestand.

## Was gebaut wird

### 1. Brevo-Verbindung
Brevo wird als Connector verbunden (Connect-Karte im Chat). Alle Aufrufe laufen serverseitig über das Lovable-Gateway — kein API-Key im Frontend.

### 2. Neuer Admin-Tab „Brevo"
Im Marketing-/E-Mail-Bereich des Adminbereichs:
- Verbindungsstatus (Test-Button, zeigt Brevo-Account-Name).
- Auswahl der Brevo-Liste pro Sprache (Listen werden live aus Brevo geladen; neue Liste direkt anlegbar).
- Schalter: Auto-Sync aktiv/inaktiv.
- Buttons „Voll-Sync starten" je Quelle (Leads / App-Nutzer / Kunden) oder alle zusammen, mit Fortschritt und Ergebnis (übertragen / übersprungen / Fehler).
- Sync-Protokoll: letzte Läufe mit Anzahl und Fehlermeldungen.

### 3. Automatischer Sync
- Neuer Lead (Newsletter/Landingpage) → sofort nach Brevo.
- Neue Registrierung → nach Brevo, sobald Sprache bekannt ist.
- Digistore24-Kauf (IPN) → Kontakt nach Brevo, markiert als Kunde.
- Kontaktdaten in Brevo: E-Mail, Vorname, Sprache, Segment, Quelle, Kunde-Ja/Nein. Bestehende Kontakte werden aktualisiert, nicht doppelt angelegt.

## Technische Umsetzung

- **Connector:** `standard_connectors--connect` mit `brevo`; Gateway-Basis `https://connector-gateway.lovable.dev/brevo`, Header `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: BREVO_API_KEY`.
- **DB (Migration):**
  - `brevo_settings` (Singleton-Zeile): `auto_sync_enabled`, `list_id_de/en/es/sl`, Timestamps. RLS + GRANTs: nur Admins lesen/schreiben (`has_role`), `service_role` full.
  - `brevo_sync_log`: `source`, `started_at`, `finished_at`, `synced_count`, `skipped_count`, `error_count`, `last_error`. Admin-Read, `service_role` full.
  - `brevo_contact_state`: `email` (unique), `brevo_contact_id`, `last_synced_at`, `list_id`, `status` — verhindert Doppel-Sync und erlaubt Diff-Läufe.
- **Edge Functions:**
  - `brevo-lists` — GET Listen, POST neue Liste (Admin-JWT-Check).
  - `brevo-sync-contact` — ein Kontakt (E-Mail, Name, Sprache, Segment, Quelle) → `POST /v3/contacts` mit `updateEnabled: true` + `listIds`; schreibt `brevo_contact_state`.
  - `brevo-sync-all` — Batch-Lauf über `leads`, `profiles` + `user_preferences` (Sprache) + `auth.users` (E-Mail via Service-Role) und `digistore24_customers`; verarbeitet in Blöcken von 100 über `POST /v3/contacts/import` und protokolliert in `brevo_sync_log`. Admin-JWT-Pflicht.
  - Alle Funktionen: CORS, Zod-Validierung, Provider-Status/Body bei Fehlern durchreichen.
- **Auto-Sync-Hooks:** Aufruf von `brevo-sync-contact` (fire-and-forget) in `capture-lead`, `digistore24-ipn` (PURCHASE) und beim Speichern der Sprachpräferenz nach der Registrierung; respektiert `auto_sync_enabled`.
- **Frontend:** `src/components/admin/BrevoPanel.tsx` + Eintrag in `AdminSidebar`/`AdminPage`, Design nach `admin.css`, Texte über i18n.

## Voraussetzung
Für den Versand/Import müssen die Sprach-Listen in Brevo existieren oder werden über den Panel-Button angelegt.
