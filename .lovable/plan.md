

# Übesession starten -- Implementierungsplan

## Überblick

Ein neues Feature innerhalb der "Üben"-Rubrik, das es Nutzern ermöglicht, Übesessions wie Playlists zusammenzustellen (mit Videos, PDFs und Pausen), per Drag & Drop zu sortieren, abzuspeichern, zu starten und mit anderen zu teilen. Optimiert für iPad Landscape und Touch-first.

---

## Phase 1: Datenbank-Migration

Vier neue Tabellen werden angelegt:

**practice_sessions** -- Haupt-Session-Tabelle mit Owner, Name, Auto-Pause-Einstellungen, Share-Slug.

**practice_session_sections** -- Rubriken pro Session (Buzzing, Einspielen, etc.) mit frei sortierbarer Reihenfolge.

**practice_session_items** -- Items pro Section (vimeo_video, pdf, pause) mit Reihenfolge, Typ-spezifischen Feldern (duration_mode, duration_seconds).

**practice_session_shares** -- Sharing-Einträge (Link-basiert oder nutzerbezogen).

RLS-Policies:
- Nutzer sehen/bearbeiten/loeschen nur eigene Sessions
- Oeffentliche Sessions (is_public=true) sind fuer alle lesbar
- Share-Eintraege sind fuer Sender und Empfaenger sichtbar
- Realtime wird fuer keine dieser Tabellen benoetigt

---

## Phase 2: PracticePage erweitern

Die bestehende `PracticePage.tsx` erhaelt einen neuen Tile/Block oberhalb der Tabs:

- Titel: "Übesession starten"
- Button "Neue Übesession" -- navigiert zum Session Builder
- Button "Meine Übesessions" -- navigiert zur Session-Liste

---

## Phase 3: Routen hinzufuegen

Neue Routen in `App.tsx`:

```text
/practice/sessions          -> SessionListPage
/practice/sessions/new      -> SessionBuilderPage (neu)
/practice/sessions/:id/edit -> SessionBuilderPage (bearbeiten)
/practice/sessions/:id/play -> SessionPlayerPage
/practice/sessions/share/:slug -> SharedSessionPage (nur Ansicht + Kopie)
```

---

## Phase 4: Session Builder (Editor)

**Datei:** `src/pages/SessionBuilderPage.tsx` + Unterkomponenten in `src/components/sessions/`

### Layout (3-Spalten, iPad Landscape optimiert)

```text
+------------------+---------------------+---------------------+
|   BIBLIOTHEK     |   RUBRIKEN          |   ITEMS (pro Rubrik)|
|                  |                     |                     |
| Suchfeld         | [Buzzing]  <drag>   | Video-Card <drag>   |
| Filter: V/PDF    | [Einspielen] <drag> | PDF-Card   <drag>   |
| Ergebnisse       | [Zugenübungen]      | Pause-Card <drag>   |
|  (draggable)     | [Höhe]              |                     |
|                  | [Technik]           | + Pause einfügen    |
|                  | [Lieder]            |                     |
|                  | + Neue Rubrik       |                     |
+------------------+---------------------+---------------------+
| Session Name: [___________]  | Auto-Pause: [X] 60s  | [Speichern] [Speichern & Starten] |
+-----------------------------------------------------------------------------------------------+
```

### Bibliothek (links)
- Sucht in `videos` (Titel, aktiv) und `pdf_documents` (Titel, aktiv)
- Filter: Videos / PDFs / Level
- Ergebnis-Cards sind per `@dnd-kit` draggable

### Rubriken (mitte)
- Default-Rubriken: Buzzing, Einspielen, Zungenübungen, Höhe, Technik, Lieder
- Per `@dnd-kit/sortable` umsortierbar
- Klick waehlt Rubrik aus und zeigt Items rechts
- Umbenennen, neue Rubrik hinzufuegen, loeschen (mit Bestaetigung wenn nicht leer)

### Items (rechts)
- Items der ausgewaehlten Rubrik, per Drag & Drop sortierbar
- Drop-Zone fuer Bibliothek-Items
- Item-Cards zeigen Typ-Icon, Titel, ggf. Übezeit-Feld (PDF/Pause)
- "X" zum Entfernen, "+ Pause einfügen" Button

### Session-Einstellungen (unten)
- Session Name (Pflichtfeld)
- Auto-Pause Toggle + Dauer-Stepper (0-180s)
- Speichern / Speichern & Starten

**Drag & Drop:** `@dnd-kit` (bereits installiert: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) -- touch-stabil auf iPad.

---

## Phase 5: Meine Übesessions (Liste)

**Datei:** `src/pages/SessionListPage.tsx`

- Cards mit: Name, Anzahl Items, geschaetzte Dauer, zuletzt verwendet
- Aktionen: Starten, Bearbeiten, Duplizieren, Loeschen, Teilen
- Teilen: Share-Slug generieren oder an Kontakt senden (Chat-Link)

---

## Phase 6: Session Player

**Datei:** `src/pages/SessionPlayerPage.tsx` + Unterkomponenten

### Ablauf-Logik
- Playback-Reihenfolge = Rubriken nach order_index, darin Items nach order_index
- Zwischen Items: Auto-Pause (falls aktiviert)
- Manuelle Pause-Items werden als Countdown abgespielt

### Player UI (iPad Landscape)

```text
+-------------------------------------------------------+
| TOP BAR: Session Name | Item 5/22 | Rubrik | Übersicht|
+-------------------------------------------------------+
|                                                       |
|   MAIN AREA:                                          |
|   - Video: Eingebetteter Vimeo Player                 |
|   - PDF: PDF-Viewer + Timer                           |
|   - Pause: Countdown + "Überspringen" + "+30s"        |
|                                                       |
+-------------------------------------------------------+
| BOTTOM: [Prev] [Replay] [Next] [Überspringen] [Ende] |
+-------------------------------------------------------+
```

### Video-Items
- Vimeo-Player embedded (bestehende Player-Logik wiederverwendet)
- Spielt bis Ende, dann automatisch weiter

### PDF-Items
- PDF-Viewer zeigt Dokument
- Timer laeuft fuer `duration_seconds`
- Buttons: Timer starten/pausieren, Reset, Weiter

### Pause-Items
- Countdown-Screen mit "Erhol dich..."
- Buttons: Ueberspringen, +30s

### Navigation
- Prev/Next/Replay jederzeit moeglich
- Uebersicht-Panel: kompletter Ablauf, Klick springt zu Item
- Session beenden mit Bestaetigung

---

## Phase 7: Shared Sessions

**Datei:** `src/pages/SharedSessionPage.tsx`

- Route `/practice/sessions/share/:slug`
- Zeigt Session im Read-Only-Modus
- Button "Kopie erstellen" klont Session in eigene Sessions
- Kein Zugriff auf Original-Daten des Owners

---

## Phase 8: Lokalisierung

Neue Uebersetzungs-Keys in `de.json`, `en.json`, `es.json` fuer alle UI-Texte (Session Builder, Player, Liste, Sharing).

---

## Technische Details

### Neue Dateien (ca. 15-20)

```text
src/pages/SessionBuilderPage.tsx
src/pages/SessionListPage.tsx
src/pages/SessionPlayerPage.tsx
src/pages/SharedSessionPage.tsx
src/components/sessions/SessionLibrary.tsx
src/components/sessions/SessionSections.tsx
src/components/sessions/SessionItems.tsx
src/components/sessions/SessionSettingsBar.tsx
src/components/sessions/SessionCard.tsx
src/components/sessions/SessionPlayerTopBar.tsx
src/components/sessions/SessionPlayerMain.tsx
src/components/sessions/SessionPlayerControls.tsx
src/components/sessions/SessionOverviewPanel.tsx
src/components/sessions/PauseCountdown.tsx
src/components/sessions/PdfTimerView.tsx
src/components/sessions/ShareSessionDialog.tsx
src/hooks/useSessionPlayer.tsx
src/hooks/usePracticeSessions.tsx
```

### Geaenderte Dateien

```text
src/App.tsx                 -- Neue Routen
src/pages/PracticePage.tsx  -- Neuer Tile "Übesession starten"
src/i18n/locales/de.json    -- Uebersetzungen
src/i18n/locales/en.json    -- Uebersetzungen
src/i18n/locales/es.json    -- Uebersetzungen
```

### Datenbank-Migration

```sql
-- practice_sessions
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  break_enabled boolean NOT NULL DEFAULT true,
  break_seconds_default integer NOT NULL DEFAULT 60,
  is_public boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

-- practice_session_sections
CREATE TABLE public.practice_session_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  section_key text NOT NULL DEFAULT 'custom',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- practice_session_items
CREATE TABLE public.practice_session_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.practice_session_sections(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  item_type text NOT NULL, -- 'vimeo_video', 'pdf', 'pause'
  ref_id text,
  title_cache text,
  duration_mode text NOT NULL DEFAULT 'until_end', -- 'until_end', 'timer'
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- practice_session_shares
CREATE TABLE public.practice_session_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL,
  shared_with_user_id uuid,
  share_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS + Policies fuer alle vier Tabellen
-- Trigger fuer updated_at auf practice_sessions
```

### Implementierungsreihenfolge

1. Datenbank-Migration (Tabellen + RLS)
2. Hook `usePracticeSessions` (CRUD-Operationen)
3. PracticePage -- neuer Tile
4. SessionListPage -- Uebersicht
5. SessionBuilderPage -- Editor mit Drag & Drop
6. SessionPlayerPage -- Player mit Video/PDF/Pause
7. SharedSessionPage -- Teilen + Klonen
8. Routen in App.tsx
9. Lokalisierung

