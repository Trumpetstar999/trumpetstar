

## Plan: Playlist-System fur trumpetstar.app

### Ubersicht

Ein personliches Playlist-System, das Usern erlaubt, Ubeplaylists zu erstellen, Videos per Drag & Drop zu organisieren und diese direkt auf den Level-Seiten als Ubeplan zu nutzen. Tablet-optimiert, Duolingo/Spotify-inspiriert.

### Datenbank (2 neue Tabellen + RLS)

```sql
-- Playlists
CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own playlists" ON public.playlists
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Playlist Items
CREATE TABLE public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own playlist items" ON public.playlist_items
  FOR ALL TO authenticated
  USING (playlist_id IN (SELECT id FROM public.playlists WHERE user_id = auth.uid()))
  WITH CHECK (playlist_id IN (SELECT id FROM public.playlists WHERE user_id = auth.uid()));

-- Updated-at trigger
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/hooks/usePlaylists.tsx` | CRUD-Hook: Playlists & Items laden, erstellen, loschen, Reihenfolge speichern |
| `src/components/playlists/CreatePlaylistDialog.tsx` | Modal: Name, Beschreibung, Level-Dropdown |
| `src/components/playlists/PlaylistEditor.tsx` | Drag & Drop Videoliste, Video-Suche/Hinzufugen |
| `src/components/playlists/PlaylistVideoSearch.tsx` | Such-Overlay mit Filter (Level, Titel) |
| `src/components/playlists/PlaylistCard.tsx` | Karte mit Name, Videoanzahl, Fortschritt, Start-Button |
| `src/components/playlists/PlaylistPlayerOverlay.tsx` | Autoplay-Player: spielt Videos nacheinander ab |
| `src/components/playlists/LevelPlaylistSection.tsx` | "Deine Playlists"-Sektion auf Level-Seiten |

### Integration in LevelsPage

- Neue Sektion "Deine Playlists" oberhalb der Video-Sektionen wenn ein Level ausgewahlt ist
- Zeigt PlaylistCards fur Playlists mit passendem `level_id`
- "Starten"-Button offnet den PlaylistPlayerOverlay

### Plan-Limits (Free vs Premium)

- Im `usePlaylists`-Hook wird `useMembership` gepruft:
  - FREE: max 1 Playlist, max 5 Videos pro Playlist
  - Alles ab PLAN_A: unbegrenzt
- Bei Limit-Uberschreitung: Upgrade-Hinweis anzeigen

### Fortschritt

- Fortschritt wird aus `video_completions` berechnet (wie viele Videos der Playlist bereits abgeschlossen)
- Kein neuer DB-State notig

### Drag & Drop

- Verwendung von `@dnd-kit/core` + `@dnd-kit/sortable` (bereits bewahrt in React-Okosystem)
- Smooth Animationen, Touch-optimiert fur iPad

### Player-Logik

- Ahnlich wie bestehender `SessionPlayerPage` aber schlanker
- Autoplay nachstes Video nach Abschluss
- Fortschrittsanzeige (X/Y Videos)
- Zuruck/Weiter/Beenden-Buttons

### Dateien die geandert werden

| Datei | Anderung |
|-------|----------|
| `src/pages/LevelsPage.tsx` | LevelPlaylistSection einbinden |
| `package.json` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` hinzufugen |
| DB-Migration | 2 Tabellen + RLS + Trigger |

