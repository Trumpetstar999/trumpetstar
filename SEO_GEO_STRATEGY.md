# 🎯 SEO + GEO Automatisierungs-Strategie

## Übersicht: Traditionelles SEO + Generative Engine Optimization (GEO)

### Was ist GEO?
- Optimierung für AI-Suchmaschinen (ChatGPT, Perplexity, Claude, Gemini)
- Strukturierte Antworten, die AI-Systeme zitieren können
- Authority-Building durch umfassende, quellenbasierte Inhalte

---

## 📅 WOCHENPLAN (Automatisierbar)

### MONTAG: Content-Planung & Keyword-Research
**Automatisierung:**
- [ ] Scanne Trending Keywords in der Nische (Trompete lernen, Musik für Erwachsene)
- [ ] Prüfe Wettbewerber-Rankings
- [ ] Erstelle Content-Kalender für die Woche

**Ziel:** 2 Blog-Artikel + 3 Social Posts + 1 Video-Thema pro Woche

---

### DIENSTAG: Blog-Content Erstellung (SEO + GEO)
**Artikel-Struktur für SEO + GEO:**

```
1. Einführung (Direct Answer für Featured Snippets)
   → „Trompete lernen dauert 3-6 Monate für erste Songs"

2. strukturierte H2/H3 Überschriften
   → „Die 5 größten Anfänger-Fehler"
   → „Wie lange täglich üben?"

3. FAQ-Block (Schema markup)
   → 5-7 Fragen mit prägnanten Antworten

4. HowTo-Sektion (Schema markup)
   → Schritt-für-Schritt Anleitung

5. Autoritätsnachweise
   → Links zu wissenschaftlichen Studien
   → Zitate von Musikpädagogen

6. Interne Verlinkung
   → Links zu Produktseiten
   → Links zu anderen Guides
```

**GEO-Optimierung:**
- Konkrete, zahlenbasierte Antworten (AI zitiert gerne Fakten)
- Bullet-Point Listen (leicht extrahierbar)
- „Experten sagen..." Zitate (E-E-A-T)

---

### MITTWOCH: Technisches SEO
**Automatisierbare Tasks:**

1. **Schema Markup Updates**
   - Neue Blog-Artikel → Article Schema
   - Neue FAQs → FAQPage Schema
   - Neue Produkte → Product Schema

2. **Meta-Daten Optimierung**
   - Title: 50-60 Zeichen, Keyword vorne
   - Description: 150-160 Zeichen, Call-to-Action
   - OG Tags für Social Sharing

3. **Interne Verlinkung**
   - Neue Artikel mit 3-5 bestehenden Artikeln verlinken
   - Orphan Pages identifizieren

4. **Bild-Optimierung**
   - Alt-Texte mit Keywords
   - WebP Format
   - Lazy Loading

---

### DONNERSTAG: Content-Verbreitung (Off-Page SEO)

**Social Signals (für GEO wichtig):**
- Blog-Artikel auf LinkedIn/X teilen
- Instagram Carousel mit Key-Takeaways
- YouTube Video zum Thema

**Outreach (Backlinks):**
- 5 Musik-Blogs kontaktieren (Gastbeitrag oder Link-Austausch)
- 3 Musikschulen anschreiben (Partnerschaft)
- Antworte auf Fragen in Foren (Reddit, Quora) mit Link

**Local SEO:**
- Google Business Profile Updates
- Local Directory Einträge prüfen

---

### FREITAG: Analyse & Optimierung

**KPIs tracken:**
- Organic Traffic (Google Analytics)
- Keyword Rankings (Google Search Console)
- Click-Through-Rate (CTR)
- Backlink-Wachstum
- Social Engagement

**GEO-spezifische Metriken:**
- Brand Mentions in AI-Antworten (manuell testen: „Was ist Trumpetstar?" in ChatGPT)
- „People also ask" Coverage
- Featured Snippet Gewinne

---

## 🤖 AUTOMATISIERUNG via Dashboard

### Datenbank-Tabellen

```sql
-- seo_weekly_plan
CREATE TABLE seo_weekly_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  keyword_target text,
  content_type text, -- blog, video, social
  title text,
  status text DEFAULT 'planned', -- planned, in_progress, published
  assigned_to text,
  schema_markup_type text,
  priority integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- geo_tracking (AI-Suchmaschinen Performance)
CREATE TABLE geo_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text, -- z.B. "trompete lernen"
  ai_platform text, -- chatgpt, perplexity, claude
  trumpetstar_mentioned boolean,
  position text, -- cited, mentioned, not_found
  answer_quality text, -- accurate, partial, wrong
  checked_at timestamptz DEFAULT now()
);

-- backlink_opportunities
CREATE TABLE backlink_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text,
  site_url text,
  domain_authority integer,
  outreach_status text DEFAULT 'not_started', -- not_started, contacted, accepted, published
  contact_email text,
  notes text,
  priority integer DEFAULT 5
);
```

### Automatisierte Workflows

**1. Wöchentlicher Content-Kalender**
```
Jeden Montag:
→ Erstelle 2 neue Blog-Ideen in seo_weekly_plan
→ Ordne zu: SEO Schema-Typ, Keywords, Deadline
→ Erstelle Draft in content_pipeline
```

**2. Schema-Markup Auto-Generator**
```
Wenn Blog-Artikel veröffentlicht:
→ Prüfe Content-Struktur
→ Generiere passendes Schema (FAQ, HowTo, Article)
→ Speichere in seo_schema_snippets
→ Füge in Website-Head ein (via GitHub Commit)
```

**3. GEO Monitoring**
```
Jeden Freitag:
→ Teste 10 Keywords in ChatGPT/Perplexity
→ Speichere Ergebnisse in geo_tracking
→ Wenn nicht erwähnt → Erstelle Task für Content-Optimierung
```

**4. Backlink Outreach Reminder**
```
Wenn outreach_status = 'contacted' für 7+ Tage:
→ Erstelle Follow-up Task
→ Sende Erinnerung E-Mail
```

---

## 📊 SEO/GEO Dashboard Widgets

### 1. Content-Kalender Widget
- Zeigt diese Woche: Was ist geplant, was läuft, was ist done
- Drag & Drop Status-Änderungen

### 2. Ranking-Tracker Widget
- Target Keywords mit aktueller Position
- Trend (↑ ↓ →)

### 3. GEO Visibility Score
- Wie oft wird Trumpetstar in AI-Antworten erwähnt?
- Prozentuale Abdeckung pro Keyword-Kategorie

### 4. Backlink Pipeline
- Outreach Status-Übersicht
- Domain Authority der Ziele
- Konversionsrate

### 5. Technisches SEO Health Check
- Schema-Markup Coverage (XX% der Seiten)
- Core Web Vitals Scores
- Mobile-Friendly Status

---

## 🎯 90-Tage SEO/GEO Roadmap

### Monat 1: Foundation
- [ ] Alle bestehenden Seiten mit Schema markup
- [ ] 8 neue Blog-Artikel (2/Woche)
- [ ] Basis-Backlinks (10 Musik-Blogs)
- [ ] Google Search Console optimieren

### Monat 2: Content-Expansion
- [ ] Target: 20 Keywords auf Seite 1
- [ ] Video-Content (YouTube SEO)
- [ ] FAQ-Datenbank aufbauen (50+ Fragen)
- [ ] Erste GEO-Optimierungen sichtbar

### Monat 3: Authority Building
- [ ] Gastbeiträge auf Authority-Sites
- [ ] Expert-Interviews (Linkbait)
- [ ] Local SEO für Wien/Austria
- [ ] AI-Suchmaschinen zitieren Trumpetstar regelmäßig

---

## 🔧 Meine Rolle als Valentin

**Was ich automatisiere:**
✅ Content-Planung in Datenbank eintragen
✅ Schema-Markup generieren und einbauen
✅ GEO-Tracking (AI-Suchmaschinen-Tests)
✅ Backlink-Outreach-Liste pflegen
✅ Wöchentliche SEO-Reports erstellen
✅ GitHub Commits für technisches SEO

**Was du (Mario) erledigst:**
📝 Blog-Artikel schreiben (oder freigeben)
🎥 Videos produzieren
🤝 Persönliche Outreach (E-Mails, Partnerschaften)
✅ Content-Qualitäts-Check

---

## 💡 Nächster Schritt

Soll ich:
1. **Die Datenbank-Tabellen** für SEO/GEO Planung erstellen?
2. **Ein Dashboard-Widget** für den Content-Kalender bauen?
3. **Diesen Plan** in die Task-Verwaltung eintragen?
