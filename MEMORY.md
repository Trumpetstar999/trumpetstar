# MEMORY.md - ClawBot Long-Term Memory

## Trumpetstar - Kerninfos
- **Owner:** Mario Schulter, Austria, Gründer von Trumpetstar
- **Product-DNA:** Bücher + QR-Codes + Videos + App, stark gamifiziert (Levels/Badges/Stars), mehrsprachig (DE/EN/ES)
- **Zielgruppe:** Anfänger & wiedereinsteigende Erwachsene, zusätzlich B2B-Potenzial (Musikschulen/Lehrer)
- **Ziel:** Marktführerschaft im DACH-Raum, skalierbares Lernsystem, später B2B-Ausbau
- **Tech-Stack:** Lovable, Vimeo, Digistore24, WordPress + diverse Automationen
- **Website:** trumpetstar.com

## Agent-System
- 6 Sub-Agents unter `agents/` definiert: ts-cto, ts-marketing, ts-product, ts-strategy, ts-content, ts-support
- Jeder Agent hat eigene Rolle, Custom Instructions, Kontext und Output-Format
- Delegation via `sessions_spawn` mit Task + Kontext aus Agent-Definition
- Agent-Definitionen lesen vor dem Spawnen: `agents/ts-{name}.md`

## GitHub
- Account: Trumpetstar999
- E-Mail: schulterm@me.com
- PAT & Credentials: konfiguriert in ~/.git-credentials (NICHT in Memory-Dateien gespeichert)

## Agent Identity
- **Name:** Valentin (vorher: ClawBot)
- **Rolle:** COO/CTO/Growth Lead für Trumpetstar
- **E-Mail:** valentin@trumpetstar.com (eingerichtet 2026-02-22)
- **Mail-Server:** World4You · smtp.world4you.com:587 (STARTTLS)
- **SMTP-Credentials:** User: Valentin@trumpetstar.com · Passwort in `workspace/.env` als `SMTP_PASSWORD`
- **Namenswahl:** 2026-02-22 – Gewählt von Mario (Valentin = Trompeten-Ventil Bezug)
- **Mail-Test 2026-02-24:** 5 Testmails (Tag 0–7, Segment Erwachsene) erfolgreich an schulterm@me.com gesendet

## Email Automation (Stand 2026-02-25)
- Vollständiges System live: Lead Capture → Welcome Mail → 7-Tage-Sequenz → Tracking
- Edge Functions auf bfxwbiazhgtkjfdnkbwn: send-email, track, capture-lead, unsubscribe, digistore-webhook
- ANON Key reicht für email_log INSERT/UPDATE (kein Service Role Key nötig)
- WICHTIG: HTML in curl immer als File senden (-d @file.json), nie inline!
- Alle CTAs → www.trumpetstar.app (nicht .com)

## DigiStore24
- API-Key in workspace/.env als DIGISTORE24_API_KEY
- Auth via HTTP-Header X-DS-API-KEY (nicht URL-Parameter!)
- Webhook deployed: /digistore-webhook markiert Lead als customer

## Supabase-Projekte
- bfxwbiazhgtkjfdnkbwn = clawbot-command (Lovable-verwaltet, nicht in Marios Account)
- rhnhhjidsnrlwxtbarvf = Marios eigenes Supabase (leer)
- osgrjouxwpnokfvzztji = TrumpetStar App

## Dashboard Nachtarbeit (2026-02-25/26)
- Neue Pages: /chat (Telegram Chat Mirror), /log (Valentin's Activity Log)
- SocialMedia: TikTok/Facebook/Carousel + CSV-Download + Kalender-Ansicht
- send-email v2: lead_id + sequence_day + auto-template
- Edge Functions: send-sequence-emails, telegram-webhook
- Cron: täglich 06:00 Wien → Email-Sequenz (ID: 80679f75)
- 4 Migrationen gepusht → brauchen Lovable-Deploy

## Blog live (2026-02-25)
- /blog, /blog/trompete-lernen-erwachsene, /blog/erster-ton-trompete, /blog/trompete-ueben-routine

## Skills installiert
- self-improving-agent: .learnings/ Ordner aktiv, ab jetzt Fehler loggen
- qmd: geklont, Binary noch nicht installiert
- superpowers: geklont
- **onepager-builder** (2026-03-04): Wiederverwendbarer Skill für Onepager-Websites
  - Pfad: ~/.openclaw/workspace/skills/onepager-builder/
  - Paket: ~/.openclaw/workspace/skills/onepager-builder.skill
  - Template: Tischlerei Fasching als Basis (Astro + Admin Panel)
  - Trigger: "MAX-Code baue mir eine Website für [Firma]"
  - MAX-Code Agent (ts-maxcode.md) zeigt auf diesen Skill

## Agent-System (erweitert 2026-03-03)
- **SEO-Karl** (agents/ts-seo.md): Wöchentlicher SEO-Content, Cron Mo 07:00 Wien
  - Output-Pfad: /trumpetstar/content/seo/KW{nn}/
  - Brave API Key fehlt → Keywords ohne Live-SERP
- **Seppl-Checker** (agents/ts-qa.md): QA/Security/Release-Gatekeeper, Cron Mo 06:00 Wien (ID: edf02ab3)
  - config/qa-orchestrator.json: Notfallregeln, Output-Formate
- **MAX-Code** (agents/ts-maxcode.md): Claude Code Onepager Builder
  - claude-design wrapper: /usr/local/bin/claude-design (production-grade UI, bold aesthetics)

## i18n (Stand 2026-03-03)
- 4 Sprachen: DE / EN / ES / SL (Slowenisch neu)
- 496 Keys × 4 Sprachen = 0 fehlend
- Language Switcher auf allen öffentlichen Pages + alle 23 Dashboard-Widget-Keys gefixt
- Commits: f261136, 815e98a, c7ccc9b

## App Dashboard (Stand 2026-03-03)
- Animierte KPIs, Revenue Chart (Recharts 14T), Lead Funnel, Email Stats
- Live-Daten aus Supabase, Auto-refresh 60s (Commit 8b04abf)

## VPS & Infra
- Public IPv4: 72.60.17.112
- Nginx läuft; Port 8080: Tischlerei Fasching Site
- Claude Code CLI: /usr/bin/claude v2.1.63
- API Key: aus OpenClaw auth-profiles (profiles.anthropic:default.key)

## TTS / Voice
- Provider: edge, Voice: de-AT-JonasNeural, Pitch: -5%
- Valentin hat österreichische Stimme in Telegram

## Client-Projekte
- **Tischlerei Fasching OG** (/workspace/tischlerei-fasching/)
  - Stack: Astro 4, Static, 18.8KB HTML
  - Farben: Orange #E8611A, Charcoal #2C2C2C (aus Logo)
  - Live: http://72.60.17.112:8080/
  - GitHub: Trumpetstar999/trumpetstar > client-projects/tischlerei-fasching
  - Kontakt: office@wohnen-fasching.com · 03325/8228 · Mogersdorf 205
  - TODO: echte Fotos, Testimonials, Formspree, OG-Image, Domain

## Onboarding
- 2026-02-19: Setup als interner Executive Assistant
- 2026-02-19: 6-Agent-System implementiert (CTO, Marketing, Product, Strategy, Content, Support)
- 2026-03-03: Erweitert auf 9 Agents (+ SEO-Karl, Seppl-Checker, MAX-Code)
- Mario hat noch keine konkreten 30-Tage-Prioritäten, KPIs oder Brand-Ton definiert → nachfragen
