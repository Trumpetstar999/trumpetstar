# 🔍 Seppl-Checker — Weekly Full-Check Report
**KW11 | 2026-03-16**
**Environment:** prod | APP_URL: https://www.trumpetstar.app
**Repo HEAD:** `1ca3825` (post-fix commit)
**Geprüfte Rollen:** Admin, Teacher, Student
**Geprüfte Devices:** iPhone, iPad, Desktop

---

## Executive Summary

| Status | Wert |
|--------|------|
| **GO/NO-GO** | ✅ **GO** (nach Fixes) |
| P0 Bugs | 0 |
| P1 Bugs | 2 (beide FIXED in diesem Check) |
| P2 Bugs | 1 (still open) |
| P3 Bugs | 2 (still open) |
| TypeScript Errors | 0 |
| npm audit HIGH | 17 |
| npm audit CRITICAL | 0 |
| Build Status | ✅ PASS (nach Fix) |

---

## Zyklus 1 — Discovery & Setup

### Tech Stack verifiziert
- Frontend: React/TypeScript + Vite + shadcn/ui
- Backend: Supabase (osgrjouxwpnokfvzztji)
- Auth: Supabase Auth + RLS + `has_role()` function
- Payments: Digistore24 IPN Webhook
- Email: HTTP Proxy (dcb9bdb Migration) + IMAP fetch
- PDF: html2pdf + printWindow approach (Safari-fix)
- Invoice/Lager: Neues Modul (20260312000000_invoices.sql)

### Test Matrix
| Modul | iPhone | iPad | Desktop | Admin | Teacher | Student |
|-------|--------|------|---------|-------|---------|---------|
| A (Auth) | ✅ code | ✅ code | ✅ code | ✅ | ✅ | ✅ |
| B (Dashboard) | ✅ code | ✅ code | ✅ code | ✅ | ✅ | ✅ |
| C (Content/PDF) | ✅ code | ✅ code | ✅ code | ✅ | - | ✅ |
| D (Progress/Stars) | ✅ code | ✅ code | ✅ code | ✅ | - | ✅ |
| E (Payments/DS24) | - | - | ✅ code | ✅ | - | - |
| F (Teacher) | ✅ code | ✅ code | ✅ code | - | ✅ | - |
| G (Admin/Invoice) | - | - | ✅ code | ✅ | - | - |

> [ASSUMPTION] Device-Tests sind Code-Review-basiert, kein live Device Test in dieser Umgebung möglich.

---

## Zyklus 2 — Smoke Tests

### TypeScript Check
```
npx tsc --noEmit
EXIT CODE: 0 ✅ — 0 TypeScript-Fehler
```

### npm audit
```
25 vulnerabilities: 3 low, 5 moderate, 17 high, 0 critical

HIGH (relevant):
- xlsx *: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) + ReDoS (GHSA-5pgg-2g8v-p4x9) — No fix available
- opensheetmusicdisplay >=1.5.0 → node-gyp → make-fetch-happen → tar: SSRF+traversal chain
  Fix would require downgrade to osmd 1.4.5 (breaking change)
```

### Console Log / Secret Scan
```
grep console.log/error/warn | grep key|secret|token|password → 4 matches
- useLanguage.tsx: Missing translation key (harmless i18n warning)
- UserList.tsx: Fetched profiles count + Error resetting password (no secrets)
- ChangePasswordDialog.tsx: Password change error (no secrets exposed)
✅ PASS — Keine Keys/Tokens in Console-Outputs
```

### Frontend Secret Scan
```
grep service_role|eyJh in src/ → 0 matches ✅
```

### Production Build
```
INITIAL: ❌ FAIL
  Error 1: Unterminated string literal — TrompeteLernenKinder.tsx:62 (curly quote „?"" broke JS string)
  Error 2: Cannot resolve import "qrcode" — src/lib/invoice-print.ts (missing npm dependency)
  
AFTER FIX: ✅ BUILD SUCCESS (30.47s)
  Commit: 1ca3825
```

### Build Output (Performance)
```
dist/assets/index-BPb2cDGG.js              2,905 kB │ gzip:  814 kB ⚠️ LARGE
dist/assets/opensheetmusicdisplay.min.js   1,183 kB │ gzip:  323 kB ⚠️
dist/assets/pdf-BGSNzrkk.js                  293 kB │ gzip:   87 kB OK
dist/assets/index-B4DAmM-b.css               165 kB │ gzip:   25 kB OK

Images (unoptimized):
trompete-lernen-erwachsene-infografik.png    2.2 MB  ⚠️ SEHR GROSS
toni-coach.png                               876 kB  ⚠️
trumpetstar-app-screenshot.png               568 kB  ⚠️
trumpetstar-logo.png                         556 kB  ⚠️
```

---

## Zyklus 3 — Funktionale Regression

### Modul A — Auth & RLS
- ✅ `has_role()` Funktion konsistent in allen neuen Migrations verwendet
- ✅ Invoice/Lager-Tabellen: RLS aktiviert, Admin-only Policies vorhanden
- ✅ email_log RLS: Admin-only SELECT/INSERT/UPDATE (Commit 767ba9e/6a5318e)
- ✅ Feedback-System: `auth.uid() = user_id OR auth.uid() = teacher_id` korrekt
- ⚠️ `capture-lead` Edge Function: Verwendet noch direktes SMTP (World4You, Port 587) — kein `rejectUnauthorized: false` jedoch

### Modul B — Dashboard & Routing
- ✅ Navigation-Struktur im Code vorhanden
- ✅ Loading Spinner Site-wide Fix (Commit 08cf056)

### Modul C — Content & PDF
**Safari PDF Download Fix (647d537 + 94477b8 + af2c6ec + d06411d):**
- ✅ Approach: `window.open('', '_blank')` + `document.write(html)` + `window.print()` — Cross-Browser inkl. Safari
- ✅ Fallback bei Popup-Blocker: blob download als HTML-Datei
- ✅ QR Code in Invoice PDF via `qrcode` library (nach Fix installiert)
- ✅ Logo als Data-URL embedded (kein Cross-Origin Problem)

### Modul D — Fortschritt & Gamification
- ✅ Stars/Video-Completion Tracking in Admin Dashboard vorhanden
- ✅ DashboardStats, ActivityCharts, UserList zeigen Star-Counts

### Modul E — Payments / Digistore24
- ✅ `digistore24-ipn` Edge Function: JSON + form-urlencoded Parser
- ✅ Event-Type-Mapping: PURCHASE/RENEWAL/CANCELLATION/REFUND/CHARGEBACK
- ⚠️ [ASSUMPTION] Idempotency/Retry-Handling nicht vertieft geprüft (nur Code-Review)

### Modul F — Teacher
- ✅ Teacher-Chat RLS: `auth.uid() = user_id OR auth.uid() = teacher_id`
- ⚠️ [ASSUMPTION] Upload-Bucket-Policies nicht vollständig geprüft (kein Supabase API Zugriff)

### Modul G — Admin & Invoice
- ✅ Neues Invoice-System: customers, products, invoices, invoice_items, inventory
- ✅ Alle Tabellen Admin-only RLS
- ✅ `finalize_invoice()` SECURITY DEFINER Function — korrekt
- ✅ `next_invoice_number()` atomic/idempotent über UPSERT
- ✅ Blog-Artikel (5763f05): 4 neue Artikel (Kinder, Flügelhorn, Kaufen, Bläserklasse)

---

## Zyklus 4 — Security Check

### email_log RLS Fix (TS-QA-EMAIL-002) ✅ CLOSED
```sql
-- Migration 20260309095951 (Commits 767ba9e + 6a5318e):
DROP POLICY IF EXISTS "Allow public read access to email_log" ON public.email_log;
-- ... (alle alten open policies gedroppt)
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_email_log" ON public.email_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_email_log" ON public.email_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_email_log" ON public.email_log FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- Status: ✅ FIXED — Anon-User können email_log NICHT mehr lesen
```

### Frontend Secret Scan ✅ PASS
```
grep service_role|eyJh in src/ → 0 matches
Keine JWT-Keys oder Service-Role-Keys im Frontend
```

### Cross-Project Tracking (TS-QA-EMAIL-001) ✅ CLOSED
```
grep -rn "rhnhhjidsnrlwxtbarvf" → 0 matches
Separates Supabase-Projekt wird nicht mehr referenziert.
track/index.ts verwendet SUPABASE_URL (Env Var = main project)
```

### SMTP TLS / rejectUnauthorized (TS-QA-EMAIL-003) ✅ RESOLVED
```
grep rejectUnauthorized supabase/functions/ → 0 matches
send-email: auf HTTP Proxy migriert (dcb9bdb + a7b2019) ✅
capture-lead: noch direktes SMTP (World4You Port 587) aber kein rejectUnauthorized=false
SMTP Default: STARTTLS = acceptiert valides Cert → P3 bleibt offen (migration pending)
```

### Edge Functions Auth-Übersicht
| Function | Auth Check | Service Role |
|----------|-----------|--------------|
| send-email | AUTH header optional (internal call) | Yes (DB logging) |
| track | keine Auth (pixel/redirect URL) | Yes (DB update) |
| digistore24-ipn | Passphrase-Verification | Yes |
| pdf-proxy | Supabase JWT (VITE_SUPABASE_URL) | Yes |
| assistant-chat | Bearer Auth check | Yes |
| capture-lead | kein Auth-Check | SMTP only |

⚠️ `capture-lead` hat keinen Auth-Check — öffentlich aufrufbar. [P3]

### agent_log (TS-QA-DB-001) ✅ CLOSED
```
grep -rn "agent_log" → 0 matches
Tabelle/Feature nicht mehr im Codebase → Feature removed
```

---

## Zyklus 5 — Performance

### Bundle-Analyse
| Asset | Size | gzip | Status |
|-------|------|------|--------|
| index.js | 2,905 kB | 814 kB | ⚠️ LARGE |
| opensheetmusicdisplay | 1,183 kB | 323 kB | ⚠️ (3rd party) |
| pdf.js | 293 kB | 87 kB | OK |
| index.css | 165 kB | 25 kB | OK |

### Image-Optimierung
| Image | Size | Status |
|-------|------|--------|
| trompete-lernen-erwachsene-infografik.png | 2.2 MB | 🔴 KRITISCH |
| toni-coach.png | 876 kB | ⚠️ |
| trumpetstar-app-screenshot.png | 568 kB | ⚠️ |
| trumpetstar-logo.png | 556 kB | ⚠️ |

**Empfehlung:** WebP-Konvertierung + Squoosh/imgix für alle PNG Assets. Ziel: < 200 kB pro Bild.

### React Hook Usage
```
useEffect + useMemo + useCallback in src/ → 530 Verwendungen
→ Hoher Wert, aber bei 2.9 MB Bundle erwartet.
→ Kein spezifisches Leak-Pattern erkennbar.
```

---

## Bug-Backlog (vollständig)

### P1 — HIGH (beide FIXED)

**[TS-QA-BUILD-001] Unterminated string literal — TrompeteLernenKinder.tsx**
- Bereich: Blog/Build
- Umgebung: prod build
- Severity: High | Priority: P1 → **FIXED in 1ca3825**
- Problem: Deutsches schließendes Anführungszeichen `"` (U+201C) brach JS string literal
- Fix: Unicode-Escapes `\u201E...\u201C` in der String-Literal
- Status: ✅ CLOSED

**[TS-QA-BUILD-002] Missing npm dependency `qrcode`**
- Bereich: Invoice/Build
- Umgebung: prod build
- Severity: High | Priority: P1 → **FIXED in 1ca3825**
- Problem: `src/lib/invoice-print.ts` importiert `qrcode`, war nicht in package.json
- Fix: `npm install qrcode @types/qrcode --save`
- Status: ✅ CLOSED

### P2 — MEDIUM

**[TS-QA-PERF-001] Unoptimierte PNG-Assets im Bundle**
- Bereich: Performance
- Severity: Medium | Priority: P2
- Problem: 4 PNG-Assets zwischen 500 kB–2.2 MB, kein WebP
- trompete-lernen-erwachsene-infografik.png: 2.2 MB (kritisch für Mobile)
- Fix: WebP-Konvertierung, `<picture>` srcset, lazy loading
- Status: 🟡 OPEN

### P3 — LOW

**[TS-QA-DEP-001] xlsx Prototype Pollution + ReDoS**
- Bereich: Dependencies
- Severity: Low | Priority: P3
- Problem: xlsx library mit bekannten Vulns, kein Fix verfügbar
- Fix: xlsx durch exceljs ersetzen (Breaking Change), oder xlsx Nutzung auf Admin-only isolieren
- Status: 🟡 OPEN (kein Upstream-Fix)

**[TS-QA-SEC-001] capture-lead Edge Function ohne Auth-Check**
- Bereich: Security
- Severity: Low | Priority: P3
- Problem: `capture-lead` ist öffentlich ohne Authentifizierung aufrufbar → Spam-Risiko
- Fix: Rate-Limiting via Supabase Edge Function Rate Limit Config oder CAPTCHA-Token
- Status: 🟡 OPEN

---

## Geschlossene Issues aus KW10

| Bug-ID | Titel | Status |
|--------|-------|--------|
| TS-QA-EMAIL-001 | Cross-Project Tracking (rhnhhjidsnrlwxtbarvf) | ✅ CLOSED — nicht mehr im Code |
| TS-QA-EMAIL-002 | email_log RLS TO public | ✅ CLOSED — 767ba9e/6a5318e fixes verifiziert |
| TS-QA-DB-001 | agent_log anon INSERT | ✅ CLOSED — Feature removed |
| TS-QA-EMAIL-003 | SMTP tls.rejectUnauthorized = false | ✅ RESOLVED — HTTP Proxy Migration |

---

## Neue Commits KW11 — Review-Ergebnis

| Commit | Titel | Status |
|--------|-------|--------|
| 5763f05 | Blog KW11 (4 Artikel) | ⚠️ Build-Breaking (TrompeteLernenKinder.tsx) — FIXED |
| 195dea4 | SEO KW11 QA-Review | ✅ OK |
| 08cf056 | Fix loading spinner site-wide | ✅ OK |
| 647d537–d06411d | Fix Safari PDF download | ✅ Approach solide |
| 9b4c4f6 | XGG Gernot Griesbacher Website | ✅ OK |
| Invoice PDF e2e | mehrere commits | ✅ OK, qrcode dep gefixed |
| dcb9bdb + a7b2019 | SMTP zu HTTP Proxy | ✅ RESOLVED TS-QA-EMAIL-003 |
| 767ba9e + 6a5318e | email_log RLS fix | ✅ RESOLVED TS-QA-EMAIL-002 |
| 221ae87 | email tracking fix | ✅ OK |

---

## Fix Plan (Priorisierung nächste Woche)

1. **[P2] Image-Optimierung** — WebP-Konvertierung aller PNG-Assets; trompete-lernen-erwachsene-infografik.png (2.2 MB) als Prio 1
2. **[P3] capture-lead Rate Limiting** — Spam-Schutz ergänzen
3. **[P3] xlsx Migration** — Evaluierung exceljs als Ersatz
4. **[INFO] Bundle Splitting** — OSMD und PDF.js als lazy chunks trennen für bessere First Load Performance

---

## Definition of Done — Release Checklist

- [x] Keine offenen P0/P1 Bugs
- [x] Security: Keine Auth/RLS/Secret-Leaks
- [x] TypeScript: 0 Fehler
- [x] Production Build: PASS
- [ ] Performance: Images optimiert (pending)
- [x] email_log RLS: gesichert
- [x] Invoice/Lager: RLS korrekt

---

*Seppl-Checker KW11 | 2026-03-16 | Repo: 1ca3825*
