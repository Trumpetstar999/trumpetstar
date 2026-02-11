

# TrumpetStar NoteRunner -- Game Integration Plan

## Uebersicht

Eine neue Rubrik "Game" wird in die bestehende TrumpetStar-App integriert. Das Spiel "NoteRunner" ist ein Notenlese-Trainer mit Echtzeit-Pitch-Detection, bei dem Noten von rechts nach links ueber ein Notensystem wandern und der Spieler sie auf der Trompete spielen muss.

---

## 1. Navigation und Routing

### TabBar-Erweiterung
- Neuer Tab `game` wird zum bestehenden `TabId`-Type hinzugefuegt
- Icon: `Gamepad2` aus lucide-react
- Feature-Flag `menu_game` wird in der DB angelegt (per Migration)
- Position: zwischen "Recordings" und "Chats" in der Tab-Reihenfolge

### Routing-Aenderungen
- `src/types/index.ts`: `TabId` erweitern um `'game'`
- `src/pages/Index.tsx`: neuen Case `game` in `renderPage()` + `tabOrder` ergaenzen
- `src/components/layout/TabBar.tsx`: `tabToFlagKey`, `tabIcons`, `allTabIds` erweitern
- i18n-Dateien (de/en/es): `navigation.game` Key hinzufuegen

### Eigene Route fuer Fullscreen-Gameplay
- `/game/play` als separate Route in `App.tsx` fuer den eigentlichen Game-Screen (ohne Header/TabBar)
- Die Game Landing Page laeuft innerhalb des normalen AppShell-Layouts
- Der Game-Screen selbst nutzt kein AppShell -- er rendert fullscreen

---

## 2. Neue Seiten und Komponenten

### Seiten
| Datei | Zweck |
|---|---|
| `src/pages/GamePage.tsx` | Landing Page mit Start/Settings/Highscores Buttons |
| `src/pages/GamePlayPage.tsx` | Fullscreen Game Screen (eigene Route `/game/play`) |

### Komponenten (alle unter `src/components/game/`)
| Komponente | Zweck |
|---|---|
| `GameLanding.tsx` | Titel, Beschreibung, Start/Settings/Highscores Buttons, Mikrofon-Hinweis |
| `GameCanvas.tsx` | Canvas-basierter Game Loop (Notenlinien, Noten, Clef, Partikel-Effekte) |
| `GameHUD.tsx` | Top-Bar: Level, Tempo, Score, Streak, Herzen |
| `GameStatusBar.tsx` | Bottom-Bereich: Mic-Status, Detected Pitch, Mapped Note, SFX Toggle, Settings-Zahnrad |
| `GameSettingsOverlay.tsx` | Overlay mit Skalen, Range, Vorzeichen, Gameplay-Einstellungen |
| `GameOverOverlay.tsx` | Game Over Screen mit Score-Zusammenfassung und "Nochmal" / "Zurueck" |
| `GameHighscores.tsx` | Highscore-Tabelle mit Filter (Heute/Woche/Allzeit) |
| `RangeSelector.tsx` | Visueller Range-Picker auf Mini-Notenzeile mit draggbaren Noten |
| `NoteRenderer.ts` | Utility: Noten-Rendering auf Canvas (Notenkoepfe, Vorzeichen, Hilfslinien) |
| `GameSFX.ts` | Sound-Effekte (Hit-Shimmer, Miss, Game Over) -- abschaltbar |

### Hooks
| Hook | Zweck |
|---|---|
| `src/hooks/useGamePitchDetection.tsx` | Erweitert bestehenden `usePitchDetection` um Bb-Transposition (+2 Halbtoene), Confidence Gate, Stability-Window (100ms) |
| `src/hooks/useGameLoop.tsx` | requestAnimationFrame-basierter Game Loop mit useRef-State-Trennung |
| `src/hooks/useGameSettings.tsx` | Game-Settings State (Scale, Key, Range, Accidental Mode, Speed etc.) mit localStorage Persistenz |
| `src/hooks/useGameHighscores.tsx` | Highscores laden/speichern (DB + localStorage Fallback) |

---

## 3. Visuelles Design

### Hintergrund (CSS/Canvas)
- Kraeftiger Blau-Gradient (TrumpetStar Brand-Farben: `--brand-blue-start` bis `--brand-blue-end`)
- Unterer Bereich: weiche Wolken (CSS-Gradient oder Canvas-gezeichnet)
- Oberer Bereich: dezente Sterne (kleine weisse Punkte mit Glow, animiert)

### Notensystem (Canvas)
- 5 horizontale goldene Linien (`reward-gold` Farbe) mit leichtem Glow
- Violinschluessel links: golden, gross, dezent leuchtend (SVG-Path auf Canvas gerendert)
- Noten: goldene Notenkoepfe mit optionalen Vorzeichen und Hilfslinien

### Treffer-Feedback
- Korrekt: Note loest sich in goldenem Lichtschein auf (Halo-Expansion + weiche Partikel)
- Miss (Note erreicht Clef): Note wird rot/transparent, Herz-Animation
- Alle Animationen via Canvas-Partikel-System

---

## 4. Game-Logik (Details)

### Noten-Spawning
- Noten erscheinen am rechten Rand, bewegen sich linear nach links
- Geschwindigkeit basiert auf aktuellem Level/Tempo
- Nur Noten aus der gewaehlten Tonart + Skala + Range werden generiert
- Easy-Gewichtung: Tonika/Dominante/Terz 2x haeufiger

### Treffer-Erkennung
- Erkannter Konzertton + 2 Halbtoene = Written Pitch (Bb-Transposition)
- Vergleich gegen alle aktiven Noten auf dem Spielfeld
- Treffer gilt fuer die vorderste (naechste am Clef) passende Note
- Confidence Threshold konfigurierbar (Low/Med/High)
- Stability Window: Ton muss 80-120ms stabil erkannt werden

### Herzen-System
- 3 Herzen zu Beginn
- Herz geht verloren wenn Note den Violinschluessel erreicht (Miss)
- Animation: Herz wackelt und wird grau
- Game Over bei 0 Herzen

### Level-Progression
- Alle 10 korrekte Noten: Level +1, Geschwindigkeit erhoehen
- Start-Speed konfigurierbar (1-10)

### Skalen und Tonarten
- 15 Tonarten (C bis Cb)
- 8 Skalen-Typen (Major, Natural/Harmonic/Melodic Minor, Major/Minor Pentatonic, Blues, Chromatic)
- Vorzeichen-Modus: Generalvorzeichen ODER Einzelvorzeichen an der Note

---

## 5. Datenmodell

### Neue DB-Tabelle: `game_highscores`

```text
game_highscores
  id              UUID PK
  user_id         UUID NOT NULL (references profiles)
  score           INTEGER NOT NULL
  best_streak     INTEGER NOT NULL
  level_reached   INTEGER NOT NULL
  accuracy        DECIMAL(5,2) NOT NULL
  notes_correct   INTEGER NOT NULL
  notes_total     INTEGER NOT NULL
  scale_key       TEXT NOT NULL
  scale_type      TEXT NOT NULL
  accidental_mode TEXT NOT NULL
  range_min       TEXT NOT NULL
  range_max       TEXT NOT NULL
  created_at      TIMESTAMPTZ DEFAULT now()
```

- RLS: User kann nur eigene Highscores lesen/schreiben
- Feature-Flag `menu_game` per Migration einfuegen

---

## 6. Pitch Detection Pipeline

Basierend auf dem bestehenden `usePitchDetection.tsx`:

```text
Mikrofon (getUserMedia)
  --> AudioContext + AnalyserNode (fftSize 2048)
  --> Autocorrelation (bestehender Algorithmus)
  --> Frequenz --> Konzertton + Oktave + Cents
  --> Bb-Transposition: +2 Halbtoene = Written Pitch
  --> Confidence Gate (RMS-basiert)
  --> Stability Window (100ms gleicher Ton)
  --> Vergleich mit aktiven Noten
```

Der bestehende `autoCorrelate`-Algorithmus wird wiederverwendet. Die Erweiterung erfolgt in einem neuen `useGamePitchDetection` Hook, der intern `usePitchDetection` nutzt und die Transpositions-/Stability-Logik ergaenzt.

---

## 7. Performance-Strategie

- **Canvas-Rendering**: Gesamtes Spielfeld auf einem HTML5 Canvas
- **Game Loop**: `requestAnimationFrame` mit Delta-Time
- **State-Trennung**: Game-State in `useRef` (Noten-Positionen, Partikel etc.) -- kein React-State fuer Frame-Updates
- **Minimale Re-Renders**: Nur HUD-Werte (Score, Streak, Lives) als React-State, Update nur bei Aenderung
- **Cleanup**: AudioContext und MediaStream werden bei Unmount / Game Over sauber geschlossen

---

## 8. Implementierungsreihenfolge

1. **Types und Navigation** -- TabId erweitern, Feature Flag, i18n, Routing
2. **Game Landing Page** -- Einfache Seite mit Buttons, Mikrofon-Hinweis
3. **Game Settings** -- useGameSettings Hook + Settings Overlay
4. **Pitch Detection Erweiterung** -- useGamePitchDetection mit Bb-Mapping und Stability
5. **Game Canvas und Loop** -- Notenlinien, Clef, Noten-Rendering, Bewegung
6. **Treffer-Logik und HUD** -- Score, Streak, Herzen, Level-Progression
7. **Partikel und Feedback** -- Goldener Halo bei Treffer, Miss-Animation
8. **Highscores** -- DB-Tabelle, Hook, Highscores-Ansicht
9. **Game Over und Polish** -- Game Over Screen, SFX, Feinschliff

---

## 9. Technische Details

### Dateien die geaendert werden
- `src/types/index.ts` -- TabId um 'game' erweitern
- `src/pages/Index.tsx` -- tabOrder + renderPage Case
- `src/components/layout/TabBar.tsx` -- tabToFlagKey, tabIcons, allTabIds
- `src/App.tsx` -- Route `/game/play` hinzufuegen
- `src/i18n/locales/de.json`, `en.json`, `es.json` -- navigation.game Key

### Neue Dateien
- `src/pages/GamePage.tsx`
- `src/pages/GamePlayPage.tsx`
- `src/components/game/GameLanding.tsx`
- `src/components/game/GameCanvas.tsx`
- `src/components/game/GameHUD.tsx`
- `src/components/game/GameStatusBar.tsx`
- `src/components/game/GameSettingsOverlay.tsx`
- `src/components/game/GameOverOverlay.tsx`
- `src/components/game/GameHighscores.tsx`
- `src/components/game/RangeSelector.tsx`
- `src/components/game/NoteRenderer.ts`
- `src/components/game/GameSFX.ts`
- `src/components/game/constants.ts` (Skalen-Definitionen, Noten-Mapping)
- `src/hooks/useGamePitchDetection.tsx`
- `src/hooks/useGameLoop.tsx`
- `src/hooks/useGameSettings.tsx`
- `src/hooks/useGameHighscores.tsx`

### DB-Migration
- Tabelle `game_highscores` mit RLS
- Feature-Flag `menu_game` in `feature_flags` Tabelle einfuegen

