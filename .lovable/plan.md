# Happy Beginners: "← Spielauswahl" überlappt die Spielleiste

## Problem

Der Zurück-Link "← Spielauswahl" liegt fest in der linken oberen Ecke über dem Spiel. Auf dem Übungs-Bildschirm beginnt dort direkt die Spielleiste mit Haus-Knopf und Start-Knopf – Text und Knöpfe überschneiden sich (siehe Screenshot).

Auf dem Level-Auswahl-Bildschirm ist das kein Problem: dort ist oben bewusst Platz freigelassen.

## Lösung

Der Zurück-Link wird nur dort gezeigt, wo er nicht stört:

- **Level-Auswahl / Startbildschirm:** "← Spielauswahl" bleibt wie jetzt oben links (dort ist Freiraum eingeplant).
- **Übungs-Bildschirm:** Link wird ausgeblendet. Der Weg zurück bleibt vollständig erhalten – das Haus-Symbol führt zur Level-Auswahl, dort ist der Link wieder sichtbar.

Zusätzlich wird der Link etwas kompakter und mit klarer Trefferfläche (kleine abgerundete Fläche, dezente Farbe) gestaltet, damit er auf dem hellen Hintergrund gut lesbar ist, aber Kinder nicht davon abgelenkt werden.

Alternative, falls gewünscht: Der Link bleibt auf allen Bildschirmen sichtbar und wandert im Übungsmodus als kleines Pfeil-Symbol in die rechte obere Ecke neben das Eltern-Zahnrad. Sag Bescheid, wenn diese Variante lieber ist.

## Technische Umsetzung

Datei: `src/pages/HappyBeginnersPlayPage.tsx`

- Der Overlay-Button erhält eine ID (z. B. `hb-zurueck`) und Klassen statt reiner Inline-Styles.
- Sichtbarkeitssteuerung über eine kleine, komponenteneigene `<style>`-Regel bzw. Tailwind-freie Regel im injizierten Stil:
  `#app:has(#uebung:not([hidden])) #hb-zurueck { display: none; }`
  Damit bleibt die bestehende Spiel-Logik (`js/ui/*.js`) unangetastet – es wird nichts an `public/trompete/` verändert.
- Kein Eingriff in Grid-/Padding-Werte des Spiels, damit sich das Layout auf iPad/Desktop nicht verschiebt.

## Prüfung

- Übungs-Bildschirm: keine Überschneidung mehr mit Haus- und Start-Knopf.
- Level-Auswahl: Link sichtbar und anklickbar, führt zurück in die Spielauswahl.
- Kontrolle in Desktop- und iPad-Breite (Querformat), da das Spiel vh-basiert skaliert.
