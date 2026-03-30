# 🔍 Trumpetstar QA – Weekly Full Check KW14 (2026-03-30)

**Datum:** 2026-03-30 (Mon, UTC)  
**Environment:** prod  
**App URL:** https://www.trumpetstar.app  
**Letzter Check:** KW13, 2026-03-23, Commit 37dd59a → GO  
**HEAD bei Check-Start:** 1050144  
**HEAD nach Fixes:** b4e8f04  
**Agent:** Seppl-Checker v1.4  

---

## ✅ Executive Summary

| Kategorie | Anzahl |
|-----------|--------|
| P0 (Critical – Blocker) | 0 |
| P1 (High – urgent) | 1 (carry-over, unverified) |
| P2 (Medium – soon) | 3 (1 fixed, 2 new) |
| P3 (Low – backlog) | 6 |

**Verdict: ⚠️ CONDITIONAL GO**  
P2-Fix TS-QA-KW14-PERF-001 wurde implementiert und committed. Keine P0-Blocker. Die beiden neuen P2-Issues (send-email unauth + ElevenLabs unauth) sollten zeitnah adressiert werden.

---

## 🔧 Fixes in diesem Check

### ✅ TS-QA-KW14-PERF-001 (P2) – CLOSED
**Asset-Fix unvollständig: .jpg erstellt aber alle Refs zeigen noch auf .png**

**Fix (Commit b4e8f04):**
Alle 11 Dateien wurden von `.png` auf `.jpg` umgestellt via sed:

| Datei | Asset |
|-------|-------|
| src/components/admin/AdminSidebar.tsx | trumpetstar-logo |
| src/components/assistant/AssistantPanel.tsx | toni-coach |
| src/components/assistant/AssistantButton.tsx | toni-coach |
| src/components/onboarding/LanguageSelectionDialog.tsx | trumpetstar-logo |
| src/components/mobile/MobileLayout.tsx | trumpetstar-logo |
| src/components/seo/SEOPageLayout.tsx | trumpetstar-logo |
| src/components/layout/Header.tsx | trumpetstar-logo |
| src/components/layout/TabBar.tsx | toni-coach |
| src/lib/invoice-print.ts | trumpetstar-logo (dynamic import) |
| src/pages/AuthPage.tsx | trumpetstar-logo |
| src/pages/LandingPage.tsx | trumpetstar-logo |

Verifikation: `grep -rn "trumpetstar-logo\.png\|toni-coach\.png" src/` → **0 Treffer** ✅

---

## 🛡️ Security Scan

### TS-QA-KW14-SEC-001 (P2) – NEW
**send-email Edge Function: keine Caller-Authentifizierung**

- **Datei:** `supabase/functions/send-email/index.ts`
- **Problem:** Die Funktion prüft kein Auth-Token des Aufrufers. Jeder kann via öffentliche Supabase-URL beliebige Emails über den Proxy senden (Spam-Missbrauch, API-Kosten).
- **Detail:** Funktion verwendet `SUPABASE_SRK || SUPABASE_ANON_KEY` aber verifiziert die aufrufende Identität an keiner Stelle.
- **Empfehlung:** `Authorization`-Header prüfen und zumindest `authenticated` User verlangen (kein Admin-Check nötig, da intern genutzt). Alternativ: Shared Secret Header für interne Caller.
- **Status:** OPEN

### TS-QA-KW14-SEC-002 (P2) – NEW
**elevenlabs-tts + elevenlabs-stt: keine Authentifizierung**

- **Dateien:** `supabase/functions/elevenlabs-tts/index.ts`, `supabase/functions/elevenlabs-stt/index.ts`
- **Problem:** Beide Funktionen haben **keinerlei Auth-Check**. ElevenLabs-API wird auf Kosten von Trumpetstar abgerufen ohne Nutzerverifikation.
- **Risiko:** API-Abuse durch externe Aufrufer → unerwartete Kosten.
- **Empfehlung:** `Authorization`-Header prüfen, nur `authenticated` Users erlauben.
- **Status:** OPEN

### TS-QA-KW14-SEC-003 (P3) – NEW
**vimeo-sync: keine Caller-Authentifizierung**

- **Datei:** `supabase/functions/vimeo-sync/index.ts`
- **Problem:** Keine Auth-Prüfung des Aufrufers. Vimeo-API wird ohne Caller-Auth aufgerufen.
- **Empfehlung:** Admin-Role-Check (wie in `admin-users` und `send-invoice-email` implementiert).
- **Status:** OPEN

### TS-QA-KW14-SEC-004 (P3) – NEW
**WP OAuth Client ID hardcoded im Code**

- **Datei:** `supabase/functions/wp-oauth/index.ts:10`
- **Code:** `const WP_OAUTH_CLIENT_ID = 'WjGtEhetRuRSQOktowbaLUvzKuyrUGgl';`
- **Problem:** Client ID ist in git eingecheckt. Kein Secret (Client Secret kommt aus env), aber trotzdem schlechte Praxis.
- **Empfehlung:** In `Deno.env.get('WP_OAUTH_CLIENT_ID')` auslagern.
- **Status:** OPEN

### TS-QA-EMAIL-003 (P3) – CARRY-OVER, aktualisiert
**Email Proxy über HTTP (unverschlüsselt)**

- **Betroffene Funktionen:** `send-email`, `send-invoice-email`, `send-magic-link`, `process-email-queue`
- **Code:** `const EMAIL_PROXY_URL = "http://72.60.17.112/email-proxy/send";`
- **Problem:** Alle ausgehenden Emails gehen über HTTP an einen IP-basierten Endpoint. E-Mail-Inhalt + Proxy-Secret im Klartext übertragbar.
- **Hinweis:** Das `x-proxy-secret` schützt vor unauthorisiertem Direktzugriff, aber nicht vor MitM.
- **Empfehlung:** Proxy-URL auf HTTPS umstellen, idealerweise mit Domain + TLS-Zertifikat.
- **Status:** OPEN

### TS-QA-KW13-SEC-003 (P3) – CARRY-OVER
**send-invoice-email: kein Rate Limiting**

- Weiterhin kein Rate Limiting nach Auth-Check. Admin-Only reduziert Risiko erheblich.
- **Status:** OPEN (niedrige Priorität)

---

## 🚀 Performance Scan

### Asset-Größen (aktuell)

| Asset | Größe | Status | Referenziert von |
|-------|-------|--------|-----------------|
| `toni-coach.png` | 876KB | ⚠️ Orphan .png bleibt im Repo (refs auf .jpg) | niemand mehr |
| `trumpetstar-logo.png` | 556KB | ⚠️ Orphan .png bleibt im Repo (refs auf .jpg) | niemand mehr |
| `trumpetstar-app-screenshot.png` | 568KB | ❌ Open Issue KW13 | (kein Ref gefunden) |
| `logo-trumpetstar-game.png` | 556KB | ❌ Kein JPG vorhanden | GameHUD.tsx |
| `trumpetstar-lernwelt.jpg` | 300KB | ⚠️ Optimierbar | TrompeteLernenKinderPage |
| `app-preview.png` | 252KB | ⚠️ Knapp über Limit | LandingPage.tsx |
| `trompete-lernen-erwachsene-infografik.jpg` | 172KB | ✅ OK | - |
| `trumpetstar-logo.jpg` | 172KB | ✅ OK (neu) | 11 Komponenten |
| `toni-coach.jpg` | 128KB | ✅ OK (neu) | 3 Komponenten |
| `game-background.jpg` | 96KB | ✅ OK | - |

### TS-QA-KW14-PERF-002 (P2) – NEW
**logo-trumpetstar-game.png (556KB) kein JPG, referenziert**

- **Datei:** `src/assets/logo-trumpetstar-game.png`
- **Referenz:** `src/components/game/GameHUD.tsx:5`
- **Problem:** 556KB PNG, kein komprimiertes JPEG vorhanden. Im Game-Context vermutlich transparent → PNG nötig, aber zumindest WebP oder komprimiertes PNG empfohlen.
- **Empfehlung:** Prüfen ob Transparenz benötigt: wenn nein → JPEG; wenn ja → TinyPNG/WebP. Zielgröße <80KB.
- **Status:** OPEN

### TS-QA-KW14-PERF-003 (P3) – NEW
**Orphan PNGs belegen 1.4MB Repo-Space**

- `toni-coach.png` (876KB) und `trumpetstar-logo.png` (556KB) sind nicht mehr referenziert.
- **Empfehlung:** Dateien löschen, Repo schlanker halten.
- **Status:** OPEN (cosmetic)

### TS-QA-KW14-PERF-004 (P3) – NEW
**app-preview.png (252KB) + trumpetstar-lernwelt.jpg (300KB) über 200KB**

- Beide über Schwellwert. `app-preview.png` in LandingPage (kritischer Pfad).
- **Empfehlung:** WebP-Konvertierung oder Kompression. Ziel <150KB.
- **Status:** OPEN

### TS-QA-KW13-PERF-003 (P3) – CARRY-OVER
**trumpetstar-app-screenshot.png (567KB) noch nicht optimiert**

- Keine Referenz im Code gefunden (`grep -rn "app-screenshot" src/`). Möglicherweise in public/ oder Supabase Storage verwendet.
- **Status:** OPEN (unkritisch solange nicht geladen)

---

## 🔄 Funktionaler Regression-Check

### Geänderte Dateien seit KW13 (Commits 37dd59a → b4e8f04)

| Datei | Änderung | Regression-Risiko |
|-------|----------|-------------------|
| `src/assets/toni-coach.jpg` | Neu erstellt | ✅ Kein Risiko |
| `src/assets/trumpetstar-logo.jpg` | Neu erstellt | ✅ Kein Risiko |
| `src/pages/TrompeteLernenErwachsenePage.tsx` | infografik .png → .jpg | ✅ Getestet |
| `src/components/game/NoteRenderer.ts` | Minor fix | ✅ Kein Risiko |
| `supabase/functions/send-invoice-email/index.ts` | Admin-Check added | ✅ Korrekt |
| `supabase/migrations/20260323040000_*.sql` | finalize_invoice guard | ✅ Korrekt |
| `supabase/migrations/20260323074000_*.sql` | email_log RLS fix | ✅ Korrekt |
| **b4e8f04:** 11 Komponenten `.png` → `.jpg` refs | Dieser Check | ✅ Alle Refs verifiziert |

**Verifikation b4e8f04:**
```bash
grep -rn "trumpetstar-logo\.png\|toni-coach\.png" src/ → 0 matches ✅
```

Keine funktionalen Regressions-Risiken identifiziert.

---

## 📋 Offene Issues – Vollständiges Backlog

| Issue | Prio | Status | Notiz KW14 |
|-------|------|--------|------------|
| TS-QA-EMAIL-001 | P1 | 🔴 OPEN | Cross-Project Email Tracking – push-sync Funktion vorhanden, Live-Test nötig |
| TS-QA-KW14-SEC-001 | P2 | 🔴 NEW | send-email ohne Caller-Auth |
| TS-QA-KW14-SEC-002 | P2 | 🔴 NEW | elevenlabs-tts/stt ohne Caller-Auth |
| TS-QA-KW14-PERF-002 | P2 | 🔴 NEW | logo-trumpetstar-game.png 556KB |
| TS-QA-KW14-PERF-001 | P2 | ✅ CLOSED | .png → .jpg refs (Commit b4e8f04) |
| TS-QA-DB-001 | P3 | 🔴 OPEN | agent_log anon INSERT – kein Code im Repo (direkt in Supabase?) |
| TS-QA-EMAIL-003 | P3 | 🔴 OPEN | EMAIL_PROXY_URL via HTTP (Plain) |
| TS-QA-DEP-001 | P3 | 🔴 OPEN | xlsx 0.18.5 Prototype Pollution + ReDoS |
| TS-QA-KW13-SEC-003 | P3 | 🔴 OPEN | send-invoice-email kein Rate Limiting |
| TS-QA-KW13-PERF-003 | P3 | 🔴 OPEN | trumpetstar-app-screenshot.png 567KB |
| TS-QA-KW14-SEC-003 | P3 | 🔴 NEW | vimeo-sync ohne Caller-Auth |
| TS-QA-KW14-SEC-004 | P3 | 🔴 NEW | WP_OAUTH_CLIENT_ID hardcoded |
| TS-QA-KW14-PERF-003 | P3 | 🔴 NEW | Orphan PNGs (1.4MB, nicht referenziert) |
| TS-QA-KW14-PERF-004 | P3 | 🔴 NEW | app-preview.png + lernwelt.jpg >200KB |
| TS-QA-EMAIL-002 | P2 | ✅ CLOSED | email_log RLS fix (KW13) |
| TS-QA-KW13-SEC-001 | P2 | ✅ CLOSED | send-invoice-email Admin-Check (KW13) |
| TS-QA-KW13-SEC-002 | P2 | ✅ CLOSED | finalize_invoice SECURITY DEFINER (KW13) |

---

## 📌 Empfohlene nächste Schritte

1. **[P2, Soon]** `send-email` + `elevenlabs-tts/stt` + `vimeo-sync`: Auth-Check hinzufügen (Authorization header validieren, mindestens `authenticated`)
2. **[P2, Soon]** `logo-trumpetstar-game.png`: WebP/JPEG-Konvertierung, Ziel <80KB
3. **[P1, Ongoing]** TS-QA-EMAIL-001: Live-Test Cross-Project Tracking (push-sync → App B)
4. **[P3]** Orphan PNGs löschen: `git rm src/assets/toni-coach.png src/assets/trumpetstar-logo.png`
5. **[P3]** `WP_OAUTH_CLIENT_ID` in Env-Variable auslagern
6. **[P3]** `xlsx` updaten auf ≥0.20.x (kein Prototype-Pollution-Risk)

---

## 🏷️ Commit-Historie dieser Session

| Commit | Beschreibung |
|--------|-------------|
| `b4e8f04` | fix(qa): TS-QA-KW14-PERF-001 – update all .png refs to .jpg |

---

*Report erstellt von Seppl-Checker (Valentin/OpenClaw) | KW14 | 2026-03-30*
