-- Trumpetstar Wissensdatenbank: Fehlende Kerneinträge für knowledge_sources
-- Enthält: Pricing, Gutscheincode, Kontakt, Instrument-Empfehlung, Konzept, Team, Bücher, Lehrer, PRO, App, Erwachsene, Zugriff

INSERT INTO knowledge_sources (title, type, language, visibility, tags, content) VALUES

('Preise & Abo-Konditionen', 'faq', 'de', 'FREE',
  ARRAY['preis', 'abo', 'kosten', 'monatlich', 'kündigung', 'garantie'],
  'Trumpetstar Abo (Testzugang / Monatsabo): €19,00/Monat
- Kein Vertrag, keine Mindestlaufzeit, jederzeit kündbar
- Kündigung: kurzes E-Mail an valentin@trumpetstar.com – keine Kündigungsfrist
- Bitte E-Mail bis 48 Stunden vor Beginn des nächsten Abrechnungsmonats senden
- 30-Tage Geld-zurück-Garantie ohne Wenn und Aber
- Abo-Kunden erhalten Rabatt auf alle Bücher im Shop
- Kauflink: https://www.digistore24.com/product/345378'
),

('Gutscheincode einlösen (Buchkauf)', 'faq', 'de', 'FREE',
  ARRAY['gutschein', 'code', 'buch', 'einlösen', 'testzugang', 'digistore'],
  'Wer ein Trumpetstar-Buch gekauft hat, erhält einen Gutscheincode für 1 Monat kostenlosen Testzugang.
Einlösen in 2 Schritten:
1. Gehe zu: https://www.digistore24.com/product/345378
2. Beim Checkout das Feld "Sie haben einen Gutschein?" ausfüllen und den Code eintragen

Wichtig: Den Code beim Kauf/Checkout eingeben, nicht nach dem Kauf!
Bei Problemen: E-Mail an valentin@trumpetstar.com'
),

('Kontakt & Support', 'faq', 'de', 'FREE',
  ARRAY['kontakt', 'support', 'email', 'telefon', 'hilfe'],
  'Trumpetstar Kontakt:
- E-Mail: valentin@trumpetstar.com (für alle Anfragen, Kündigung, Support)
- Telefon: +43 664/45 30 873
- Website: https://www.trumpetstar.com
- App: https://www.trumpetstar.app
- Inhaber: Mario Schulter, MA

Antwortzeiten: Werktags, in der Regel innerhalb von 1–2 Tagen.'
),

('Welche Trompete / welches Instrument für Kinder?', 'faq', 'de', 'FREE',
  ARRAY['instrument', 'trompete', 'kinder', 'kaufen', 'empfehlung', 'kornett'],
  'Für Kinder (5–7 Jahre): Statt einer normalen Trompete empfiehlt Trumpetstar ein Kornett – es ist leichter, kompakter und einfacher zu halten.

Konkrete Empfehlungen:
- Schagerl Kornett K 451L (Anfänger-Kornett)
- Schagerl Taschentrompete T 200L (für sehr kleine Kinder)

Wichtig: Das Kind sollte die Schneidezähne haben (ab ca. 5–6 Jahren).

Für Erwachsene: Eine normale B-Trompete, Anfänger-Modell vom Musikhaus des Vertrauens. Budget: ca. €200–400.'
),

('Das Konzept: Starmethode, Level-System & Heldenreise', 'faq', 'de', 'FREE',
  ARRAY['starmethode', 'level', 'sterne', 'gamification', 'konzept', 'heldenreise'],
  'Trumpetstar arbeitet mit einem gamifizierten Lernkonzept:

Starmethode: Schüler sammeln Sticker-Sterne als Belohnung für schön vorgespielte Stücke. Ein Sternchen wird ins Buch eingeklebt – motivierend wie ein Spielstand.

Level-System: Der Lernprozess ist in viele Miniziele (Levels) aufgeteilt. Ein Level besteht aus 7 Liedern mit methodisch passenden Übungen und einem Duett. Jedes Level erzählt eine kleine Geschichte.

Heldenreise: Musik fördert Gehörbildung, Motorik, Sprache, Rhythmusgefühl, logisches Denken und Kreativität – verpackt in eine abenteuerliche Lernreise.

Konnektivität: Bücher + QR-Codes + Videos + App = multimediales Lernerlebnis.'
),

('Über Trumpetstar: Das Team', 'faq', 'de', 'FREE',
  ARRAY['team', 'über uns', 'gründer', 'mario schulter'],
  'Das Trumpetstar-Team:
- Mario Schulter, MA – Founder Trumpetstar, professioneller Trompeter & Educator
- Klemens Kollmann, BA – Co-Founder Trumpetstar
- DI Gernot Griesbacher – IT-Experte
- DI Markus Stradner, BSc – App-Entwickler

Trumpetstar wurde gegründet, um die erste digital unterstützte Trompetenschule mit praxiserprobtem pädagogischem Konzept zu schaffen.
Mehr: https://www.trumpetstar.com/ueber-uns/'
),

('Trumpetstar Bücher: Band 1 & Band 2', 'faq', 'de', 'FREE',
  ARRAY['buch', 'band 1', 'band 2', 'qr-code', 'noten', 'shop'],
  'Band 1 – Anfängerschule:
- Komplette Anfängerschule für Trompete (ab 5–6 Jahren oder für Erwachsene)
- QR-Codes zu allen Lernvideos des Beginnerlevels (gratis, kein Abo nötig)
- Enthält Starmethode: Sticker-Sterne zum Einkleben
- Kaufen: https://www.trumpetstar.com/shop/ (Abo-Kunden erhalten Rabatt)

Band 2 – Aufbaukurs:
- Aufbaukurs nach Band 1
- QR-Codes zu den Videos des 1. Levels (gratis)
- Für alle weiteren Levels: Upgrade auf PRO oder Videokurs nötig
- Kaufen: https://www.trumpetstar.com/shop/

Allgemein: Abo-Kunden erhalten auf alle Bücher einen Rabatt.'
),

('Für Lehrer & Bläserklassen', 'faq', 'de', 'FREE',
  ARRAY['lehrer', 'pädagoge', 'bläserklasse', 'musikschule', 'unterricht'],
  'Für Musikpädagog:innen und Bläserklassen:

Option 1 (kostenlos):
- Buch + kostenlose Trumpetstar-App
- Playbacks kostenlos verfügbar
- Beginnerlevel-Videos per QR-Code aus Buch

Option 2 (Abo/Kurs):
- Abo: Monatlich neue Specials, alle Videos freigeschaltet
- Videokurs: Einmalkauf (derzeit nur Band 1)

Bläserklasse:
- Spezielle Playback-Lizenzen für Bläserklassen-Unterricht
- Infos: https://www.trumpetstar.com/blaeserklasse/
- Kontakt: valentin@trumpetstar.com | +43 664/45 30 873'
),

('PRO – Alle Videos (Inhalt & Umfang)', 'faq', 'de', 'FREE',
  ARRAY['pro', 'videos', 'abo', 'inhalt', 'umfang', 'videokurs'],
  'Trumpetstar PRO / Alle Videos enthält:
- 300+ Lern- und Mitspielvideos
- Kinderlieder, Tonleitern, Einspielübungen, Buzzingübungen
- Weihnachtslieder, Technikübungen, Ausdauertraining, Rhythmusübungen
- Geheimtipps und Tricks, Improvisationsübungen
- Schwierigkeitsgrad: Anfänger bis Bronze (1. Übertrittsprüfung)
- Keine musikalische Vorbildung nötig

Kauflink: https://www.trumpetstar.com/pro-alle-videos/'
),

('Trumpetstar App – Funktionen & Download', 'faq', 'de', 'FREE',
  ARRAY['app', 'download', 'playback', 'metronom', 'stimmgerät', 'kostenlos'],
  'Die Trumpetstar App ist kostenlos: https://www.trumpetstar.app

Kostenlos für alle:
- Alle Playbacks (Mitspielstücke)
- Metronom, Stimmgerät, Grifftabelle
- Beginnerlevel-Videos (per QR-Code aus Buch)
- Ranking / Level-Anzeige, leeres Notenblatt

Mit Abo (PRO):
- Alle 300+ Lernvideos freigeschaltet
- Kompletter Kurszugang

Login: https://www.trumpetstar.com/login-app/'
),

('Trompete als Erwachsener lernen', 'faq', 'de', 'FREE',
  ARRAY['erwachsene', 'anfänger', 'wiedereinsteiger', 'späteinsteiger'],
  'Ja, Trompete als Erwachsener lernen ist absolut möglich – es ist nie zu spät!

Trumpetstar ist auch für Erwachsene (Anfänger & Wiedereinsteiger) optimiert:
- Kein Vorwissen nötig (keine Noten, keine Vorkenntnisse)
- Videos erklären alles Schritt für Schritt
- Tempo selbst bestimmen, jederzeit und überall lernen
- Keine festen Unterrichtszeiten

Einstieg: Testzugang 1 Monat (€19) oder Band 1 Buch + kostenlose App.
Link: https://www.trumpetstar.com/trompete-lernen/'
),

('Wann bekomme ich nach dem Kauf Zugriff?', 'faq', 'de', 'FREE',
  ARRAY['zugriff', 'kauf', 'aktivierung', 'login', 'account'],
  'Nach dem Kauf über Digistore24 erhältst du sofort automatisch per E-Mail deine Zugangsdaten.

1. E-Mail von Digistore24 checken (auch Spam-Ordner!)
2. Auf https://www.trumpetstar.com/login-app/ einloggen
3. Oder Trumpetstar App auf https://www.trumpetstar.app öffnen

Bei Problemen: E-Mail an valentin@trumpetstar.com oder Telefon +43 664/45 30 873'
)

ON CONFLICT DO NOTHING;
