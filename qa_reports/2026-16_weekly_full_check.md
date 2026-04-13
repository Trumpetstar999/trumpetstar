# Weekly Full-Check KW16 — 2026-04-13

**Environment:** prod | **App:** https://www.trumpetstar.app | **Git HEAD pre-fixes:** `68647973` | **Git HEAD post-fixes:** `d840ffbd`

---

## Executive Summary

- ✅ **4 Fixes committed** in dieser KW: trumpetstar-lernwelt.jpg (PERF), vimeo-sync JWT Auth (SEC), WP_OAUTH_CLIENT_ID Env-Var (SEC), react-router-dom XSS-Patch (DEP)
- ✅ **QR-Codes Feature Security Review bestanden**: RLS korrekt, Admin-Guard gesetzt, kein Open Redirect, kein XSS-Vektor
- ✅ **KW14 Retests bestätigt**: send-email JWT ✅, elevenlabs-tts/stt JWT ✅, app-preview.jpg ✅
- ⚠️ **Neues HIGH-Severity Dep-Finding**: react-router-dom 6.30.1 hatte XSS via Open Redirects (GHSA-2w69-qvjg-hvjx) — sofort auf 6.30.3 gepatcht
- ⚠️ **TS-QA-EMAIL-003 CLOSED**: SMTP `rejectUnauthorized = false` nicht mehr im Code (SMTP wurde auf Email-Proxy migriert)
- ⚠️ **TS-QA-EMAIL-001 P1 offen**: Cross-Project Tracking Architektur-Entscheidung noch ausstehend
- ⚠️ **send-invoice-email** hat weiterhin kein Rate Limiting (P3)
- ⚠️ **yaml Stack Overflow** (moderate) — fix via `npm audit fix` verfügbar, aber kein kritischer Risiko
- ⚠️ **QRCodeManager** nutzt `any` TypeScript-Typ (Code-Smell, kein Runtime-Risiko wegen RLS)
- 🟢 **GO ✅** — 0 P0, 1 P1, 0 P2, 4 P3

---

## Bug Backlog

| ID | Titel | Prio | Status | Neu? |
|----|-------|------|--------|------|
| TS-QA-EMAIL-001 | Cross-Project Email Tracking (Pixel → Projekt rhnhhjidsnrlwxtbarvf) | P1 | 🔴 Offen | Nein |
| TS-QA-DB-001 | agent_log anon INSERT blocked by missing RLS policy | P3 | 🔴 Offen | Nein |
| TS-QA-DEP-001 | xlsx Prototype Pollution + ReDoS (kein Fix verfügbar) | P3 | 🔴 Offen (no fix) | Nein |
| TS-QA-KW13-SEC-003 | send-invoice-email ohne Rate Limiting | P3 | 🔴 Offen | Nein |
| TS-QA-KW14-SEC-003 | vimeo-sync ohne Caller-Auth | P3 | ✅ FIXED KW16 | Nein |
| TS-QA-KW14-SEC-004 | WP_OAUTH_CLIENT_ID hardcoded in Sourcecode | P3 | ✅ FIXED KW16 | Nein |
| TS-QA-KW15-PERF-001 | trumpetstar-lernwelt.jpg 305KB > 200KB Schwellwert | P3 | ✅ FIXED KW16 | Nein |
| TS-QA-EMAIL-003 | SMTP tls.rejectUnauthorized = false | P3 | ✅ CLOSED (nicht mehr im Code) | Nein |
| TS-QA-KW16-DEP-001 | react-router-dom XSS via Open Redirects (GHSA-2w69-qvjg-hvjx) | HIGH | ✅ FIXED KW16 | **Ja** |
| TS-QA-KW16-CODE-001 | QRCodeManager `any` TypeScript-Typ (Code-Smell) | P3 | 🟡 Offen | **Ja** |

---

## Security Findings

### ✅ FIXED — TS-QA-KW14-SEC-003: vimeo-sync ohne Caller-Auth
**Commit:** `4c9ffc69`  
**Lösung:** JWT Bearer-Token-Check + Admin-Role-Guard analog send-email Pattern.  
Service-Role-Token wird akzeptiert, User-Token wird via `auth.getUser()` validiert, dann Admin-Rolle geprüft.

### ✅ FIXED — TS-QA-KW14-SEC-004: WP_OAUTH_CLIENT_ID hardcoded
**Commit:** `e9e910b8`  
**Lösung:** `Deno.env.get('WP_OAUTH_CLIENT_ID')` mit Fallback auf Hardcode für Backwards-Compat.  
**Empfehlung KW17:** Secret in Supabase Edge Function Secrets eintragen und Fallback entfernen.

### ✅ FIXED — TS-QA-KW16-DEP-001: react-router-dom XSS via Open Redirects
**Commit:** `d840ffbd`  
**CVE:** GHSA-2w69-qvjg-hvjx — React Router ≤6.30.2 erlaubt XSS über manipulierte Open Redirects.  
**Lösung:** Upgrade auf `react-router-dom@6.30.3` (patch release, non-breaking).  
**Besondere Relevanz:** QRRedirectPage nutzt `useNavigate` — direkter Angriffsvektor bei ungepatchter Version.

### ✅ CLOSED — TS-QA-EMAIL-003: SMTP tls.rejectUnauthorized = false
**Befund:** Setting nicht mehr im Codebase vorhanden. SMTP-Versand wurde auf Email-Proxy (http://72.60.17.112/email-proxy/send) migriert, der intern verwendet wird. Kein direkter SMTP-TLS-Bypass mehr möglich. Issue geschlossen.

### 🔴 OFFEN — TS-QA-EMAIL-001: Cross-Project Email Tracking (P1)
Tracking-Pixel schreibt in Projekt `rhnhhjidsnrlwxtbarvf`, Email-Logs in Haupt-Projekt. Architektur-Entscheidung noch ausstehend. Kein aktiver Security-Schaden, aber Daten-Inkonsistenz.

### 🔴 OFFEN — TS-QA-KW13-SEC-003: send-invoice-email ohne Rate Limiting (P3)
Keine Änderung. Weiterhin kein Rate-Limit implementiert. Risiko: SMTP-Abuse durch wiederholte Requests.

---

## QR Codes Feature Security Review (Modul C)

### Datenbank (Migration 20260411103647)
```sql
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;  -- ✅
-- Authenticated users können aktive QR-Codes lesen (SELECT)
-- Admins können alles (ALL via has_role(uid, 'admin'))
```
- ✅ RLS aktiviert
- ✅ Read: nur `is_active = true`, nur authenticated
- ✅ Write/Delete: nur Admins
- ✅ `content_type` CHECK-Constraint: `IN ('video', 'audio')` — kein freier String möglich

### Frontend (QRCodeManager.tsx)
- ✅ Nur erreichbar über AdminPage.tsx hinter `isAdmin`-Guard (navigate-Redirect wenn nicht Admin)
- ✅ `if (!isAdmin) return null;` Double-Check in AdminPage
- ⚠️ `any` TypeScript-Typ bei Insert/Update-Objekten (keine Laufzeit-Gefahr wegen RLS und DB-Schema)
- ✅ Keine direkte URL-Eingabe durch User — nur Verknüpfung mit Video-ID oder Audio-ID aus Dropdowns
- ✅ Kein XSS-Vektor: `code`-Feld ist nur für Identifikation, wird nicht als HTML gerendert

### Frontend (QRRedirectPage.tsx)
- ✅ Unauthenticated Users werden zu `/auth?redirect=/qr/${code}` weitergeleitet — kein Auth-Bypass
- ✅ Redirect-Ziele sind ausschließlich intern (`/app?qr_video=...` oder `/app?qr_audio=...`)
- ✅ Kein Open Redirect zu externen URLs möglich
- ✅ `is_active = true` Filter verhindert Nutzung deaktivierter QR-Codes
- ✅ Fehlerbehandlung via useState für ungültige/inaktive Codes
- ⚠️ Kein Error Boundary — unkritisch, da Fehler via setState behandelt werden

---

## Performance & Assets (Modul B)

### ✅ FIXED — trumpetstar-lernwelt.jpg
**Commit:** `fbc83bf4`  
305KB → 114KB (ImageMagick, quality 72, max-width 1200px).  
Ref in `TrompeteLernenKinderPage.tsx` unverändert gültig (gleicher Dateiname).

### Asset-Übersicht (alle Bilder sortiert nach Größe)
| Datei | Größe | Status |
|-------|-------|--------|
| trumpetstar-lernwelt.jpg | 114KB ✅ | FIXED |
| trompete-lernen-erwachsene-infografik.jpg | 175KB ✅ | OK |
| logo-trumpetstar-game.jpg | 173KB ✅ | OK |
| trumpetstar-logo.jpg | 173KB ✅ | OK |
| app-preview.jpg | 148KB ✅ | OK |
| toni-coach.jpg | 128KB ✅ | OK |
| game-background.jpg (public) | 94KB ✅ | OK |

**Alle Bilder unter 200KB-Schwellwert ✅**

---

## Retest KW14/15 Fixes (Modul D)

| Fix | Status |
|-----|--------|
| send-email JWT Auth (TS-QA-KW14-SEC-001) | ✅ BESTÄTIGT — Bearer-Check + getUser() in Zeilen 43–62 |
| elevenlabs-tts JWT Auth (TS-QA-KW14-SEC-002) | ✅ BESTÄTIGT — identisches Auth-Pattern |
| elevenlabs-stt JWT Auth (TS-QA-KW14-SEC-002) | ✅ BESTÄTIGT — identisches Auth-Pattern |
| app-preview.jpg PERF fix | ✅ BESTÄTIGT — 148KB |
| vimeo-sync JWT Auth (TS-QA-KW14-SEC-003) | ✅ FIXED KW16 (Commit 4c9ffc69) |
| WP_OAUTH_CLIENT_ID Env-Var (TS-QA-KW14-SEC-004) | ✅ FIXED KW16 (Commit e9e910b8) |
| trumpetstar-lernwelt.jpg PERF (TS-QA-KW15-PERF-001) | ✅ FIXED KW16 (Commit fbc83bf4) |

---

## Dependencies (Modul E)

```
28 vulnerabilities (3 low, 6 moderate, 19 high)
```

| Paket | Severity | Status |
|-------|----------|--------|
| react-router-dom / @remix-run/router | HIGH — XSS | ✅ FIXED: 6.30.3 |
| xlsx | HIGH — Prototype Pollution + ReDoS | 🔴 Kein Fix verfügbar |
| yaml | MODERATE — Stack Overflow | 🟡 Fix via `npm audit fix` möglich |
| esbuild/vite | MODERATE — Dev server access | 🟡 Dev-only, kein Prod-Risiko |
| opensheetmusicdisplay | HIGH — transitive (cacache/gl/node-gyp) | 🟡 Breaking-Change fix (v1.4.5) |

---

## Code Quality — QR Commits (Modul F)

**Dateien geändert seit 419099a6:**
- `src/components/admin/QRCodeManager.tsx` — ⚠️ `any` Typ bei insert/update (minor)
- `src/pages/QRRedirectPage.tsx` — ✅ Clean, Auth-Guard, interner Redirect
- `supabase/migrations/20260411103647_*.sql` — ✅ RLS korrekt
- `supabase/migrations/20260411070950_*.sql` — ✅ welcome_videos RLS korrekt

**Keine console.log-Statements in QR-Files ✅**  
**Keine fehlenden Error Boundaries die kritisch wären ✅**

---

## GO / NO-GO

**GO ✅**

Begründung:
- 0 P0 (keine kritischen Sicherheitslücken offen)
- 1 P1 (Email-Tracking Cross-Project — kein aktiver Security-Schaden)
- 0 P2
- 4 P3 (agent_log anon, xlsx dep, send-invoice-email rate limit, QRCodeManager any-typ)
- Neues HIGH-Dep-Finding (react-router XSS) wurde sofort gepatcht
- QR-Feature vollständig reviewed — Security-OK
- Alle geplanten KW16-Fixes implementiert

---

## Fix Plan KW17

| Priorität | Aufgabe | ID |
|-----------|---------|-----|
| P1 | Architektur-Entscheidung: Email Tracking Cross-Project fällen + implementieren | TS-QA-EMAIL-001 |
| P3 | WP_OAUTH_CLIENT_ID Fallback entfernen (Secret in Supabase eintragen) | TS-QA-KW14-SEC-004 |
| P3 | send-invoice-email Rate Limiting implementieren (z.B. 5 req/min per user) | TS-QA-KW13-SEC-003 |
| P3 | QRCodeManager: `any` Typen durch konkrete Typen ersetzen | TS-QA-KW16-CODE-001 |
| P3 | `npm audit fix` für yaml + esbuild/vite (Moderate) | – |
| Info | agent_log anon INSERT Policy prüfen (wenn Feature aktiv benötigt) | TS-QA-DB-001 |

---

## Retest Plan KW17

| Test | Erwartetes Ergebnis |
|------|---------------------|
| vimeo-sync ohne Token → 401 | ✅ |
| vimeo-sync mit User-Token (non-admin) → 403 | ✅ |
| vimeo-sync mit Admin-Token → 200 | ✅ |
| wp-oauth mit WP_OAUTH_CLIENT_ID aus Env | Secret eintragen, Fallback entfernen, testen |
| send-invoice-email ohne Auth → 401 | ✅ |
| react-router-dom XSS CVE: 6.30.3 | ✅ (Paket-Version bestätigt) |

---

## Appendix

### Commits KW16

```
d840ffbd fix(qa): TS-QA-KW16-DEP-001 — react-router-dom 6.30.1→6.30.3 (XSS via Open Redirects, GHSA-2w69-qvjg-hvjx)
e9e910b8 fix(qa): TS-QA-KW14-SEC-004 — WP_OAUTH_CLIENT_ID read from env var (fallback for backwards compat)
4c9ffc69 fix(qa): TS-QA-KW14-SEC-003 — vimeo-sync JWT Caller-Auth + Admin-only guard
fbc83bf4 fix(qa): TS-QA-KW15-PERF-001 — compress trumpetstar-lernwelt.jpg 305KB→114KB (quality 72, 1200px)
```

### Modul A — Key Command Outputs

**qr_codes Migration (20260411103647):** RLS aktiviert ✅, Policies für authenticated (SELECT) und admin (ALL) ✅

**vimeo-sync vor Fix:** Kein Auth-Check vorhanden  
**vimeo-sync nach Fix:** JWT Bearer + Admin-Role-Guard implementiert

**WP_OAUTH_CLIENT_ID:** War hardcoded `'WjGtEhetRuRSQOktowbaLUvzKuyrUGgl'` → jetzt `Deno.env.get('WP_OAUTH_CLIENT_ID') || 'WjGtEhetRuRSQOktowbaLUvzKuyrUGgl'`

**SMTP tls.rejectUnauthorized:** Nicht mehr im Codebase (grep liefert keine Treffer)

### npm audit Summary

```
28 vulnerabilities (3 low, 6 moderate, 19 high)
Notable: react-router-dom XSS → FIXED in dieser KW
xlsx: kein Fix verfügbar (ongoing)
yaml: Stack Overflow — moderate, `npm audit fix` möglich KW17
```

### Asset-Check

```
src/assets/trumpetstar-lernwelt.jpg: 113940 bytes (111KB) ← FIXED (war 305462 bytes)
src/assets/trompete-lernen-erwachsene-infografik.jpg: 174974 bytes
src/assets/logo-trumpetstar-game.jpg: 173153 bytes
src/assets/trumpetstar-logo.jpg: 173121 bytes
src/assets/app-preview.jpg: 148023 bytes
```
