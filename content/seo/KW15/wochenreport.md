# Wochenreport – KW15 (2026-04-07 bis 2026-04-13)

**Agent:** SEO-Karl  
**Generiert:** 2026-04-11  
**Cluster:** Notenlesen & Musiktheorie für Trompete

---

## Assets dieser Woche

| Titel | Typ | Primäres Keyword | Wörter (ca.) | Status |
|---|---|---|---|---|
| Noten lesen für Trompete – Der komplette Anfänger-Guide (2026) | Pillar | Noten lesen Trompete | ~2.500 | ✅ Produziert |
| Violinschlüssel für Trompete: So liest du ihn in 15 Minuten | Support 1 | Violinschlüssel Trompete | ~1.100 | ✅ Produziert |
| Trompete Transposition einfach erklärt – B-Instrument verstehen | Support 2 | Trompete Transposition | ~1.150 | ✅ Produziert |
| Rhythmus lesen Trompete – Takt, Noten & Pausen einfach lernen | Support 3 | Rhythmus lesen Trompete | ~1.200 | ✅ Produziert |
| 6 Social Snippets (FB/IG/LI) | Social | — | ~700 | ✅ Produziert |
| Newsletter-Draft KW15 | Newsletter | — | ~330 | ✅ Produziert |
| Internal Linking Map KW15 | Linking | — | 21 Links | ✅ Produziert |
| FAQ Schema JSON-LD (4 Artikel) | Schema | — | — | ✅ Produziert |

**Gesamt Wortanzahl Content:** ca. 6.000 Wörter (exkl. Meta/Linking/Schema)  
**Alle Deliverables erfüllt:** ✅ A, B, C, D, E, F

---

## Keywords & Intents abgedeckt

| Keyword | Intent | Artikel |
|---|---|---|
| Noten lesen Trompete | Informational → Consideration | Pillar |
| Noten lesen lernen Anfänger | Informational | Pillar |
| Violinschlüssel Trompete | Informational (How-To) | Support 1 |
| G-Schlüssel Erklärung | Informational | Support 1 |
| Notenlinien Trompete | Informational | Support 1 |
| Trompete Transposition | Informational (Konzept) | Support 2 |
| B-Instrument Trompete | Informational | Support 2 |
| Trompete klingt B | Informational | Support 2 |
| Rhythmus lesen Trompete | Informational (How-To) | Support 3 |
| Notenwerte Trompete | Informational | Support 3 |
| Taktarten Anfänger | Informational | Support 3 |
| Metronom Trompete Anfänger | Informational | Support 3 |

**Gesamt unique Keywords:** 12 primäre + ~18 sekundäre

---

## Topical Authority – Cluster-Übersicht (Stand KW15)

| Cluster | Abgedeckt in KW | Status |
|---|---|---|
| Trompete lernen Erwachsene | KW10, KW13 | ✅ Stark |
| Trompete für Kinder & Eltern | KW11 | ✅ Gut |
| Hohe Töne & Ansatz | KW10, KW13 | ✅ Gut |
| Atemübungen & Stütze | KW13 | ✅ Gut |
| Notenlesen & Musiktheorie | **KW15** | ✅ Neu — komplett |
| Übeplan & Motivation | KW14 (nicht produziert) | ⚠️ Fehlt noch |
| Trompete kaufen / Instrument | — | ⚠️ Fehlt noch |
| Fortgeschrittene Technik | — | ⚠️ Fehlt noch |

---

## Technische Checks (KW15)

| Check | Status | Notiz |
|---|---|---|
| Meta-Titel ≤ 60 Zeichen | ✅ Alle geprüft | Pillar: 57 Zeichen ✓ |
| Meta-Description ≤ 155 Zeichen | ✅ Alle geprüft | Alle unter 155 Zeichen ✓ |
| URL-Slugs clean (kein Umlaut) | ✅ | Alle Slugs ASCII-konform |
| CTA vorhanden | ✅ Alle 4 Artikel | Soft (2-3×) + Hard CTA (1×) |
| Interne Links vorhanden | ✅ 21 Links in linking-map.md | Implementierung im CMS ausstehend |
| FAQ Schema vorhanden | ✅ Alle 4 Artikel | schema.md → Rich Results Test ausstehend |
| Keyword-Stuffing geprüft | ✅ Keine Häufung | Natürliche Verteilung |
| Medizinische Claims vorhanden | ✅ Keine | Guardrail eingehalten |
| Erfundene Studien/Zitate | ✅ Keine | Nur allgemeine Praxis-Aussagen |
| Cannibalization-Risiko | ✅ Gering | Neues Cluster, bisher kein Überschneidungsrisiko |
| Supabase-Einträge | ⚠️ Ausstehend | RLS blockiert Anon-Insert — SQL-Datei in `supabase_inserts.sql` bereit |

---

## Annahmen & Risiken

> **[Assumption]** Web Search (Perplexity API) war nicht verfügbar. Keywords basieren auf Fachnissen über DACH-Suchintent-Muster für Musikinstrument-Learning. Validierung via Google Search Console / Ahrefs vor dem Publishing empfohlen.

> **[Assumption]** Bestehende Trumpetstar-Blog-Artikel aus KW10–KW13 sind die einzigen bekannten Inhalte. Vor dem Retro-Verlinken (linking-map.md) alle Slugs im CMS prüfen.

> **[RLS-Issue]** Supabase REST Insert schlug fehl (HTTP 401 — Row Level Security Policy). Die Tabelle `seo_content_items` erlaubt dem `anon`-Rolle keinen INSERT. Fix: Im Supabase SQL-Editor die Datei `supabase_inserts.sql` ausführen (enthält RLS-Policy-Grant + alle 6 INSERT-Statements). Service_role Key nicht im Workspace vorhanden.

> **[Assumption]** Keine KW14-Inhalte produziert (kein entsprechender Ordner vorhanden). Empfehlung: KW14-Cluster "Übeplan & Motivation" nachholen oder als KW16-Thema fortführen.

> **[Assumption]** `/blog/blaesserklasse-trompete` aus KW11 enthält möglicherweise einen Umlaut im Slug. Muss gegen das CMS abgeglichen werden.

---

## KW16 – Next Week Plan

**Vorgeschlagener Cluster: Übeplan & Motivation** *(Nachholung von KW14-Plan)*

| Typ | Titel | Keyword |
|---|---|---|
| Pillar | Trompete üben Anfänger – Der ideale Tagesplan (mit Vorlage) | Trompete Übeplan Anfänger |
| Support A | Motivation beim Trompetenüben: Was tun, wenn die Lust fehlt? | Trompete Motivation üben |
| Support B | Trompete lernen ohne Lehrer: Was funktioniert, was nicht | Trompete lernen selbst beibringen |
| Support C | 10-Minuten-Routine für Trompete – so übt man richtig kurz | 10 Minuten Trompete üben |

**Newsletter-Thema:** "Dein persönlicher Übeplan – Download-Vorlage"  
**Freebie-Hook:** "5-Tage-Übeplan (PDF)" als Lead-Magnet  
**Social-Focus:** Motivation, Routine, "Ich hab keine Zeit"-Einwand entkräften

**Technische Prioritäten KW16:**
- Alle KW15-Artikel ins CMS laden und Verlinkungen aus linking-map.md setzen
- Google Rich Results Test für alle 4 FAQ-Schemas
- Social Snippets aus KW15 terminieren (Buffer/Hootsuite/Publer)
- Newsletter aus newsletter.md in ESP einpflegen
- Retro-Links aus KW10–KW13 auf neue KW15-Artikel setzen

---

## Wochenabschluss-Notiz

Alle 8 Deliverables für KW15 wurden vollständig produziert und in `/workspace/trumpetstar/content/seo/KW15/` abgelegt. Der Cluster "Notenlesen & Musiktheorie" war bisher vollständig unbesetzt — KW15 schließt diese topical-authority Lücke. Supabase-Insert konnte nicht automatisch ausgeführt werden (RLS auf anon-Rolle). Alle 6 INSERT-Statements + RLS-Fix-Policy liegen bereit in `supabase_inserts.sql` — einmaliger Ausführung im Supabase SQL-Editor genügt. Nächster Handlungsschritt für das Team: CMS-Import + Linking-Implementierung + Newsletter-Versand + Retro-Verlinkung in KW10–KW13.

---

*SEO-Karl | KW15/2026 | Trumpetstar Weekly SEO Workflow*
