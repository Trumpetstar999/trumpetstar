# Metronom & DrumMachine -- Implementierungsplan

## Uebersicht

Eine neue Tab-Seite "Metronom" wird das Stimmgerät oben in der gleichen Zeile. Sie bietet zwei Modi: **Metronom** (WebAudio-basierter Klick) und **DrumMachine** (Loop-Player fuer MP3-Beats aus der Datenbank).

---

## 1. Navigation & Routing

### TabId erweitern

- In `src/types/index.ts`: `'metronome'` zum `TabId`-Union hinzufuegen
- In `src/components/layout/TabBar.tsx`: Icon (z.B. `Timer` von lucide), Feature-Flag-Key `menu_metronome`, Position in `allTabIds`
- In `src/pages/Index.tsx`: `tabOrder` erweitern, `renderPage()` um `case 'metronome'` ergaenzen
- Feature-Flag `menu_metronome` in der Datenbank anlegen (per INSERT)

### Uebersetzungen

- `src/i18n/locales/de.json`: `"navigation.metronome": "Metronom"`
- `src/i18n/locales/en.json`: `"navigation.metronome": "Metronome"`
- `src/i18n/locales/es.json`: `"navigation.metronome": "Metronomo"`

---

## 2. Datenbank

### Neue Tabelle: `drum_beats`


| Spalte                | Typ         | Details                         |
| --------------------- | ----------- | ------------------------------- |
| id                    | uuid        | PK, default `gen_random_uuid()` |
| title                 | text        | NOT NULL                        |
| category              | text        | optional                        |
| native_bpm            | integer     | optional                        |
| time_signature_top    | integer     | optional                        |
| time_signature_bottom | integer     | optional                        |
| file_url              | text        | NOT NULL                        |
| is_active             | boolean     | default true                    |
| sort_order            | integer     | default 0                       |
| created_at            | timestamptz | default now()                   |


### RLS

- SELECT: `is_active = true` (alle User)
- ALL: Admins via `has_role(auth.uid(), 'admin')`

### Storage Bucket

- Neues Bucket `drum-beats` (public), damit die MP3s direkt per URL abspielbar sind

---

## 3. Seiten-Komponente: `MetronomePage`

### Struktur

```text
MetronomePage
  +-- ModeToggle (Metronom | DrumMachine)
  +-- SharedControls (BPM, Tap Tempo, Time Signature, Volume, Start/Stop)
  +-- MetronomeMode (Sound Style, Accent, Subdivision)
  +-- DrumMachineMode (Beat Dropdown, Tempo-Info)
  +-- useMetronomeEngine (WebAudio Scheduler)
  +-- useDrumMachineEngine (WebAudio Buffer Loop)
```

### Neue Dateien

- `src/pages/MetronomePage.tsx` -- Haupt-UI
- `src/hooks/useMetronomeEngine.tsx` -- WebAudio Scheduler (lookahead-basiert, kein setInterval)
- `src/hooks/useDrumMachineEngine.tsx` -- MP3-Loader, Buffer-Loop, Crossfade

---

## 4. Metronom-Engine (WebAudio Scheduler)

- `AudioContext` mit `latencyHint: 'playback'`
- Scheduler-Loop: `setInterval` 25ms prueft, ob Noten innerhalb `scheduleAheadTime` (0.1s) liegen
- Sounds: `OscillatorNode` (Beep) oder kurze synthetische Clicks via `AudioBuffer`
- Sound-Optionen: Click, Woodblock, Rim, Beep (min. 3 Varianten via synthetische Buffers)
- Akzent auf Beat 1: hoehere Frequenz/Lautstaerke
- Subdivision: Off, 8th, Triplet
- iOS: `audioContext.resume()` beim Start-Klick
- Drift-frei durch Vorausplanung (nicht per setTimeout/rAF)

---

## 5. DrumMachine-Engine (WebAudio Buffer Loop)

- MP3 laden via `fetch` -> `decodeAudioData` -> `AudioBufferSourceNode` mit `loop = true`
- Tempo: `playbackRate = userBPM / nativeBPM` (falls `nativeBPM` vorhanden)
- Live BPM-Aenderung: `source.playbackRate.linearRampToValueAtTime(newRate, ctx.currentTime + 0.05)`
- Beat-Wechsel: Crossfade ueber 200ms (`GainNode` fade-out alt, fade-in neu)
- Start/Stop: 100ms Fade-In/Fade-Out via `GainNode` (kein Knacksen)

---

## 6. Admin UI

- Neuer Tab `beats` in `AdminSidebar` (Icon: `Drum` oder `Music2`)
- Neue Komponente `src/components/admin/DrumBeatManager.tsx`:
  - Upload MP3 in Bucket `drum-beats`
  - Metadaten bearbeiten (title, category, native_bpm, time_signature, active)
  - Preview-Play im Admin
  - Deaktivieren/Loeschen
- In `AdminPage.tsx`: neuen Tab `beats` im Switch ergaenzen

---

## 7. Persistenz (localStorage)

Gespeichert unter Key `trumpetstar_metronome_settings`:

- `bpm`, `timeSignatureTop`, `timeSignatureBottom`, `volume`
- `soundStyle` (Metronom)
- `accentBeat1`, `subdivision`
- `lastBeatId` (DrumMachine)
- `mode` ("metronome" | "drummachine")

---

## 8. Modus-Wechsel Logik

Beim Umschalten:

1. Aktuell laufenden Modus stoppen (Engine.stop())
2. `isRunning = false` setzen
3. UI wechselt -- kein automatischer Start des neuen Modus

Regel: Nie gleichzeitig Audio aus beiden Engines.

---

## Technische Details

### Betroffene bestehende Dateien (Aenderungen)


| Datei                                   | Aenderung                     |
| --------------------------------------- | ----------------------------- |
| `src/types/index.ts`                    | `'metronome'` zu `TabId`      |
| `src/components/layout/TabBar.tsx`      | Icon, Flag-Key, Tab-Eintrag   |
| `src/pages/Index.tsx`                   | `tabOrder`, `renderPage` Case |
| `src/i18n/locales/de.json`              | Navigation-Label              |
| `src/i18n/locales/en.json`              | Navigation-Label              |
| `src/i18n/locales/es.json`              | Navigation-Label              |
| `src/pages/AdminPage.tsx`               | Neuer Admin-Tab               |
| `src/components/admin/AdminSidebar.tsx` | Neuer Sidebar-Eintrag         |


### Neue Dateien


| Datei                                      | Zweck                               |
| ------------------------------------------ | ----------------------------------- |
| `src/pages/MetronomePage.tsx`              | Haupt-UI mit Mode Toggle + Controls |
| `src/hooks/useMetronomeEngine.tsx`         | WebAudio Scheduler Engine           |
| `src/hooks/useDrumMachineEngine.tsx`       | Buffer-Loop Engine                  |
| `src/components/admin/DrumBeatManager.tsx` | Admin: Beats verwalten              |


### Datenbank-Migration

- CREATE TABLE `drum_beats` mit RLS
- INSERT Storage Bucket `drum-beats`
- INSERT Feature Flag `menu_metronome`