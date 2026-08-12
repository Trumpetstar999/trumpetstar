# Tone Force in die Games-Rubrik integrieren

Das Spiel "Tone Force" (Weltraum-Shooter, gesteuert mit echten Trompetentönen) wird vollständig in diese App übernommen. Die Games-Rubrik zeigt danach zuerst eine Spielauswahl mit zwei Karten: **NoteRunner** und **Tone Force**.

## 1. Spielauswahl in der Games-Rubrik

- Neue Auswahl-Ansicht (`GameSelect`) als Startbild des Games-Tabs: zwei große Karten im bestehenden Glass-/Gold-Stil, je mit Titel, Kurzbeschreibung, Vorschaubild und Start-Button.
- NoteRunner behält seine bestehende Landing-Ansicht (Einstellungen, Highscores, Start).
- Tone Force erhält ein eigenes Menü (Spielen, Übungsmodus, Akkorde, Kalibrierung, Einstellungen, Highscores) — analog zum Original.
- Zurück-Navigation von jedem Spiel zurück zur Auswahl.

## 2. Übernommene Tone-Force-Bereiche (vollständig)

- **Spielen**: Canvas-Spiel mit Levels, Gegnern, Boss, Powerups, Partikeleffekten, Stabilitätsanzeige, Leben, Score, Level-Complete-/Game-Over-/Won-Overlays, Demo-Steuerung per Tastatur.
- **Übungsmodus**: Töne treffen ohne Gegner.
- **Akkord-Auswahl**: Auswahl der Steuer-Akkorde/Töne.
- **Kalibrierung**: Mikrofon-/Tonhöhenkalibrierung.
- **Einstellungen**: Schwierigkeit, Instrument (C/Bb/Eb/F), Sound/Musik.
- **Highscores**: Eigene und globale Bestenliste.
- Alle Texte laufen über das bestehende Sprachsystem (DE/EN/ES/SL) — die deutschen, englischen und spanischen Originaltexte werden übernommen, Slowenisch wird ergänzt.

## 3. Highscores (eigene Tabelle)

Neue Tabelle `toneforce_highscores`:

- Felder: `user_id`, `player_name`, `score`, `level_reached`, `difficulty`, `instrument`
- Zugriffsregeln: Eingeloggte Nutzer dürfen eigene Einträge anlegen; die globale Bestenliste wird über eine geschützte Datenbankfunktion (analog zu NoteRunner) mit Anzeigename/Avatar gelesen.
- Namenseingabe nach Spielende mit Merken des letzten Namens (mehrere Schüler pro Gerät), genau wie bei NoteRunner.

## 4. Tageslimit

Tone-Force-Starts laufen über denselben `useDailyUsage`-Mechanismus wie NoteRunner (3 Starts/Tag für Free-User, gemeinsames Limit) inkl. `DailyLimitOverlay`.

## 5. Assets & Design

- Alle Spiel-Grafiken (Raumschiff, Gegner, Boss, Laser, Powerups, Hintergründe, Menü-Icons) werden aus dem Tone-Force-Projekt in `src/assets/toneforce/` kopiert.
- Die beiden Logo-Assets liegen dort nur als projekt-gebundene Zeiger vor: statt sie zu übernehmen, wird der Tone-Force-Titel typografisch im Trumpetstar-Stil (Gold-Gradient) gesetzt; das Trumpetstar-Logo ist bereits vorhanden.
- Sponsor-Banner und Sprachumschalter aus dem Original entfallen (in der App bereits vorhanden bzw. nicht nötig).

## Technische Details

- Quellprojekt nutzt TanStack Start + React 19; Zielprojekt React 18 + React Router. Portierung:
  - `src/routes/*.tsx` → Komponenten unter `src/components/game/toneforce/` (Spiel, Übung, Akkorde, Kalibrierung, Einstellungen, Highscores, Menü), plus Route `/app/game/toneforce/play` für den Vollbild-Spielmodus (parallel zu `/app/game/play`).
  - Engine-Dateien (`game/constants|types|levels|spawner|collision|renderer|effects|sprites`) werden 1:1 nach `src/game/toneforce/` übernommen (framework-unabhängig).
  - Hooks `useAudioInput`, `usePitchDetection`, `useChordSettings`, `useLocalProgress`, `useAssetPreload` nach `src/hooks/toneforce/`; Pitch-Erkennung mit den iPad/iOS-Anpassungen dieses Projekts abgeglichen (AnalyserNode + Unlock-Geste), damit Töne auf iPad erkannt werden.
  - `createServerFn`-Highscore-Funktionen (Service-Role) werden durch Client-Aufrufe über den bestehenden Supabase-Client + RLS bzw. eine `SECURITY DEFINER`-Funktion `get_toneforce_top_highscores(p_limit)` ersetzt.
  - `useDocumentMeta`/Route-Meta und SSR-spezifischer Code entfallen; `localStorage`-Keys werden auf `tf.*` umbenannt, um Kollisionen zu vermeiden.
  - Kein Upgrade auf React 19, keine neuen Abhängigkeiten nötig.
- Migration: neue Tabelle mit GRANTs, RLS-Policies und Bestenlisten-Funktion.
- Verifikation: E2E-Durchlauf im Browser (Auswahl → Tone Force Menü → Kalibrierung → Spiel starten mit Tastatur-Demo → Game Over → Namenseingabe → Highscore-Liste) auf Desktop-, iPad- und Handy-Viewport.
