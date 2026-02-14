

# Session Builder -- Vorschaubilder und Rubrikfarben

## Aenderungen

### 1. Thumbnails in Bibliothek und Items laden

Die Datenbankabfrage wird erweitert, um Vorschaubilder mitzuladen:
- **Videos**: Feld `thumbnail_url` aus der `videos`-Tabelle
- **PDFs**: Feld `cover_image_url` aus der `pdf_documents`-Tabelle

Das `LibraryItem`-Interface erhaelt ein neues Feld `thumbnail?: string | null`.

### 2. Vorschaubilder anzeigen

**Bibliothek (links)**: Die Icon-Box (aktuell 32x32px mit Video/PDF-Icon) wird durch ein kleines Thumbnail (z.B. 40x28px, abgerundete Ecken) ersetzt. Falls kein Thumbnail vorhanden ist, wird das bisherige Icon als Fallback gezeigt.

**Items (rechts)**: Die Item-Cards erhalten ebenfalls ein Thumbnail-Bild anstelle des einfachen Icons. Groesse etwas groesser (z.B. 48x32px) mit abgerundeten Ecken. Fallback bleibt das Typ-Icon.

### 3. Rubrikfarben-System

Jeder Rubrik wird eine Akzentfarbe zugewiesen, die sowohl die Rubrik in der Mitte als auch die rechte Spalte (Items) farblich verbindet:

| Rubrik | Farbe |
|---|---|
| Buzzing | Orange |
| Einspielen | Blau |
| Zungenübungen | Grün |
| Höhe | Violett |
| Technik | Cyan/Teal |
| Lieder | Pink/Rose |
| Custom | Slate/Grau |

**Umsetzung:**
- Die ausgewaehlte Rubrik in der Mitte erhaelt einen farbigen linken Rand (left border) oder dezenten Hintergrund in der Rubrikfarbe
- Die rechte Spalte (Items-Header) zeigt die Rubrikfarbe als Akzent (farbiger Top-Border oder Hintergrund-Toenung)
- Die Item-Cards koennen einen subtilen farbigen Seitenstreifen oder Icon-Hintergrund in der Rubrikfarbe erhalten

### 4. Betroffene Datei

Nur `src/pages/SessionBuilderPage.tsx` wird geaendert:
- Erweiterung der Datenbankabfrage (thumbnail_url / cover_image_url)
- Erweiterung des LibraryItem-Interfaces um `thumbnail`
- Farbzuordnungs-Map basierend auf `section_key`
- Thumbnail-Rendering in Library-Items und Item-Cards
- Farbliche Akzente in Sektions-Liste und rechter Spalte

