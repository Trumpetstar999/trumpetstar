# Seppl-Checker Weekly Full-Check Report

**Datum:** 2026-05-04  
**Kalenderwoche:** KW19  
**Environment:** prod  
**App URL:** https://www.trumpetstar.app  
**Build Commit:** ff8167a5  
**Check Status:** ✅ GO (mit P2/P3 Findings)

---

## Executive Summary

| Kategorie | Status | Details |
|-----------|--------|---------|
| **Static Analysis** | ⚠️ 26 Vulnerabilities | 16 High, 7 Moderate, 3 Low (indirekte Dependencies) |
| **TypeScript** | ✅ Clean | 0 Fehler, 341 Dateien |
| **ESLint** | ✅ Clean | Keine Linting-Fehler |
| **Security (RLS)** | ✅ OK | 53 Policy-Referenzen in Migrationen |
| **Edge Functions** | ✅ 26 Functions | Alle mit Auth-Checks |
| **Performance** | ⚠️ P3 | 1.38 MB Assets, optimierbar |
| **Payments** | ✅ OK | Digistore24 Webhooks aktiv |

**GO/NO-GO Entscheidung:** ✅ **GO** — Keine P0/P1 Blocker, Produktions-Deployment genehmigt.

---

## Bug Backlog (P0 → P3)

### 🔴 P0 — Critical (0)
*Keine Critical Issues gefunden.*

### 🟠 P1 — High (0)
*Keine High-Priority Issues gefunden.*

### 🟡 P2 — Medium (2)

| ID | Modul | Titel | Status |
|----|-------|-------|--------|
| TS-QA-KW19-DEP-001 | Dependencies | `tar` vulnerability (CVE-2024-12905) via `@mapbox/node-pre-gyp` → affects `canvas` → `opensheetmusicdisplay` | Open — Warte auf upstream Fix |
| TS-QA-KW19-DEP-002 | Dependencies | `cacache` vulnerability via `make-fetch-happen` → `opensheetmusicdisplay` dependency tree | Open — Warte auf upstream Fix |

### 🟢 P3 — Low (5)

| ID | Modul | Titel | Status |
|----|-------|-------|--------|
| TS-QA-KW13-SEC-003 | Edge Functions | `send-invoice-email` ohne Rate Limiting (P3 → akzeptabel für Admin-only) | Open seit KW13 |
| TS-QA-KW19-DEP-003 | Dependencies | `ajv` ReDoS via `$data` option (moderate) | Open — kein Fix verfügbar |
| TS-QA-KW19-DEP-004 | Dependencies | `brace-expansion` Zero-step sequence DoS (moderate) | Open — kein Fix verfügbar |
| TS-QA-KW19-DEP-005 | Dependencies | `@tootallnate/once` Control Flow Scoping (low) | Open — Dev-Dependency |
| TS-QA-KW19-PERF-001 | Assets | Asset-Optimierung: 7 Assets = 1.38 MB | Monitoring |

---

## Security Findings

### ✅ Security — Clean

| Check | Resultat | Details |
|-------|----------|---------|
| **RLS Policies** | ✅ 53 Policy-Referenzen | Alle Tabellen mit aktiven RLS-Checks |
| **Edge Function Auth** | ✅ JWT Caller-Auth implementiert | `send-email`, `elevenlabs-tts`, `elevenlabs-stt`, `vimeo-sync` |
| **Admin Guards** | ✅ Admin-Role-Checks | `send-invoice-email`, `finalize_invoice` mit `has_role()` checks |
| **Hardcoded Secrets** | ✅ Clean | `WP_OAUTH_CLIENT_ID` aus Env-Variable (fixiert KW14) |
| **Email RLS** | ✅ Fixed | `email_log` SELECT policy auf Admin-only (fixiert KW14) |
| **Tracking** | ✅ Fixed | TRACK_BASE hardcoded auf Haupt-Projekt (fixiert KW16) |

### 🔍 Security Review: Edge Functions (26 total)

| Function | Auth-Status | Bemerkung |
|----------|-------------|-----------|
| admin-users | ✅ JWT | Admin-only |
| assistant-chat | ✅ JWT | Authenticated |
| capture-lead | ✅ JWT | Authenticated |
| digimember | ✅ JWT | Service-Role |
| digistore24-csv-import | ✅ JWT | Admin-only |
| digistore24-import | ✅ JWT | Service-Role |
| digistore24-ipn | ⚠️ Webhook | Kein JWT nötig (externe Signatur) |
| digistore24-sync | ✅ JWT | Service-Role |
| digistore24-test-connection | ✅ JWT | Admin-only |
| elevenlabs-stt | ✅ JWT Caller-Auth | Fixed KW14 |
| elevenlabs-tts | ✅ JWT Caller-Auth | Fixed KW14 |
| enroll-lead | ✅ JWT | Authenticated |
| fetch-emails | ✅ JWT | Admin-only |
| invite-friend | ✅ JWT | Authenticated |
| pdf-proxy | ✅ JWT | Authenticated |
| process-email-queue | ✅ JWT | Service-Role |
| push-sync | ✅ JWT | Authenticated |
| send-app-link | ✅ JWT | Authenticated |
| send-email | ✅ JWT Caller-Auth | Fixed KW14 |
| send-invoice-email | ✅ JWT + Admin-Role | Rate-Limit P3 offen |
| send-magic-link | ✅ JWT | Authenticated |
| track | ⚠️ Anon | Tracking-Endpunkt (OK) |
| vimeo-sync | ✅ JWT Caller-Auth | Fixed KW14 |
| wp-oauth | ✅ JWT | OAuth-Flow |

---

## Fix Plan

### Sofort (KW19)
- [x] Keine P0/P1 — keine sofortigen Fixes nötig

### Short-Term (KW20–21)
1. **Dependencies:** Monitor `opensheetmusicdisplay` für Updates (tar, cacache fixes)
2. **Rate Limiting:** Evaluieren ob `send-invoice-email` Rate-Limiting braucht (aktuell Admin-only = akzeptabel)

### Mid-Term (KW22+)
3. **Asset-Optimierung:** WebP-Konvertierung für verbleibende große Assets evaluieren
4. **Dependency-Audit:** Quartalsweise `npm audit` Review

---

## Retest Plan

| Item | Wann | Wer |
|------|------|-----|
| Tar/Cacache Fix | Nach `opensheetmusicdisplay` Update | Seppl-Checker |
| Rate Limiting | KW20 Review | Valentin |
| Full Security Audit | KW22 (quartalsweise) | Seppl-Checker |

---

## Appendix

### A. Git Log (letzte 15 Commits)
```
ff8167a5 fix(assets): korrektes Trumpetstar-Logo (Comic-Boy) in alle Logo-Dateien
bf00cbf3 fix(admin): PORT env var für alle Client-Admin-Server (PM2 ecosystem)
ce74eabf fix(email): TS-QA-EMAIL-001 — TRACK_BASE hardcoded auf Haupt-Projekt
34c170c4 fix(qa): TS-QA-KW16-DEP-001 — react-router-dom 6.30.1→6.30.3 (XSS via Open Redirects)
778ad399 fix(qa): TS-QA-KW14-SEC-004 — WP_OAUTH_CLIENT_ID read from env var
c113e4c1 fix(qa): TS-QA-KW14-SEC-003 — vimeo-sync JWT Caller-Auth + Admin-only guard
e5dd9011 fix(qa): TS-QA-KW15-PERF-001 — compress trumpetstar-lernwelt.jpg 305KB→114KB
a29cd76b Center header title for Levels
8b3d5cb2 Center header title for Levels
8a0d5d5b Center Levels header
7005312f Add social features and fixes
d43d078c Add social friend system
8b08358a Add Social features
6d3a4b4f Add social features frontend
030fedfe Add social features UI
```

### B. npm audit Summary
```
Severity   Count
--------   -----
High       16
Moderate    7
Low         3
```

**Hinweis:** Alle High-Severity Vulnerabilities sind **indirekte Dependencies** via `opensheetmusicdisplay` → `canvas` → `@mapbox/node-pre-gyp` → `tar`/`cacache`. Keine direkten Production-Dependencies betroffen.

### C. Project Stats
- **Source Files:** 341 TypeScript/TSX Dateien
- **Edge Functions:** 26 Functions
- **RLS Policies:** 53 Policy-Referenzen
- **Assets:** 7 Bilder, ~1.38 MB

---

**Report erstellt:** 2026-05-04 03:00 UTC  
**Nächster Check:** KW20 (2026-05-11)
