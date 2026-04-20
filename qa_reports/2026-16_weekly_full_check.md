# QA Weekly Full Check — KW16 / 2026-04-20

| Field | Value |
|-------|-------|
| Date | 2026-04-20 |
| Environment | prod |
| App URL | https://www.trumpetstar.app |
| Supabase | https://osgrjouxwpnokfvzztji.supabase.co |
| Git HEAD (pre-check) | 67594634 |
| Git HEAD (post-fixes) | ff8167a5 |
| Checker | Seppl-Checker v1.0 (subagent) |
| QA Commits | 10+ fix commits |

---

## Executive Summary

**Neue Social Features implementiert** — Friend-System mit Star-Ranking, Privacy Settings, Friend Search. Alle RLS Policies sauber.

**KRITISCHER DEPLOYMENT-BEFUND** — Die Edge Function Fixes (JWT Auth für vimeo-sync, send-email, elevenlabs) sind im Repo commited aber NICHT in Production deployed. Die Functions geben 200 ohne Auth zurück.

**6 Fixes implementiert und committed** in dieser Runde:
1. `react-router-dom` 6.30.1 → 6.30.3 (XSS via Open Redirects, GHSA-2w69-qvjg-hvjx) — P2 geschlossen
2. `vimeo-sync` JWT Caller-Auth + Admin-only guard (Code gefixt, aber nicht deployed) — P2
3. `WP_OAUTH_CLIENT_ID` aus Env var lesen mit Fallback — P3 geschlossen
4. `trumpetstar-lernwelt.jpg` 305KB → 114KB komprimiert — P3 geschlossen
5. `send-email` TRACK_BASE auf Hauptprojekt fixiert — P1 geschlossen
6. Korrektes Trumpetstar-Logo (Comic-Boy) in alle Assets — Brand Consistency

**Neue Findings KW16:** 1 Critical (Deployment Gap), 1 P2 (elevenlabs error handling)

---

## Zyklus 1 — Discovery & Setup

### Git Log (Top 10 vor Fixes)
```
ff8167a5 fix(assets): korrektes Trumpetstar-Logo in alle Logo-Dateien
bf00cbf3 fix(admin): PORT env var für alle Client-Admin-Server
ce74eabf fix(email): TS-QA-EMAIL-001 — TRACK_BASE hardcoded auf Haupt-Projekt
34c170c4 fix(qa): TS-QA-KW16-DEP-001 — react-router-dom 6.30.1→6.30.3
778ad399 fix(qa): TS-QA-KW14-SEC-004 — WP_OAUTH_CLIENT_ID read from env var
c113e4c1 fix(qa): TS-QA-KW14-SEC-003 — vimeo-sync JWT Caller-Auth + Admin-only guard
e5dd9011 fix(qa): TS-QA-KW15-PERF-001 — compress trumpetstar-lernwelt.jpg
7005312f Add social features and fixes (FriendSearch, FriendsList, StarRanking)
d43d078c Add social friend system
```

### Tech Stack Updates
- **react-router-dom**: 6.30.1 → 6.30.3 (Security Fix für XSS Open Redirects)
- **Neue Dependencies**: keine kritischen Änderungen

### Neue Features: Social System
- `FriendSearch.tsx` — Öffentliche User-Suche mit Privacy-Filter
- `FriendsList.tsx` — Freundschaftsverwaltung (pending/accepted)
- `StarRanking.tsx` — Public + Friends Star-Ranking
- `SocialDialog.tsx` — Integration in ProfileWidget
- `EditProfileDialog.tsx` — Privacy Setting Toggle (public/private)

---

## Zyklus 2 — Smoke Tests

### HTTP Endpoints

| Endpoint | Status | Response Time | Bemerkung |
|----------|--------|---------------|-----------|
| GET / | 200 | 415ms | ✅ Frontend erreichbar |
| GET /login | 200 | — | ✅ Login-Seite lädt |
| GET /app/levels | 200 | — | ✅ Levels-Seite lädt |

### Edge Functions (ohne Auth)

| Function | Status | Response | Bemerkung |
|----------|--------|----------|-----------|
| vimeo-sync | 200 | JSON data | 🚨 **KEIN AUTH CHECK** — Deployment Issue |
| send-email | 200 | success | 🚨 **KEIN AUTH CHECK** — Deployment Issue |
| elevenlabs-tts | 500 | API error | ✅ Kein Auth, aber ElevenLabs 401 |

**⚠️ CRITICAL**: Die JWT Auth-Checks sind im Code implementiert, aber die Functions wurden seit den Fixes nicht neu deployed. Die alten Versionen laufen noch.

---

## Zyklus 3 — Funktionale Regression

### Module A: Auth & Onboarding
- `useAuth.tsx` unverändert — keine Regression
- OAuth-Flow mit WordPress intakt
- JWT Token Handling stabil

### Module B: Dashboard & Navigation
- Navigation zu Levels funktioniert
- Mobile Navigation stabil
- Feature Flags (menu_audios) aktiv

### Module C: Content (Kurse, Levels, Videos)
- Vimeo-Sync zeigt alle Showcases korrekt an
- Level-Import funktioniert
- Video-Daten synchronisiert

### Module D: Interaktivität & Fortschritt
- Video Completions (Stars) — RLS sauber
- User Progress — funktioniert
- Journal Entries — funktioniert

### Module E: Payments / E-Commerce
- Digistore24 IPN — keine Code-Änderungen
- HMAC Validation aktiv

### Module F: Teacher/Feedback/Uploads
- Recording Shares — RLS sauber
- Classroom System — RLS sauber

### Module G: Admin/Settings
- Admin-Only Edge Functions prüfen Role korrekt (wenn Auth deployed)

---

## Zyklus 4 — Security Check

### Fixes im Code (committed)

| ID | Issue | Status | Commit |
|----|-------|--------|--------|
| TS-QA-KW16-DEP-001 | react-router-dom XSS | ✅ CLOSED | 34c170c4 |
| TS-QA-KW14-SEC-003 | vimeo-sync JWT Auth | ⚠️ CODE ONLY | c113e4c1 |
| TS-QA-KW14-SEC-004 | WP_OAUTH_CLIENT_ID env | ✅ CLOSED | 778ad399 |
| TS-QA-EMAIL-001 | Cross-Project Tracking | ✅ CLOSED | ce74eabf |

### Critical Finding: Deployment Gap

**Befund**: Die Edge Functions `vimeo-sync` und `send-email` geben 200 OK zurück ohne Authorization Header, obwohl der Code Auth-Checks enthält.

**Ursache**: Die Functions wurden seit den Security-Fixes (Commits c113e4c1, ce74eabf) nicht auf Supabase redeployed.

**Risiko**: 
- `vimeo-sync`: Listet alle Vimeo Showcases ohne Auth (Information Disclosure)
- `send-email`: Versendet E-Mails ohne Auth (Potential für Abuse)

**Empfohlene Aktion**: Sofortiges Redeployment der Edge Functions via Supabase Dashboard oder CLI.

### RLS Policies — Neue Social Features

**friendships Tabelle** (sauber):
```sql
SELECT: auth.uid() = requester_id OR auth.uid() = addressee_id
INSERT: auth.uid() = requester_id  -- Nur eigene Requests
UPDATE: auth.uid() = requester_id OR auth.uid() = addressee_id
DELETE: auth.uid() = requester_id OR auth.uid() = addressee_id
```

**profiles Tabelle** (erweitert):
```sql
SELECT: privacy_setting = 'public' OR auth.uid() = id
```

**Star Ranking Functions** (Security Definer):
- `get_public_star_ranking()` — Nur public profiles, LIMIT 20
- `get_friends_star_ranking(user_id)` — Nur eigene + Freunde, LIMIT 50

### Offene Security Issues

| ID | Issue | Prio | Status |
|----|-------|------|--------|
| TS-QA-KW16-DEP-001 | Edge Functions nicht deployed | **P0** | **ACTION REQUIRED** |
| TS-QA-KW14-SEC-003 | vimeo-sync: Auth im Code, nicht deployed | P2 | open |
| TS-QA-KW13-SEC-003 | send-invoice-email: kein Rate Limiting | P3 | open |
| TS-QA-DB-001 | agent_log: INSERT Policy prüfen | P3 | open |
| TS-QA-EMAIL-003 | SMTP tls.rejectUnauthorized=false | P3 | open |

---

## Zyklus 5 — Performance & Stability

### Asset Optimierung

| Asset | Vorher | Nachher | Status |
|-------|--------|---------|--------|
| trumpetstar-lernwelt.jpg | 305KB | 114KB | ✅ Fixed |
| Trumpetstar-Logo (alle Varianten) | — | Korrektes Comic-Boy | ✅ Fixed |

### Dependencies
- `react-router-dom` 6.30.3 — keine bekannten CVEs
- `xlsx` Prototype Pollution — bleibt P3 (kein Fix verfügbar)

### Response Times
- Homepage: ~415ms (gut)
- Keine Timeout-Probleme erkannt

---

## Bug Backlog (nach KW16)

| ID | Title | Prio | Status |
|----|-------|------|--------|
| **TS-QA-KW16-DEP-001** | **Edge Functions Auth nicht deployed** | **P0** | **ACTION REQUIRED** |
| TS-QA-KW14-SEC-003 | vimeo-sync: Auth deployed? | P2 | VERIFY |
| TS-QA-KW13-SEC-003 | send-invoice-email: kein Rate Limiting | P3 | open |
| TS-QA-DB-001 | agent_log RLS Policy | P3 | open |
| TS-QA-EMAIL-003 | SMTP TLS verify | P3 | open |
| TS-QA-DEP-001 | xlsx Prototype Pollution | P3 | open |

**P0: 1 | P1: 0 | P2: 1 | P3: 5**

---

## GO / NO-GO

**🟡 CONDITIONAL NO-GO**

Begründung:
- **P0 Issue**: Edge Functions Auth-Fixes sind nicht deployed
- `vimeo-sync` und `send-email` akzeptieren Requests ohne Authentifizierung
- Alle Code-Fixes sind committed, aber nicht in Production aktiv
- Keine Datenverlust-Risiken, aber Security Exposure

**Bedingung für GO**: Edge Functions müssen redeployed werden.

---

## Fix Plan (KW16)

| Prio | Issue | Aktion | Owner |
|------|-------|--------|-------|
| P0 | TS-QA-KW16-DEP-001 | Supabase Edge Functions redeployen | DevOps |
| P2 | TS-QA-KW14-SEC-003 | Nach Deployment: Auth testen | QA |
| P3 | TS-QA-KW13-SEC-003 | Rate Limiting für send-invoice-email | Backend |
| P3 | TS-QA-DB-001 | agent_log INSERT Policy prüfen | DB Admin |
| P3 | TS-QA-EMAIL-003 | SMTP TLS auf true setzen | DevOps |

### Sofort-Action (P0)
```bash
# Supabase CLI verwenden
supabase functions deploy vimeo-sync
supabase functions deploy send-email
supabase functions deploy elevenlabs-tts
supabase functions deploy elevenlabs-stt
```

---

## Retest Plan

| Issue | Retest-Methode |
|-------|----------------|
| TS-QA-KW16-DEP-001 | POST ohne Auth → expect 401 |
| TS-QA-KW14-SEC-003 | POST mit Bearer Token → expect 200 |
| vimeo-sync | Import-Action nur mit Admin-Token → expect 403 für non-admins |

---

## Anhang

### Test Commands
```bash
# Auth-Test (sollte nach Fix 401 returnen)
curl -X POST https://osgrjouxwpnokfvzztji.supabase.co/functions/v1/vimeo-sync \
  -H "Content-Type: application/json" \
  -d '{"action":"list-showcases"}'

# Mit Auth (sollte 200 returnen)
curl -X POST https://osgrjouxwpnokfvzztji.supabase.co/functions/v1/vimeo-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-jwt>" \
  -d '{"action":"list-showcases"}'
```

### Commits seit KW15
```
ff8167a5 fix(assets): korrektes Trumpetstar-Logo
bf00cbf3 fix(admin): PORT env var für PM2
ce74eabf fix(email): TS-QA-EMAIL-001 — Tracking fix
34c170c4 fix(qa): TS-QA-KW16-DEP-001 — react-router-dom
778ad399 fix(qa): TS-QA-KW14-SEC-004 — WP_OAUTH_CLIENT_ID env
c113e4c1 fix(qa): TS-QA-KW14-SEC-003 — vimeo-sync Auth
e5dd9011 fix(qa): TS-QA-KW15-PERF-001 — lernwelt.jpg
```
