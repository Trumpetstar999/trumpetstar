# Etappe 7–8: Rhythmus-Baukasten, Beginnerkurs, Noten-Liste

Alle drei Module bekommen die helle Modulansicht (wie Metronom/Audioplayer) und alle Texte in DE, EN, ES, SL. Zahlpläne, Käufe und bestehende PRO-Sperren bleiben unverändert.

## 1. Rhythmus-Baukasten (/rhythmus, ohne Login)
- Umschalter „2 Takte / 4 Takte“.
- 4/4-Taktraster mit leeren Takten; Bausteinleiste: Ganze, Halbe, Viertel, 2 Achtel, Viertelpause, punktierte Viertel + Achtel.
- Antippen legt den Baustein in den nächsten freien Takt (Handy); am Tablet/Computer zusätzlich Ziehen und Ablegen. Ein Takt nimmt nur Bausteine bis 4 Schläge auf; volle Takte sind klar markiert.
- Baustein antippen → Ton wählen (C D E F G A H C', B-Trompete), Löschen und „Alles leeren“.
- Notenbild live (gleiche Notendarstellung wie Grifftabelle).
- Abspielen mit Metronom-Klick, Tempo-Regler 40–200, Stopp.
- Kein Speichern (laut Anleitung später).

## 2. Beginnerkurs (/beginner, mit Login)
- Neue Lektionsliste (Reihenfolge, Titel in 4 Sprachen, Video, Mitspiel-Video, Cover).
- Listenansicht als Kacheln; Detailansicht mit Video-Player und „Mitspielen“-Button.
- Leere Liste zeigt „Bald geht’s los! 🚀“.
- Admin-Bereich „Beginnerkurs“: Lektionen anlegen, sortieren, bearbeiten, löschen.
- Inhalte (Trumpetstar Peeps) folgen von dir – vorerst keine erfundenen Lektionen.

## 3. Noten-Liste (/noten, mit Login)
- Bestehende Noten-PDFs, hell dargestellt und nach Level gruppiert, mit Suche.
- Vorschau, Download/Drucken; gesperrte Bücher für kostenlose Nutzer weiterhin mit Schloss und Bestell-Link.
- Bestehende PDF-Technik (iOS-Cache, Berechtigungsprüfung) bleibt unverändert.

## Prüfung
- Tests: Takt nimmt maximal 4 Schläge auf, 2/4-Umschaltung, Tonzuweisung.
- Browser: Gast nutzt Rhythmus vollständig (Bausteine, Töne, Abspielen); Beginnerkurs und Noten eingeloggt; 375 px bis Desktop ohne seitliches Scrollen; alle 4 Sprachen.

## Technische Details
- `src/lib/rhythm.ts` (Bausteine mit Dauer in Achteln, `canPlace`, Taktfüllung, VexFlow-Keys) + Tests; `src/components/home/RhythmBuilder.tsx` mit VexFlow und WebAudio-Scheduler (vorhandene Audio-Muster, kein Tone.js nötig).
- Migration `beginner_lessons` (id, sort_order, title_i18n jsonb, video_url, playalong_url, cover_url, active); RLS: Lesen für angemeldete Nutzer, Schreiben nur Admin über `has_role`; Grants gemäß Schema-Regeln.
- `BeginnerCourse.tsx` (Liste + Detail, nutzt bestehenden Video-Player), Admin-Tab im Admin-Panel.
- `NotenModule` auf `surface="light"`; PdfsPage-Gruppierung nach Level und helle Tokens im Scope `.ts-light-module`.
- Neue Texte in `src/i18n/practice-tools.ts` bzw. home.*-Keys (de/en/es/sl).
- Roadmap und AGENTS.md aktualisieren.
