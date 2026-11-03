# Redesign „iPhone-Home“ – Etappe 1–3

Zahlpläne, Preise, Digistore24-Käufe, Gutscheine und Login-Mails bleiben unverändert.

## Was du danach siehst
- **Startseite „/“** = neuer heller Homescreen: Logo, Glocke, Flagge, Profil, Begrüßung, 12 App-Icons (Reihe 1–8, Shop · Noten · Tuner · Grifftabelle). Das Shop-Karussell kommt in Etappe 5.
- **Kein Login beim Start.** Schloss-Badges für Gäste bei Beginnerkurs, Videos, Games, Playlists, Feedback, Noten. Tippen öffnet das Login-Fenster („Einloggen“, „Kostenlos registrieren“, „Später“); nach dem Login geht es direkt ins gewünschte Modul.
- **Ganze App hell:** Himmelblau-Hintergrund, Signature-Blau für Seitenköpfe, Gold für Buttons und Sterne, Rot für Badges. Das ersetzt das bisherige dunkle Design (die gespeicherte Design-Regel wird angepasst). Der Admin-Bereich bleibt unverändert.
- **Module öffnen wie iPhone-Apps** (Zoom aus dem Icon, „‹ Home“ zurück); bei „Bewegung reduzieren“ nur Überblenden. Die untere Tab-Leiste entfällt.
- **Bestehende Module neu eingehängt:** Videos/Levels → /videos, Playlists → /playlists, Chat → /feedback („Feedback“), Metronom → /metronom, Audio → /audio, Tuner → /tuner, Games → /games, Noten (bestehende PDFs) → /noten, Aufnahmen im Profil-Fenster. Alte Adressen (/app, /levels, /pdfs, /chats …) leiten weiter. PRO-Sperren in den Modulen bleiben.
- **Platzhalter** für Beginnerkurs, Rhythmus und Grifftabelle („Bald geht’s los! 🚀“) – sie werden in späteren Etappen gebaut.
- **Die Werbeseite** zieht nach **/trompete-lernen-app**; Links, Sitemap und Google-Angaben werden angepasst.

## Später (eigene Etappen)
4. Sprach-Fenster, Glocke mit Neuigkeiten, Profil-Fenster mit Sprache speichern
5. Shop-Karussell + /shop mit allen Digistore24-Produkten (vorhandener Schlüssel)
6. Grifftabelle, 7. Rhythmus-Baukasten, 8. Beginnerkurs-Lektionen & Noten-Tabelle

## Technische Details
- Icons (SVG) und Logo aus dem ZIP nach `public/icons/`, 180-px-PNGs für apple-touch-icon.
- `src/config/apps.ts` als zentrale Liste (id, route, icon, labelKey, requiresAuth); Homescreen, Badges und `<RequireAuth>` lesen daraus. RequireAuth zeigt für Gäste Homescreen + Login-Sheet, merkt `next` über die vorhandene Redirect-Logik.
- Design-Tokens in `index.css`/`tailwind.config.ts` auf helles Thema (HSL), neue Tokens wall/glass/gold/red; `ModuleShell` mit Large-Title-Kopf; Framer-Motion-Zoom.
- Labels über vorhandenes Sprachsystem (de/en/es/sl), Texte aus `vorschau.html`.
- MobileRouteGuard und Passwort-Reset-Ausnahmen bleiben erhalten; Test für Zugriffsregeln (welche Module frei/gesperrt) wird ergänzt.
