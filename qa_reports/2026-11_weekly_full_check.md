# QA Weekly Full-Check — KW2026-11 | 2026-03-09

**Agent:** Seppl-Checker  
**Repo:** /root/.openclaw/workspace/trumpetstar  
**Last Commit:** `04256d7` — feat: send-email with tracking pixel + RPC logging  
**Environment:** prod · https://www.trumpetstar.app  
**Supabase:** https://osgrjouxwpnokfvzztji.supabase.co  

---

## Environment & Build

| Property | Value |
|---|---|
| Node | v22.22.0 |
| Build Tool | Vite + Bun |
| TypeScript | ✅ Clean (no errors, `npx tsc --noEmit`) |
| Migrations (total) | 61 |
| Last migration | `20260306170000_email_log_tracking.sql` |
| Edge Functions | 22 functions |
| npm audit | 24 vulns (16 high, 5 moderate, 3 low) |
| Service Role Key in src/ | ✅ NONE — not found |
| Hardcoded secrets in src/ | ✅ NONE — all keys via `import.meta.env.VITE_*` |

---

## Executive Summary (max 10 Bullets)

1. ✅ **TypeScript:** Kompiliert sauber — 0 Fehler.
2. ✅ **TS-QA-PDF-001 FIXED:** `usePdfCache` speichert als `Uint8Array`-Bytes, kein Blob-URL-Re-Fetch.
3. ✅ **TS-QA-PDF-002 FIXED:** `handleRetry` in `PdfViewer.tsx` nutzt `onRetry` wenn vorhanden; `PdfsPage.tsx` übergibt `handleRetryPdf` korrekt.
4. ✅ **TS-QA-PDF-003 FIXED:** `isCached` ist im `useEffect`-Dependency-Array in `PdfsPage.tsx` — kein Stale Closure mehr.
5. ⚠️ **TS-QA-DB-001 OPEN:** `agent_log`-Tabelle taucht in keiner Migration auf — Status unklar (existiert sie überhaupt?).
6. 🔴 **TS-QA-EMAIL-001 (P1 — NEU):** Tracking-Pixel zeigt auf **separates** Supabase-Projekt (`rhnhhjidsnrlwxtbarvf`), Log-Einträge werden im **Haupt**-Projekt erstellt. Tracking schlägt fehl, wenn das sekundäre Projekt nicht korrekt konfiguriert ist.
7. 🟠 **TS-QA-EMAIL-002 (P2 — Sicherheit):** `email_log` RLS-Policies nutzen `TO public` — anon-User können ALLE E-Mail-Einträge lesen/schreiben (inkl. Empfängeradressen, Betreffs).
8. 🟡 **TS-QA-EMAIL-003 (P3):** SMTP-TLS-Config: `tls: { rejectUnauthorized: false }` — Man-in-the-Middle-Risiko bei SMTP.
9. ⚠️ **Dependency Risiko (P2):** `xlsx`-Paket — Prototype Pollution + ReDoS, kein Fix verfügbar. 16 High-Vulns insgesamt (keine Criticals).
10. ✅ **Keine Service-Role Keys im Frontend** — sauber. Alle Secrets nur in Edge Function Env-Vars.

---

## Bugliste P0→P3

| ID | Prio | Titel | Status | Modul |
|---|---|---|---|---|
| TS-QA-EMAIL-001 | **P1** | Cross-Project Tracking: Pixel → rhnhhjidsnrlwxtbarvf, Log → Haupt-Projekt | **OPEN** | Email-Tracking |
| TS-QA-PDF-001 | ~~P1~~ | PDF double-fetch on blob URL in usePdfCache | ✅ **FIXED** | PDF |
| TS-QA-EMAIL-002 | **P2** | email_log RLS `TO public` — anon read/write aller E-Mail-Logs | **OPEN** | Security/RLS |
| TS-QA-PDF-002 | ~~P2~~ | handleRetry calls onClose() statt PDF reload | ✅ **FIXED** | PDF |
| TS-QA-PDF-003 | ~~P2~~ | isCached stale closure in PdfsPage useEffect | ✅ **FIXED** | PDF |
| TS-QA-EMAIL-003 | **P3** | SMTP `rejectUnauthorized: false` — schwache TLS-Verifikation | **OPEN** | Email/SMTP |
| TS-QA-DB-001 | **P3** | agent_log anon INSERT blocked by missing RLS policy | **OPEN/UNCLEAR** | DB/RLS |
| TS-QA-DEP-001 | **P3** | xlsx Prototype Pollution + ReDoS (kein Fix verfügbar) | **OPEN** | Dependencies |

---

## Security Findings

### 🟠 [SEC-01] email_log RLS — Overly Permissive (P2)

**Migration:** `20260306170000_email_log_tracking.sql`

```sql
CREATE POLICY IF NOT EXISTS "Allow select email_log"
  ON public.email_log
  FOR SELECT
  TO public          -- ← Problem: "public" = anon + authenticated
  USING (true);      -- ← Problem: keinerlei Filter
```

**Impact:** Jeder unauthentifizierte Nutzer kann via Supabase-API alle `email_log`-Zeilen lesen — inkl. Empfänger-E-Mails, Betreffzeilen, Timestamps, Status.

**Fix:** SELECT auf `TO authenticated` mit `USING (auth.role() = 'admin')` oder zumindest auf eigene User-ID filtern.

### 🔴 [SEC-02] Cross-Project Tracking Architecture (P1)

**Datei:** `supabase/functions/send-email/index.ts`

```typescript
const TRACK_BASE = "https://rhnhhjidsnrlwxtbarvf.supabase.co/functions/v1/track";
```

- `send-email` erstellt `email_log`-Eintrag im **Haupt-Projekt** (`osgrjouxwpnokfvzztji`)
- Tracking-Pixel ruft `track`-Funktion auf **separatem Projekt** (`rhnhhjidsnrlwxtbarvf`) auf
- Die `track`-Funktion in diesem Repo nutzt `Deno.env.get("SUPABASE_URL")` — welche URL ist dort konfiguriert?
- **Wenn** `SUPABASE_URL` im sekundären Projekt auf sich selbst zeigt → `opened_at`/`clicked_at` werden NIE im Haupt-Projekt aktualisiert → Tracking-Daten verloren

**Verification nötig:** Muss manuell in Supabase-Dashboard des sekundären Projekts geprüft werden.

### ✅ [SEC-03] Keine Service-Role Keys im Frontend

Grep über `src/` nach `service_role`, `SERVICE_ROLE`, `serviceRoleKey` → **kein Fund**. Sauber.

### ✅ [SEC-04] Supabase Anon-Key via VITE_SUPABASE_PUBLISHABLE_KEY

Normal und erwartet — öffentlicher Key, kein Security-Problem.

---

## Fix Plan (Reihenfolge + Next Step)

### 1. P1: email_log RLS SELECT einschränken (30 min)

**Neue Migration** erstellen:

```sql
-- Fix overly permissive email_log SELECT policy
DROP POLICY IF EXISTS "Allow select email_log" ON public.email_log;

CREATE POLICY "email_log select authenticated only"
  ON public.email_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );
```

### 2. P1: Cross-Project Tracking verifizieren (15 min)

Im Supabase Dashboard von `rhnhhjidsnrlwxtbarvf`:
- Prüfen ob `SUPABASE_URL` Secret = `https://osgrjouxwpnokfvzztji.supabase.co`
- Prüfen ob `SUPABASE_SERVICE_ROLE_KEY` = SRK des **Haupt**-Projekts

Falls nicht → entweder Secret anpassen oder `TRACK_BASE` auf das Haupt-Projekt umleiten (z.B. via eigener Domain/Proxy).

### 3. P3: SMTP TLS härten

```typescript
// send-email/index.ts
tls: { rejectUnauthorized: true }  // war: false
```

### 4. P3: agent_log Status klären

- Existiert die Tabelle? → Supabase Dashboard prüfen
- Falls ja: RLS-Policy für anon INSERT hinzufügen

### 5. P3: xlsx-Paket evaluieren

- xlsx wird für Digistore24-CSV-Import genutzt
- Alternativen: `exceljs` (aktiv gepflegt, keine bekannten High-Vulns)
- Kein dringender Fix, aber auf Backlog

---

## Retest Plan

| Test | Was prüfen | Trigger |
|---|---|---|
| E-Mail öffnen + Tracking | opened_at wird im Haupt-Projekt `email_log` gesetzt | Nach Tracking-Verifikation |
| E-Mail klicken + Redirect | clicked_at gesetzt, Redirect korrekt | Nach Tracking-Verifikation |
| PDF öffnen (frischer Cache) | Download ohne Double-Fetch | Manuell iOS Safari |
| PDF Retry | Retry lädt neu, schließt nicht | Manuell iOS Safari |
| email_log Admin-Ansicht | Nur Admin/Teacher sehen Daten | Nach RLS-Fix |
| anon user SELECT email_log | 0 Ergebnisse nach RLS-Fix | Supabase SQL Editor |

---

## Appendix

### A: git log (letzte 10 Commits)

```
04256d7 feat: send-email with tracking pixel + RPC logging (track via rhnhhjidsnrlwxtbarvf)
1c8e298 fix: email_log RLS policies + SECURITY DEFINER RPCs for tracking
149aa99 feat: email open/click tracking — track Edge Function + send-email pixel injection
ba23190 Fix end-to-end E-Mail Automation
c9ebcdf Changes
bc9c214 Fix mailbox sent view and sync
3554d03 Fix mailbox end-to-end
50a49ed Fix send mail storage and auth
626f63d Fix mailbox end-to-end display
1a1e0bb Add binary to uploaded Excel
```

### B: npm audit Summary

- 24 total vulnerabilities (3 low, 5 moderate, 16 high)
- High: `xlsx` (Prototype Pollution GHSA-4r6h-8v6p-xvw6, ReDoS GHSA-5pgg-2g8v-p4x9) — kein Fix
- High: `opensheetmusicdisplay` → transitiv via `node-gyp` / `gl` — kein direkter Fix
- Kein `npm audit fix --force` ohne Regressions-Test empfohlen

### C: Dateien geprüft

- `src/hooks/usePdfCache.tsx` — PDF-001 fix verifiziert
- `src/components/pdfs/PdfViewer.tsx` — PDF-002 fix verifiziert  
- `src/pages/PdfsPage.tsx` — PDF-003 fix verifiziert, onRetry-Prop übergabe OK
- `supabase/functions/send-email/index.ts` — Tracking-Architektur analysiert
- `supabase/functions/track/index.ts` — Cross-Project-Risiko identifiziert
- `supabase/migrations/20260306170000_email_log_tracking.sql` — RLS-Schwäche gefunden
- `src/integrations/supabase/client.ts` — nur anon key, korrekt
- `.env` — nur VITE_* Variablen, kein Service-Role Key
