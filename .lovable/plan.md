
# Plan: Video-Kategorie für Mobile + Portrait-Lock

## 1. Neue Komponente `MobileVideoPlayer.tsx`
Analog zum `MobileAudioPlayer` aufgebaut, in `src/components/levels/`:

**Top-Bar** (gleiches Layout):
- Level-Dropdown (lädt aus `levels`-Tabelle, sprachgefiltert wie `LevelsPage`)
- Suche-Button (durchsucht Videos nach Titel)
- (kein Settings-Button — wird nicht gebraucht)

**Track/Video-Liste**:
- Videos des gewählten Levels (sortiert nach `sort_order`)
- Klick auf Video → öffnet bestehenden `VideoPlayer` (Vollbild, Vimeo)
- 5 Vorschau-Einträge + "X weitere anzeigen"
- Im Listen-Item: Thumbnail (klein), Titel, Dauer
- Daten-Quelle: identisch zu `LevelsPage.fetchLevels` (active levels + active videos, sprachgefiltert)

**Aktive Sprache** wird via `useLanguage` ausgelesen (gleiche Logik: en→en, es→es, de/sl→de).

**Stern-Vergabe**: Der bestehende `VideoPlayer` regelt das bereits korrekt (1 Stern bei 40%, mehrfach pro Tag möglich).

## 2. Integration in `MobileHomePage.tsx`
Neue collapsible Sektion **direkt unter** der Audio-Sektion (vor Übe-Tools), exakt gleicher Aufbau:
- Header-Button mit `Play`-Icon + "Videos" / "Lerne mit professionellen Videos" + Chevron
- State: `showVideoSection` (default `true`)
- Card mit gleichem Glass-Style (`rgba(8,18,45,0.88)`, `backdrop-blur(24px)`, `minHeight: 440`)
- Inhalt: `<MobileVideoPlayer />`

Übersetzungen für DE/EN/ES im `TEXTS`-Objekt ergänzen (`videoTitle`, `videoSubtitle`).

## 3. Portrait-Lock für Mobile (außer Video-Vollbild)

**`index.html`** — Manifest-Hint via Meta-Tag:
```html
<meta name="screen-orientation" content="portrait">
```

**`MobileLayout.tsx`** — Versucht beim Mount `screen.orientation.lock('portrait')` (Best-Effort, schlägt in Safari still fehl, was OK ist).

**`VideoPlayer.tsx`** (Vollbild-Modal) — Beim Öffnen `screen.orientation.unlock()`, beim Schließen wieder `lock('portrait')` versuchen.

**CSS-Fallback** in `index.css` für reine Mobile-Routen (`@media (max-width: 767px) and (orientation: landscape)`):
- Auf `/mobile/*` Routen außer aktivem `VideoPlayer`: visueller Hinweis "Bitte drehe dein Gerät ins Hochformat" (overlay über `MobileLayout`).

## Technische Details
- Keine DB-Migration nötig — nutzt vorhandene `videos`/`levels`-Tabellen.
- Kein neuer Stern-Code — bestehender `VideoPlayer` übernimmt.
- Screen Orientation API: nur in Chrome/Android zuverlässig; iOS Safari wird per CSS-Overlay abgefangen.
- Datei-Änderungen: 1 neue Datei (`MobileVideoPlayer.tsx`), 3 Edits (`MobileHomePage.tsx`, `MobileLayout.tsx`, `VideoPlayer.tsx`), 1 CSS-Snippet (`index.css`), 1 Meta-Tag (`index.html`).
