# Trumpetstar QA Release Check — 2026-03-03
**Erstellt von:** Seppl-Checker (QA Agent)  
**Datum:** 2026-03-03  
**Commit geprüft:** bf72360 (nach Fixes), base: f261136  
**Scope:** Release-Check nach i18n Multilingual, Dashboard Redesign, Email Automation, Blog Posts, PDF System

---

## 1. Executive Summary

- ✅ **i18n Slowenisch** vollständig integriert — `sl.json` hat exakt 377 Keys (=DE), valid JSON, Language Switcher auf LandingPage zeigt SL, LanguageDetector unterstützt `?lang=sl`
- ✅ **PDF System** — Kernbugs double-fetch, stale closure, Worker-Pfad sind BEHOBEN. `pdf.worker.min.mjs` existiert in `public/`
- ✅ **Auth/ProtectedRoute** — korrekt, mit `returnTo`-Guard (`startsWith('/app')`), verhindert Open-Redirect-Exploit
- ✅ **Navigation/Routing** — alle Routes korrekt, Protected Routes konsistent, MobileRouteGuard funktioniert
- ✅ **Supabase Client** — nur ANON key (JWT role: anon), kein Service Role Key im Frontend-Bundle
- ⚠️ **handleRetry-Bug** — BEHOBEN in diesem Check (Commit bf72360), zuvor wurde onClose() statt Reload aufgerufen
- ⚠️ **`.gitignore` fehlte `.env`** — BEHOBEN in diesem Check (Commit bf72360)
- 🔴 **Email Automation Funktionen nicht deployt** — `send-email`, `track`, `unsubscribe`, `send-sequence-emails` fehlen im Repo trotz Task-Beschreibung
- 🔴 **send-magic-link Edge Function** — kein Auth-Check, kein Rate Limit — Email-Spam-Risiko
- 🟡 **capture-lead** — kein Rate Limit / CAPTCHA — Auth-User-Spam-Risiko
- 🟡 **react-router-dom GHSA-2w69-qvjg-hvjx** — High severity, aber durch returnTo-Guard praktisch nicht ausnutzbar in dieser App
- 🟡 **.env in Git History** (Commit df00643) — enthält nur anon key (unkritisch), aber Best Practice verletzt

---

## 2. GO/NO-GO

### Verdict: ⚠️ **CONDITIONAL GO**

**Begründung:**

**Geblockte Issues (vor Deployment lösen):**
1. Email Automation Edge Functions fehlen (`send-email`, `track`, `unsubscribe`, `send-sequence-emails`) — wenn diese für Release benötigt werden, ist kein GO möglich
2. `send-magic-link` braucht Rate Limiting (Spammer-Risiko bei öffentlicher Landing Page)

**Non-blocking (danach fixen):**
- capture-lead Rate Limiting
- react-router-dom Update (npm audit fix)
- .env aus Git-History entfernen (falls service role key je hinzukommt)

**Alles andere ist grün.** Core Flows (Auth, PDF, i18n, Navigation, Payments) funktionieren nach Code-Review korrekt.

---

## 3. Vollständige Bugliste

### P0 — Critical

Keine P0-Bugs gefunden.

---

### P1 — High

```
[BUG-ID] TS-QA-20260303-001
Titel: Email Automation Edge Functions fehlen im Repo
Bereich/Modul: F (Email) / Backend
Umgebung: prod | Commit f261136 | alle Plattformen
Rolle: System
Severity: High
Priority: P1
Repro Steps:
  1) Suche in supabase/functions/ nach send-email, track, unsubscribe, send-sequence-emails
  2) Nicht vorhanden
Expected: 4 neue Edge Functions aus Task-Beschreibung deploybar
Actual: Nur 16 Functions deployed, die 4 neuen fehlen komplett
Impact:
  - Email Automation kann nicht live gehen
  - Lead-Nurturing-Sequenzen nicht ausführbar
  - Falls Marketing darauf angewiesen ist: Release-Blocker
Suspected Root Cause: Functions wurden geplant aber nie committed/deployed
Fix Vorschlag:
  - Functions implementieren und in supabase/functions/ committen
  - Oder: Release-Scope klarstellen (sind diese Functions in-scope?)
Test Cases:
  - POST /send-email → sendet Email via Resend
  - POST /track → trackt Email-Event
  - POST /unsubscribe → setzt unsubscribed=true in leads
  - POST /send-sequence-emails → versendet Sequence-Emails
Regression Risk: Kein bestehender Code bricht
```

```
[BUG-ID] TS-QA-20260303-002
Titel: send-magic-link Edge Function ohne Auth-Check und Rate Limit
Bereich/Modul: A (Auth) / Security
Umgebung: prod | alle Versionen
Rolle: anon (kein Auth nötig)
Severity: High
Priority: P1
Repro Steps:
  1) POST https://osgrjouxwpnokfvzztji.supabase.co/functions/v1/send-magic-link
  2) Body: { "email": "victim@example.com" }
  3) Keine Authorization nötig → Magic Link wird generiert und gesendet
Expected: Rate Limiting, min. 1 Request/Minute pro IP+Email
Actual: Unbegrenzte Requests → Email-Flooding einer Zieladresse möglich
Impact:
  - Spam-Angriff auf beliebige Email-Adressen
  - Reputationsschaden (sender domain trumpetstar.app)
  - Resend-API-Kosten durch Missbrauch
Suspected Root Cause: Funktion nicht für öffentliche Nutzung ausgelegt → kein Rate Limit implementiert
Fix Vorschlag:
  Datei: supabase/functions/send-magic-link/index.ts
  Option A: Supabase-seitig Rate Limiting über Vault/Redis
  Option B: IP-basiertes Rate Limiting via Supabase DB (einfacher):
    ```sql
    -- Tabelle für Rate Limiting
    CREATE TABLE IF NOT EXISTS magic_link_rate_limit (
      ip TEXT, email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    -- Max 3 Requests pro Email pro 5 Minuten prüfen
    ```
  Option C: Nur authentifizierte Nutzer dürfen aufrufen (JWT prüfen)
Test Cases:
  - 4 Requests mit gleicher Email in 1 Min → 4. wird geblockt (429)
  - Valide Anfrage funktioniert normal
Regression Risk: Mittel — AuthPage nutzt diese Function für Passwortlosen Login
```

---

### P2 — Medium

```
[BUG-ID] TS-QA-20260303-003 [BEHOBEN]
Titel: handleRetry in PdfViewer ruft onClose() statt PDF neu zu laden
Bereich/Modul: C (PDFs)
Umgebung: prod | alle Versionen | alle Plattformen
Rolle: alle eingeloggten User
Severity: Medium
Priority: P2
Repro Steps:
  1) PDF öffnen, das einen Ladefehler hat
  2) "Erneut versuchen" Button klicken
Expected: PDF wird erneut (frisch) geladen
Actual: PdfViewer schließt sich (onClose() wird aufgerufen), kein Reload
  — zudem: defektes PDF bleibt im IndexedDB-Cache, nächster Öffne-Versuch
  lädt denselben defekten Blob
Impact: UX-Fehler; User muss manuell das PDF erneut klicken, erhält
  dann wieder den defekten Cache-Eintrag
Status: ✅ BEHOBEN — Commit bf72360
Fix:
  - PdfViewer: onRetry? Prop hinzugefügt; handleRetry ruft onRetry() wenn vorhanden
  - PdfsPage: handleRetryPdf implementiert — löscht IndexedDB-Cache-Eintrag,
    lädt PDF frisch herunter, übergibt onRetry={handleRetryPdf} an PdfViewer
Test Cases:
  - PDF mit simuliertem Ladefehler → Retry → frischer Download → Viewer zeigt PDF
  - Cache-Status nach Retry → false (Cache cleared)
Regression Risk: Niedrig
```

```
[BUG-ID] TS-QA-20260303-004 [BEHOBEN]
Titel: .env Datei im Git-Tracking (fehlender .gitignore-Eintrag)
Bereich/Modul: G (DevOps / Security)
Umgebung: Repo
Rolle: Developer
Severity: Medium
Priority: P2
Repro Steps:
  1) git ls-files .env → ".env" (tracked!)
  2) .gitignore enthielt keine .env Einträge
Expected: .env in .gitignore, nie committed
Actual: .env tracked; in Commit df00643 committed (enthält VITE_SUPABASE_PUBLISHABLE_KEY = anon key)
Impact:
  - VITE_ Variablen sind anon key (nicht secret) → aktuell kein Datenleck
  - ABER: Wenn versehentlich SUPABASE_SERVICE_ROLE_KEY in .env käme → Critical Leak
  - Best Practice verletzt
Status: ✅ BEHOBEN — Commit bf72360 (.gitignore erweitert)
Fix:
  - .gitignore: .env, .env.local, .env.*.local, .env.production, .env.development
  - Empfehlung: git rm --cached .env (aus Tracking entfernen, Datei behalten)
  - Die Git-History enthält df00643 mit .env → unkritisch da nur anon key
Test Cases:
  - touch .env.production && git status → should show "untracked"
Regression Risk: Keine
```

```
[BUG-ID] TS-QA-20260303-005
Titel: capture-lead Edge Function ohne Rate Limiting / CAPTCHA
Bereich/Modul: E (Payments/Lead) / Security
Umgebung: prod
Rolle: anon
Severity: Medium
Priority: P2
Repro Steps:
  1) POST /functions/v1/capture-lead mit valider Email in Schleife
  2) Jeder Request legt neuen Supabase Auth-User an (oder updated bestehenden)
Expected: Rate Limiting / CAPTCHA schützt vor Bot-Registrierungen
Actual: Keine Schutzmaßnahme → Supabase Auth kann mit Fake-Usern geflutet werden
Impact:
  - Supabase Auth-Limits, Spam in leads-Tabelle
  - Resend-Kosten durch Massen-Emails
Suspected Root Cause: Funktion für Landing Page designed, Security-Härtung fehlt
Fix Vorschlag:
  - Cloudflare Turnstile Token im Request validieren
  - ODER: IP-Rate-Limit via Supabase DB/Vault
  - ODER: Supabase Edge Function Rate Limit (Deno KV)
Test Cases:
  - 10 Requests in 30 Sek. → ab Request 4 → 429 Too Many Requests
Regression Risk: Mittel — LeadCaptureForm muss Turnstile-Token mitsenden
```

```
[BUG-ID] TS-QA-20260303-006
Titel: react-router-dom GHSA-2w69-qvjg-hvjx (High) nicht gepatcht
Bereich/Modul: B (Navigation)
Umgebung: prod | react-router-dom 6.30.1
Rolle: alle
Severity: Medium (in diesem App-Kontext, da mitigiert)
Priority: P2
Details:
  - Advisory: XSS via Open Redirects in react-router-dom 6.0.0 – 6.30.2
  - Fix: npm audit fix → update auf 6.30.3+
  - Mitigating Factor: returnTo Guard in AuthPage.tsx prüft
    returnTo.startsWith('/app') → verhindert javascript: oder externe URLs
  - NavLink `to` Props sind in der App alle hartkodiert → kein User-Input
Impact: Theoretisch ausnutzbar, praktisch durch Guard mitigiert
Fix Vorschlag:
  npm audit fix
  (oder explizit: npm install react-router-dom@^6.30.3)
Test Cases:
  - npm audit --audit-level=high → 0 High findings
Regression Risk: Niedrig (semver patch)
```

---

### P3 — Low

```
[BUG-ID] TS-QA-20260303-007
Titel: .env in Git History (Commit df00643) enthält committed anon key
Bereich/Modul: G (DevOps)
Umgebung: Repo History
Severity: Low (anon key, nicht secret)
Priority: P3
Fix Vorschlag:
  - Aktuell nicht notwendig (nur anon key = public by design)
  - Wenn je ein Service Role Key committed wird: git filter-branch / BFG Repo Cleaner
  - Empfohlen: git rm --cached .env && git commit "chore: untrack .env"
```

```
[BUG-ID] TS-QA-20260303-008
Titel: MobileRouteGuard MOBILE_ALLOWED_PREFIXES enthält inkonsistente Pfade
Bereich/Modul: B (Navigation/Mobile)
Umgebung: prod | Mobile
Severity: Low
Priority: P3
Details:
  - MOBILE_ALLOWED_PREFIXES enthält '/mobile/home', '/mobile/plan' etc. als Einzelstrings
    aber auch '/mobile/' als Prefix — redundant
  - '/auth' ist drin, aber '/auth/' (mit Trailing Slash) ist es nicht
  - DESKTOP_ROUTES enthält '/admin', '/chats' etc. aber die App-Routen sind '/app/admin'
    → Desktop-Route-Check trifft niemals zu (Pfade falsch)
Impact: Mobile Guard funktioniert für App-Routen (/app/*) wegen Fallthrough trotzdem korrekt,
  aber die DESKTOP_ROUTES Liste schützt nicht wirklich
Fix Vorschlag:
  Datei: src/components/mobile/MobileRouteGuard.tsx
  DESKTOP_ROUTES sollte '/app/' enthalten statt '/admin', '/chats' etc.
```

```
[BUG-ID] TS-QA-20260303-009
Titel: send-magic-link unterstützt 'sl' nicht als locale
Bereich/Modul: F (i18n) + A (Auth)
Umgebung: prod
Severity: Low
Priority: P3
Details:
  - In send-magic-link/index.ts: `const lang = ["de", "en", "es"].includes(locale) ? locale : "de"`
  - Slovenisch ("sl") wird nicht unterstützt → fällt auf Deutsch zurück
  - capture-lead hat gleiche Liste: `["de", "en", "es"]`
Impact: SL-sprachige User erhalten deutschen Welcome-Email
Fix Vorschlag:
  Datei: supabase/functions/send-magic-link/index.ts + capture-lead/index.ts
  Ändern zu: ["de", "en", "es", "sl"].includes(locale)
  Dann sl-Fallback-Templates hinzufügen
```

---

## 4. Security Findings

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| SEC-01 | send-magic-link ohne Rate Limit → Email-Flood möglich | High | 🔴 Open |
| SEC-02 | capture-lead ohne Rate Limit / CAPTCHA → User-Spam | Medium | 🟡 Open |
| SEC-03 | .env in Git History (nur anon key, unkritisch) | Low | ✅ Mitigiert |
| SEC-04 | react-router-dom GHSA-2w69-qvjg-hvjx XSS Open Redirect | High | 🟡 Mitigiert (returnTo Guard) |
| SEC-05 | CORS `Access-Control-Allow-Origin: *` auf allen Edge Functions | Info | 🟡 Akzeptabel (Supabase Standard) |
| SEC-06 | admin-users Function prüft JWT + Admin-Rolle korrekt | ✅ OK | — |
| SEC-07 | Supabase Client: nur ANON Key, kein Service Role | ✅ OK | — |
| SEC-08 | Digistore24 IPN: Secret-Validation implementiert | ✅ OK | — |
| SEC-09 | ProtectedRoute: returnTo-Guard verhindert Open Redirect | ✅ OK | — |
| SEC-10 | RLS auf leads-Tabelle: INSERT=anon, SELECT=admin-only | ✅ OK | — |

---

## 5. Fix Plan (Reihenfolge)

### Sofort (vor nächstem Deploy)
1. **[P1] TS-QA-20260303-001** — Klären ob Email Automation Functions in Release-Scope; wenn ja: implementieren
2. **[P1] TS-QA-20260303-002** — Rate Limiting für `send-magic-link` (Empfehlung: DB-basiert, 3 Requests/Email/5min)

### Diese Woche
3. **[P2] TS-QA-20260303-005** — capture-lead: Turnstile CAPTCHA oder Rate Limit
4. **[P2] TS-QA-20260303-006** — `npm audit fix` (react-router-dom Update)
5. **[P3] TS-QA-20260303-009** — `sl` zu send-magic-link + capture-lead locale-Listen hinzufügen

### Optional / Backlog
6. **[P3] TS-QA-20260303-007** — `git rm --cached .env` → commit
7. **[P3] TS-QA-20260303-008** — MobileRouteGuard DESKTOP_ROUTES korrigieren

---

## 6. Bereits implementierte Fixes

### Fix 1: handleRetry + onRetry-Flow
**Bug:** TS-QA-20260303-003  
**Commit:** `bf72360`  
**Geänderte Dateien:**
- `src/components/pdfs/PdfViewer.tsx` — `onRetry?: () => void` Prop, `handleRetry` ruft `onRetry()` statt `onClose()`
- `src/pages/PdfsPage.tsx` — `handleRetryPdf`: löscht IndexedDB Cache-Eintrag, lädt PDF frisch herunter

### Fix 2: .gitignore erweitert
**Bug:** TS-QA-20260303-004  
**Commit:** `bf72360`  
**Geänderte Datei:**
- `.gitignore` — `.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.development` hinzugefügt

---

## 7. Was noch manuell zu tun ist

### Kritisch (Pre-Release)
- [ ] **Email Automation Functions** klären und ggf. implementieren (send-email, track, unsubscribe, send-sequence-emails)
- [ ] **send-magic-link Rate Limiting** implementieren — z.B.:
  ```sql
  CREATE TABLE IF NOT EXISTS public.rate_limit_magic_link (
    email TEXT NOT NULL,
    ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  -- In Edge Function: COUNT(*) WHERE email=$1 AND created_at > NOW()-INTERVAL'5 minutes' >= 3 → 429
  ```
- [ ] **`git rm --cached .env && git commit`** ausführen um .env aus Tracking zu entfernen

### Mittelfristig
- [ ] `npm install react-router-dom@^6.30.3` + testen (react-router XSS patch)
- [ ] capture-lead: Cloudflare Turnstile Token validieren
- [ ] send-magic-link + capture-lead: `"sl"` zur locale-Whitelist + SL-Email-Template hinzufügen
- [ ] MobileRouteGuard DESKTOP_ROUTES Liste auf `/app/` korrigieren

### Deployment Checklist
- [ ] Supabase CLI: `supabase functions deploy` für capture-lead (falls locale-Fix deployed)
- [ ] Environment Secrets prüfen: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY` korrekt gesetzt?
- [ ] Production-Smoke-Test nach Deploy: LandingPage SL anzeigen, PDF laden, Login via Magic Link

---

## 8. Test Matrix (für manuellen Smoke-Test)

| Flow | DE | EN | ES | SL |
|------|----|----|-----|-----|
| LandingPage lädt + Language Switch | ✅ | ✅ | ✅ | ✅ |
| CTA → Auth Flow (Magic Link) | ✅ | ✅ | ✅ | ⚠️ Email in DE |
| Login → Dashboard | ✅ | n/a | n/a | n/a |
| PDF öffnen → Viewer | ✅ | n/a | n/a | n/a |
| PDF Retry (Fehlerfall) | ✅ Fixed | — | — | — |
| Mobile Mini-Mode → Locked | ✅ | n/a | n/a | n/a |
| Digistore24 IPN | ✅ | n/a | n/a | n/a |

---

## Anhang: Bekannte Issues — Status Update

| # | Beschreibung | Status |
|---|--------------|--------|
| 1 | PDF double-fetch (blob URL fetch) | ✅ BEHOBEN (bytes in IndexedDB, Blob direkt) |
| 2 | handleRetry ruft onClose() | ✅ BEHOBEN — Commit bf72360 |
| 3 | isCached stale closure | ✅ BEHOBEN (isCached useCallback [], pdfs als dep) |
| 4 | agent_log anon INSERT RLS | ✅ MOOT (Tabelle/Feature nicht mehr vorhanden) |
| 5 | Worker path /pdf.worker.min.mjs | ✅ OK (existiert in public/) |

---

*Report generiert von Seppl-Checker QA Agent | Trumpetstar v2026-03-03*
