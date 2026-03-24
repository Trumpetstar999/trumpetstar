
## Integration Plan: TrumpetStar Player → TrumpetStar App

### What this involves
The TrumpetStar Player is a standalone audio player app with these pieces:
- **Database**: `levels`, `audio_files`, `level_items` tables + `audio-files` storage bucket (already exist in that project's DB)
- **Logic**: `useAudioPlayer` hook (soundtouchjs for pitch/tempo shifting), `AudioPlayer` component
- **Sub-components**: `TrackList`, `TrackSearch`, `LevelSelector`, `PlayerControls`, `ProgressBar`, `TempoSlider`, `CollapsibleLoopControls`, `SettingsPanel`, `TranspositionSelector`
- **Admin**: `AudioUpload`, `AudioLibrary`, `LevelManager` (audio levels, not video levels)
- **CSS**: Custom classes (`player-control`, `track-item`, `loop-marker`, etc.) + CSS variables (`--player-bg`, `--progress-fill`, `--gold`, `--slider-thumb`, `--progress-bg`)

### Key differences to handle
1. The Player project uses its **own Supabase DB** — the `levels`, `audio_files`, `level_items` tables and `audio-files` storage bucket do not exist yet in the current app's DB.
2. The Player has a `profiles.is_admin` flag — the current app uses `user_roles` table with `has_role()`. The admin write RLS policies must be rewritten to use `has_role(auth.uid(), 'admin')`.
3. `soundtouchjs` is not yet a dependency in `package.json`.
4. The `formatTime` helper doesn't exist yet in the current app's `src/lib/`.
5. The CSS variables (`--gold`, `--player-bg`, etc.) are not in the current app's `src/index.css`.
6. `TabId` needs a new `'audios'` value added.
7. The Player's `AudioPlayer` component references a logo asset via `@/assets/Logo_trumpetstar.png` — we'll strip the header (not needed inside the app shell).

### Plan

**Step 1 – Database migration**
Create a new migration that adds:
```sql
-- Audio levels (separate from video levels)
CREATE TABLE public.audio_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audio files
CREATE TABLE public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  display_name TEXT NOT NULL,
  duration_seconds NUMERIC,
  level_id UUID REFERENCES public.audio_levels(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audio level items (ordering)
CREATE TABLE public.audio_level_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.audio_levels(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL UNIQUE REFERENCES public.audio_files(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
RLS: SELECT public for all, INSERT/UPDATE/DELETE require `has_role(auth.uid(), 'admin')`.
Storage bucket: `audio-files` (public).

> Note: We rename `levels` → `audio_levels` and `level_items` → `audio_level_items` to avoid conflict with the existing `levels` table used by the video course system.

**Step 2 – Install `soundtouchjs`**
Add `"soundtouchjs": "^0.3.0"` to `package.json` dependencies.

**Step 3 – Copy and adapt player code**

New files to create:
```
src/lib/formatTime.ts                        (copy from Player)
src/hooks/useAudioPlayer.tsx                 (copy from Player)
src/components/audio/AudioPlayer.tsx         (adapted from AudioPlayer.tsx — no header, use audio_levels/audio_level_items table names)
src/components/audio/TrackList.tsx           (copy)
src/components/audio/TrackSearch.tsx         (copy)
src/components/audio/LevelSelector.tsx       (copy, rename internal Level type)
src/components/audio/PlayerControls.tsx      (copy)
src/components/audio/ProgressBar.tsx         (copy)
src/components/audio/TempoSlider.tsx         (copy)
src/components/audio/CollapsibleLoopControls.tsx  (copy)
src/components/audio/SettingsPanel.tsx       (copy)
src/components/audio/TranspositionSelector.tsx    (copy)
```

**Step 4 – Add CSS**
Append to `src/index.css`:
- CSS variables: `--gold`, `--player-bg`, `--progress-bg`, `--progress-fill`, `--slider-thumb`
- Component classes: `.player-control`, `.player-control-main`, `.track-item`, `.track-item-active`, `.loop-marker`
- Utility: `.text-secondary-white`, `.scrollbar-thin`

**Step 5 – Desktop tab: "Audios"**
- Add `'audios'` to `TabId` in `src/types/index.ts`
- Add `audios` to `tabToFlagKey`, `tabIcons`, `allTabIds` in `TabBar.tsx` (icon: `Headphones`)
- Add `audios: "Audios"` to navigation translations in `de.json`, `en.json`, `es.json`, `sl.json`
- Add feature flag default: `menu_audios` → enabled
- Add `case 'audios': return <AudiosPage />;` in `src/pages/Index.tsx`
- Create `src/pages/AudiosPage.tsx` that renders `<AudioPlayer />`

**Step 6 – Mobile: show AudioPlayer on MobileHomePage**
Add a bottom sheet or section in `MobileHomePage.tsx` that shows the `AudioPlayer` component (or a compact version). The mobile layout already has `pb-20` safe area. We'll add the player as an accessible section within the home screen below the iPad redirect card.

**Step 7 – Admin panel: Audio Manager**
Create `src/components/admin/AudioPlayerManager.tsx` combining `AudioUpload`, `AudioLibrary`, and the audio `LevelManager` (adapted to use `audio_levels`/`audio_level_items` table names). Add an `'audioplayer'` tab to `AdminPage.tsx`.

### What gets reused 1:1 (only table name change)
All business logic from the Player project is copied directly. The only changes are:
- `levels` → `audio_levels`
- `level_items` → `audio_level_items`
- Remove the Player's own header (logo + settings button) from `AudioPlayer.tsx` since the app already has `AppShell`
- RLS uses `has_role(auth.uid(), 'admin')` instead of `check_is_admin()`

### File summary
| Action | Files |
|--------|-------|
| New migration | `supabase/migrations/...audio_player_tables.sql` |
| New lib | `src/lib/formatTime.ts` |
| New hook | `src/hooks/useAudioPlayer.tsx` |
| New components (12) | `src/components/audio/*.tsx` |
| New admin component | `src/components/admin/AudioPlayerManager.tsx` |
| New page | `src/pages/AudiosPage.tsx` |
| Updated | `src/types/index.ts`, `TabBar.tsx`, `Index.tsx`, `AdminPage.tsx`, `src/index.css`, `package.json`, 4× translation files, `MobileHomePage.tsx` |
