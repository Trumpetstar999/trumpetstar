-- ============================================================
-- KW15 SEO Content Items – Supabase SQL Inserts
-- Tabelle: seo_content_items
-- Erstellt: 2026-04-11 | SEO-Karl
-- ============================================================
-- OPTION A: Direkt im Supabase SQL-Editor ausführen
-- OPTION B: RLS-Policy (unten) aktivieren, dann via REST API inserieren
-- ============================================================

-- SCHRITT 1: RLS INSERT-Policy aktivieren (einmalig als Admin)
-- Im Supabase Dashboard → Table Editor → seo_content_items → RLS Policies
-- ODER im SQL Editor:

CREATE POLICY "Allow anon inserts for SEO agent"
  ON seo_content_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Alternativ, falls authenticated bevorzugt:
-- CREATE POLICY "Allow service inserts" ON seo_content_items
--   FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- SCHRITT 2: Daten eintragen (6 Items KW15)
-- ============================================================

INSERT INTO seo_content_items
  (title, content_type, keyword, cluster, intent, status, outline, publish_date, priority, target_url)
VALUES
  (
    'Noten lesen für Trompete – Der komplette Anfänger-Guide (2026)',
    'pillar',
    'Noten lesen Trompete',
    'Notenlesen & Musiktheorie für Trompete',
    'informational',
    'draft',
    'H1: Noten lesen für Trompete: So fängst du heute an | H2: Was du brauchst | H2: Wie Noten funktionieren | H3: Notensystem | H3: Violinschlüssel | H2: Stammtöne | H2: Vorzeichen | H2: Rhythmus lesen | H2: Pausen | H2: 4-Wochen-Plan | H2: Häufige Fehler | H2: B-Instrument | H2: FAQ (7 Fragen) | H2: CTA',
    '2026-04-14',
    'high',
    '/blog/noten-lesen-trompete'
  ),
  (
    'Violinschlüssel für Trompete: So liest du ihn in 15 Minuten',
    'support',
    'Violinschlüssel Trompete',
    'Notenlesen & Musiktheorie für Trompete',
    'informational',
    'draft',
    'H1: Violinschlüssel lesen für Trompete – Schritt-für-Schritt | H2: Was ist der Violinschlüssel? | H2: Die 5 Linien | H2: Hilfslinien | H2: Schritt-für-Schritt Übung | H2: Fehler + Fix | H2: FAQ | H2: CTA',
    '2026-04-15',
    'medium',
    '/blog/violinschluessel-trompete'
  ),
  (
    'Trompete Transposition einfach erklärt – B-Instrument verstehen',
    'support',
    'Trompete Transposition',
    'Notenlesen & Musiktheorie für Trompete',
    'informational',
    'draft',
    'H1: Trompete Transposition | H2: Was bedeutet B-Instrument? | H2: Warum für Anfänger nicht kritisch | H2: Ensemble-Faustregel | H2: Schritt-für-Schritt | H2: Fehler + Fix | H2: FAQ | H2: CTA',
    '2026-04-16',
    'medium',
    '/blog/trompete-transposition-erklaert'
  ),
  (
    'Rhythmus lesen Trompete – Takt, Noten & Pausen einfach lernen',
    'support',
    'Rhythmus lesen Trompete',
    'Notenlesen & Musiktheorie für Trompete',
    'informational',
    'draft',
    'H1: Rhythmus lesen Trompete | H2: Was ist Rhythmus? | H2: 5 Grundwerte | H3: Notenwerte | H3: Punktierte Noten | H2: Taktarten | H2: Pausen | H2: Schritt-für-Schritt | H2: Fehler + Fix | H2: FAQ | H2: CTA',
    '2026-04-16',
    'medium',
    '/blog/rhythmus-lesen-trompete'
  ),
  (
    'Newsletter KW15: Noten lesen – in 15 Minuten (kein Witz)',
    'newsletter',
    'Noten lesen Trompete',
    'Notenlesen & Musiktheorie für Trompete',
    'consideration',
    'draft',
    'Betreff: Noten lesen – in 15 Minuten (kein Witz) | Vorschautext: Zwei Eselsbrücken. Fünf Linien. | Inhalt: Eselsbrücken + 3 Blog-Links + Level-1-CTA | Versand: Di 08.04.2026 09:00 CEST',
    '2026-04-08',
    'medium',
    NULL
  ),
  (
    'Social Snippets KW15 – Notenlesen & Musiktheorie (6 Stück)',
    'social',
    'Noten lesen Trompete',
    'Notenlesen & Musiktheorie für Trompete',
    'informational',
    'draft',
    '6 Snippets FB/IG/LI: Notenlinien-Hook, Eselsbrücken-Fact (Carousel), Eltern/Lehrer-Post, Motivation-Reframe, LinkedIn Pädagogen, Transpositions-Fact | Veröffentlichung: 08.–13.04.2026',
    '2026-04-08',
    'medium',
    NULL
  );

-- ============================================================
-- VERIFIKATION nach dem Insert:
-- ============================================================
SELECT id, title, content_type, status, publish_date
FROM seo_content_items
WHERE cluster = 'Notenlesen & Musiktheorie für Trompete'
ORDER BY publish_date ASC;
