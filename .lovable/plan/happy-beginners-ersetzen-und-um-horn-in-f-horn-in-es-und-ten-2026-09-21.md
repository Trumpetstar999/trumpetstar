# Happy Beginners ersetzen und um Horn in F, Horn in Es und Tenorhorn erweitern

Die neue Version des Übe-Spiels (aus dem hochgeladenen Paket) ersetzt die bisherige
vollständig – inklusive Buch-Bereich mit allen 83 Liedern und Buchseiten. Danach wird sie
für vier Instrumente nutzbar gemacht: Trompete in B, Horn in F, Horn in Es und Tenorhorn.

## 1. Neue Version einbauen

- Der komplette Ordner des Pakets ersetzt den bisherigen Spielordner (Oberfläche, Noten,
  Griffbild, Erkennung, Buch, Sprachen, Bilder).
- Die bisher fein abgestimmten Trompeten-Aufnahmen (Grundklang, „Brillant", „Gedämpft")
  bleiben erhalten und werden weiter verwendet; der kleine Klang aus dem Paket dient nur
  als Rückfall, wenn eine Aufnahme fehlt.
- Die Einbindung in der App bleibt wie heute: Aufruf über die Spielauswahl, eigene Seite mit
  Mikrofonfreigabe. Der Offline-Speicher des Pakets wird abgeschaltet, damit Änderungen in
  der App sofort sichtbar sind.
- Startbildschirm mit Vogel (nötig für Ton und Mikrofon auf iPad) und Querformat-Hinweis
  bleiben unverändert.

## 2. Instrumentwahl in den Eltern-Einstellungen

- In den Einstellungen ersetzt eine Auswahl mit vier Einträgen die heutige B/F-Umschaltung:
  Trompete in B, Horn in F, Horn in Es, Tenorhorn.
- Die Wahl wird auf dem Gerät gespeichert und gilt für Erkennung, Vorspielen, Griffbild und
  die Hinweistexte.
- Das Notenbild bleibt in allen vier Fällen gleich (Violinschlüssel, gleiche Töne c1–d2).
  Das Tenorhorn wird wie die Trompete notiert und gegriffen, klingt nur eine Oktave tiefer.

## 3. Anpassung je Instrument

| Instrument | klingt tiefer als notiert | Griffe | Griffbild |
|---|---|---|---|
| Trompete in B | 2 Halbtöne | Trompetengriffe | Trompete, 3 Druckventile |
| Horn in F | 7 Halbtöne | eigene Horngriffe | Horn, 3 Drehventile |
| Horn in Es | 9 Halbtöne | eigene Horngriffe | Horn, 3 Drehventile |
| Tenorhorn | 14 Halbtöne | wie Trompete | Tenorhorn, 3 Druckventile |

- Für jedes Instrument werden die klingenden Frequenzen der neun Töne und die passenden
  Griffe hinterlegt; dabei werden auch die Naturtonreihen berücksichtigt, damit die
  Erkennung Überblasen nicht als falschen Ton wertet.
- Der Hörbereich wird nach unten erweitert (tiefster Ton des Tenorhorns liegt bei etwa
  117 Hz), ohne dass Zimmerrauschen die Einsatzerkennung auslöst.
- Vorspielen: Trompete mit den vorhandenen Aufnahmen, Horn und Tenorhorn mit passenden
  weichen Blechklängen in der jeweils richtigen Tonhöhe.
- Die Erklärtexte in den Einstellungen (deutsch, englisch, spanisch) werden je Instrument
  richtiggestellt.

## 4. Prüfung

- Alle vier Instrumente durchgehen: Griffbild, vorgespielter Ton, erkannter Ton, Bewertung.
- Buch-Bereich: Seiten laden, Lieder starten, Tempo und Stopp funktionieren.
- iPad-Querformat und Layout ohne Überlappungen.

## Technische Hinweise

- Paket bleibt eigenständiges HTML/CSS/JS unter `public/trompete/`, bewusst ES5, kein
  Build-Schritt, keine Umformatierung.
- `data/toene.json` wird von einer Trompeten-Datei zu einer Datei mit vier
  Instrumentblöcken erweitert (Transposition, Frequenzen, Griffe, Naturtöne);
  `app.js`/`tracker.js`/`motor.js`/`griff.js` lesen den aktiven Block.
- `griff.js` erhält neben Trompete und Drehventil-Horn eine Tenorhorn-Zeichnung.
- Service Worker wird nicht registriert und `sw.js` entfällt.
- Rechtlicher Hinweis: das Paket enthält drei urheberrechtlich geschützte Lieder
  (Pippi Langstrumpf, Schnappi, Wickie). Sie werden wie gewünscht übernommen; die Rechte
  für die App-Nutzung sind vor einer Veröffentlichung zu klären.
