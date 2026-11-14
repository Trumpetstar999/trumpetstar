# Testbericht umsetzen: Paket A + B

Grundlage: Persona-Testbericht vom 11.11.2026. Preise, Laufzeiten und Zahlpläne bleiben unverändert.

## Paket A – sichtbare Bedienprobleme
1. **PDF-Ansicht (F01):** Viewer liegt vollständig über der App-Kopfzeile; Titel, Suche, Drucken und Schließen sind bei 360–1366 px sichtbar und antippbar. Escape und Fokus-Rückkehr bleiben.
2. **Kontraste (F02):** NoteRunner-Einstellungen und Übesession-Seiten auf lesbare Farben (mind. 4,5:1) bringen; aktive Elemente nicht mehr wie deaktiviert.
3. **Soundeffekte-Hinweis (F13):** Standard tatsächlich „aus“; Beschriftung zeigt den echten Zustand, gespeicherte Wahl wird respektiert.
4. **Technische Titel (F14):** Sichtbare Titel ohne Dateiendungen, Unterstriche und Nummernkürzel (z. B. „Erste Töne c¹“); Tippfehler „Werbnung“ korrigiert. Nur Anzeige – Dateien/IDs unverändert.
5. **Begriffe/Ladezustand (F20):** „Premium“-Hinweis bei PRO entfernen, einheitlich FREE/BASIC/PRO und „Sterne“; beim Laden Platzhalter statt kurz „0 Sterne“.
6. **Übe-Tagebuch (F10):** Vorgefertigte Beispieleinträge (13.–15. Jänner) entfernen; leerer Zustand „Noch keine Einträge“. Nur echte eigene Einträge zählen.

## Paket B – Zugangsregeln und Angebot
7. **Einheitliche Tariftexte (F06):** Eine gemeinsame Quelle für Startseite, Registrierung, Preisseite, Shop-Karten: „Kostenlos: 3 Videos + 3 Spiele pro Tag“, BASIC ohne Tageslimit, PRO zusätzlich Lehrerfeedback. Der 1-€-Preis wird überall als „1. Monat, danach …“ mit Folgekosten erklärt.
8. **Spielzählung prüfen (F07):** Alle Spielstartwege (NoteRunner, Tone Force, Happy Beginners, Snowtone) zählen genau beim echten Spielstart, nicht beim Öffnen des Menüs; Videos und Spiele getrennt; BASIC/PRO ohne Sperre; Tageswechsel Wien inkl. Sommer-/Winterzeit. Regressionstests dazu.
9. **Feedback-Begriffe (F11):** „Spielen mit Feedback“ → „Töne & Melodien üben – die App hört zu“; Lehrerbereich heißt „Lehrerfeedback (PRO)“.
10. **Anmeldung & Knöpfe (F15/F16):** Kurzer Hinweis für Eltern bei der Registrierung; „Kurs entdecken“ ehrlich benennen („Kostenlos registrieren“) oder auf eine echte Vorschau führen.
11. **Lehrer- und Geräte-Hilfen (F17/F18):** Lehrerchat mit kurzer Erklärung (wer antwortet, was senden); Mikrofon-/Kamera-Fehler mit unterscheidbaren Hilfetexten (verweigert, kein Gerät, belegt).

Alle neuen Texte in DE/EN/ES/SL.

## Nicht in diesem Durchgang
Paket C (Startkarte „Deine erste Übung“, „Weiterüben“-Seite, Spiel-Voreinstellungen, gemeinsame Liedseite, vereinfachter Session-Editor) sowie die Übernahme der Übesession-Seiten in den neuen App-Rahmen (F05).

## Technische Details
- F01: `PdfViewer` per Portal mit z-index über `ModuleShell`-Header.
- F02: semantische Tokens statt muted-on-dark in NoteRunner/Session-Seiten; Kontrast mit Playwright messen.
- F10: Beispieldaten in `src/data/mockData.ts` und deren Verwendung entfernen.
- F14: Anzeige-Formatter für Video-/Audiotitel (Suche bleibt auf Rohtitel).
- F06: Gratisumfang als Konstante neben `PLAN_INFO`, in allen Oberflächen verwendet.
- F07: Aufrufe von `increment_daily_usage` je Spielroute prüfen; Vitest-Tests für 3/4. Start, getrennte Kontingente, Wiener Mitternacht/DST.
- Abschluss: Browsertests mit FREE/BASIC/PRO-Testkonten.
