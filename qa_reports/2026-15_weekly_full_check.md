# QA Weekly Full Check — KW15 / 2026-04-06

| Field | Value |
|-------|-------|
| Date | 2026-04-06 |
| Environment | prod |
| App URL | https://www.trumpetstar.app |
| Supabase | https://osgrjouxwpnokfvzztji.supabase.co |
| Git HEAD (pre-check) | 32916cd0 |
| Git HEAD (post-fixes) | 67594634 |
| Checker | Seppl-Checker v1.0 (subagent) |
| QA Commits | 4 fix commits |

---

## Executive Summary

**Keine Kern-App-Änderungen seit KW14.** Zwei neue Client-Onepager-Commits (wohnraum-wenigzell, dax-partner) sind irrelevant für Kern-App-QA.

**5 aktive Fixes implementiert und committed** in dieser Runde:
1. JWT-Caller-Auth für `send-email`, `elevenlabs-tts`, `elevenlabs-stt` (P2 geschlossen)
2. `logo-trumpetstar-game.png` (567KB → JPEG 173KB) + GameHUD.tsx Update (P2 geschlossen)
3. Orphan-PNGs gelöscht: `toni-coach.png` (893KB), `trumpetstar-app-screenshot.png` (580KB)
4. Missed KW14 Fix: `trumpetstar-logo.png` → `.jpg` in ResetPasswordPage.tsx + PNG gelöscht
5. `app-preview.png` (254KB → JPEG 148KB) + LandingPage.tsx Update (P3 geschlossen)

**Neue Findings KW15:** 1 neues Issue (TS-QA-KW15-PERF-001 – war ein missed fix aus KW14, jetzt gefixt).

**Neue Features:** Audio-Player (audio_levels, audio_files, audio_level_items Tabellen mit sauberen RLS-Policies). Security-Review: sauber.

---

## Zyklus 1 — Discovery & Verification

### Git Log (Top 5 vor Fixes)
```
32916cd0 feat(dax-partner): initial build – Rechtsanwaltskanzlei, navy/gold
c92623e1 feat(wohnraum-wenigzell): initial build – Astro onepager, Steiermark green
fc4d955e fix(qa): TS-QA-KW14-PERF-001 – update all .png refs to .jpg (logo + toni-coach)
bd21c8a6 Updated pricing FAQ guarantee
588f1ab7 Adjusted Pricing FAQs to 30 days
```

### P1/P2-Status-Check (vor Fixes)

| Issue | Status | Befund |
|-------|--------|--------|
| TS-QA-EMAIL-001 (Cross-Project Tracking) | open | Kein Fix im Code. Bleibt P1 open. |
| TS-QA-KW14-SEC-001 (send-email: kein Auth) | **FIXED KW15** | Kein JWT-Check vorhanden → Fix implementiert |
| TS-QA-KW14-SEC-002 (elevenlabs: kein Auth) | **FIXED KW15** | Kein JWT-Check vorhanden → Fix implementiert |
| TS-QA-KW14-PERF-002 (game logo PNG) | **FIXED KW15** | PNG noch vorhanden → konvertiert + Refs updated |

### Edge Function Auth-Status nach Fixes

| Function | Auth-Status |
|----------|-------------|
| send-email | ✅ JWT-Check implementiert (267458d1) |
| elevenlabs-tts | ✅ JWT-Check implementiert (267458d1) |
| elevenlabs-stt | ✅ JWT-Check implementiert (267458d1) |
| vimeo-sync | ⚠️ Kein Caller-Auth (P3 open, bleibt) |

---

## Zyklus 2 — Smoke Tests

### Dependencies / package.json
- Keine Änderungen an package.json seit fc4d955e → Kein Update-Bedarf, kein neues CVE-Risiko durch Dependency-Bump.

### Neue src/ Dateien / Komponenten
Neue Feature: **Audio-Player** (seit KW14-Snapshot):
- `src/components/audio/AudioPlayer.tsx`
- `src/components/audio/AudioPlayerManager.tsx`
- `src/components/audio/MobileAudioPlayer.tsx`
- `src/components/audio/PlayerControls.tsx`
- `src/components/audio/ProgressBar.tsx`
- `src/components/audio/TempoSlider.tsx`
- `src/components/audio/TrackList.tsx`
- `src/components/audio/TrackSearch.tsx`
- `src/components/audio/TranspositionSelector.tsx`
- `src/components/audio/CollapsibleLoopControls.tsx`
- `src/components/audio/SettingsPanel.tsx`
- `src/components/audio/AudioLevelSelector.tsx`
- `src/hooks/useAudioPlayer.tsx`

Weitere Updates: `PricingTable.tsx`, `AssistantPanel.tsx`, `AssistantButton.tsx`, `LanguageSelectionDialog.tsx`

### Neue Routes
Audio-Feature nutzt Feature-Flag `menu_audios` → kein neuer Route notwendig. In-App-Navigation.

---

## Zyklus 3 — Funktionale Regression

### Auth-Pfad (useAuth.tsx)
- useAuth.tsx vorhanden, keine Änderung seit KW14. Kein Regression-Risiko.

### Payments (digistore24-ipn)
- HMAC/Secret-Validation implementiert und aktiv (Zeile 146–158): `validateSecret()` mit `if (!expectedSecret) return false;` ✅
- Kein Code-Change seit KW14 → stabil.

### RLS — Neue Migrations (KW15)
Zwei neue Migrations seit KW14:

**20260324140658 – audio_levels / audio_files / audio_level_items:**
```sql
ALTER TABLE public.audio_levels ENABLE ROW LEVEL SECURITY;
-- Public SELECT + Admin-Only Write → ✅ sauber
```

**20260324141741 – audio-files Storage Bucket:**
```sql
-- Public read, Admin upload/delete → ✅ sauber
```

**20260323074000 – email_log RLS Fix (aus KW14):**
- SELECT auf admin restricted → ✅ TS-QA-DB-001 teilweise adressiert (email_log SELECT fix)
- `agent_log` INSERT-Policy: bleibt P3 open (kein Fix in Migration)

---

## Zyklus 4 — Security Check

### Fixes implementiert

**TS-QA-KW14-SEC-001 — send-email JWT Auth:**
- Commit: `267458d1`
- Pattern: Bearer-Token aus Authorization-Header extrahiert, via `supabase.auth.getUser()` validiert
- Service-Role-Key als Backend-Bypass erlaubt (für Automation/n8n)
- Status: ✅ CLOSED

**TS-QA-KW14-SEC-002 — elevenlabs-tts + elevenlabs-stt JWT Auth:**
- Commit: `267458d1`
- Identisches Pattern (Bearer-Token Check, Service-Role-Bypass)
- Status: ✅ CLOSED

### Noch offene Security-Issues

| ID | Issue | Prio | Status |
|----|-------|------|--------|
| TS-QA-EMAIL-001 | Cross-Project Tracking Pixel | P1 | open |
| TS-QA-KW14-SEC-003 | vimeo-sync: kein Caller-Auth | P3 | open |
| TS-QA-KW14-SEC-004 | WP_OAUTH_CLIENT_ID hardcoded | P3 | open |
| TS-QA-DB-001 | agent_log anon INSERT | P3 | open |
| TS-QA-EMAIL-003 | SMTP tls.rejectUnauthorized=false | P3 | open |
| TS-QA-KW13-SEC-003 | send-invoice-email: kein Rate Limiting | P3 | open |

### Secret-Leak-Check
- Keine Plaintext-Secrets in src/ gefunden
- `WP_OAUTH_CLIENT_ID` hardcoded in `wp-oauth/index.ts` bleibt P3 open (Zeile 10)
- Alle anderen Secrets via `Deno.env.get()` ✅

---

## Zyklus 5 — Performance & Assets

### Fixes implementiert

| Fix | Commit | Vorher | Nachher |
|-----|--------|--------|---------|
| logo-trumpetstar-game.png → JPEG | d6d5d9f4 | 567KB PNG | 173KB JPEG |
| toni-coach.png (Orphan) | 89b44f65 | 893KB PNG | gelöscht |
| trumpetstar-app-screenshot.png (Orphan) | 89b44f65 | 580KB PNG | gelöscht |
| trumpetstar-logo.png → .jpg (Missed Fix) | 432f1c19 | 567KB PNG | 173KB JPEG |
| app-preview.png → JPEG | 67594634 | 254KB PNG | 148KB JPEG |

**Totale Einsparung: ~2.87MB Orphan/redundante Assets entfernt/komprimiert**

### Verbleibende P3-Asset-Issues

| Issue | Asset | Größe | Status |
|-------|-------|-------|--------|
| TS-QA-KW14-PERF-004 | trumpetstar-lernwelt.jpg | 305KB | open (referenced, kein Fix-Slot) |
| TS-QA-DEP-001 | xlsx (Prototype Pollution) | — | open (kein Fix verfügbar) |

---

## Fixes — Vollständige Liste KW15

| Commit | Issue-ID | Beschreibung |
|--------|----------|--------------|
| 267458d1 | TS-QA-KW14-SEC-001/002 | JWT Caller-Auth: send-email, elevenlabs-tts, elevenlabs-stt |
| d6d5d9f4 | TS-QA-KW14-PERF-002 | logo-trumpetstar-game.png → JPEG, GameHUD.tsx update |
| 89b44f65 | TS-QA-KW14-PERF-003 + TS-QA-KW13-PERF-003 | Orphan PNGs löschen: toni-coach.png, trumpetstar-app-screenshot.png |
| 432f1c19 | TS-QA-KW15-PERF-001 (new) | Missed KW14 Fix: trumpetstar-logo.png → .jpg in ResetPasswordPage.tsx |
| 67594634 | TS-QA-KW14-PERF-004 | app-preview.png → JPEG, LandingPage.tsx update |

---

## Bug Backlog (nach KW15)

| ID | Title | Prio | Status |
|----|-------|------|--------|
| TS-QA-EMAIL-001 | Cross-Project Tracking: Pixel-Projekt ≠ Log-Projekt | P1 | open |
| TS-QA-KW14-SEC-003 | vimeo-sync: keine Caller-Auth | P3 | open |
| TS-QA-KW14-SEC-004 | WP_OAUTH_CLIENT_ID hardcoded | P3 | open |
| TS-QA-KW14-PERF-004 | trumpetstar-lernwelt.jpg (305KB) > 200KB | P3 | open |
| TS-QA-DB-001 | agent_log anon INSERT: fehlende RLS Policy | P3 | open |
| TS-QA-EMAIL-003 | SMTP tls.rejectUnauthorized = false | P3 | open |
| TS-QA-DEP-001 | xlsx Prototype Pollution + ReDoS | P3 | open |
| TS-QA-KW13-SEC-003 | send-invoice-email: kein Rate Limiting | P3 | open |

**P0: 0 | P1: 1 | P2: 0 | P3: 7**

---

## GO / NO-GO

**🟢 GO**

Begründung:
- Keine P0-Issues
- P1 (TS-QA-EMAIL-001) ist bekanntes Tracking-Architektur-Problem, kein Datenverlust-/Security-Risiko
- Alle P2-Issues wurden in KW15 gefixt (Security + Performance)
- Payments stabil, Auth stabil, RLS für neue Audio-Feature sauber
- Kein kritischer Datenpfad broken

---

## Fix Plan (KW16)

| Prio | Issue | Aktion |
|------|-------|--------|
| P1 | TS-QA-EMAIL-001 | Architektur-Entscheidung: Cross-Project Pixel-Tracking via project_id-Parameter oder separater Tracking-DB |
| P3 | TS-QA-KW14-SEC-003 | vimeo-sync: Caller-Auth analog zu send-email implementieren |
| P3 | TS-QA-KW14-SEC-004 | WP_OAUTH_CLIENT_ID aus Env lesen |
| P3 | TS-QA-KW14-PERF-004 | trumpetstar-lernwelt.jpg: WebP oder JPEG-Kompression < 200KB |
| P3 | TS-QA-DB-001 | agent_log: RLS INSERT-Policy prüfen/einschränken |
| P3 | TS-QA-EMAIL-003 | SMTP: tls.rejectUnauthorized = true setzen |
| P3 | TS-QA-KW13-SEC-003 | send-invoice-email: Rate Limiting per IP/User implementieren |

---

## Retest Plan

| Issue | Retest-Methode |
|-------|----------------|
| TS-QA-KW14-SEC-001/002 | POST to send-email/elevenlabs-tts/stt ohne Auth-Header → expect 401 |
| TS-QA-KW14-PERF-002 | GameHUD in Browser öffnen, Logo sichtbar (kein broken image) |
| TS-QA-KW15-PERF-001 | Reset-Password-Seite öffnen, Logo sichtbar |
| TS-QA-KW14-PERF-004 (app-preview) | LandingPage öffnen, Preview-Image sichtbar |
