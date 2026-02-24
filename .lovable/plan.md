

# Free-Plan Daily Limit System

## Ubersicht

Free-User erhalten taglich 3 Video-Starts und 3 Game-Starts. Nach Erreichen des Limits wird ein freundliches Upgrade-Overlay angezeigt. Pro/Basic-User sind nicht betroffen.

---

## 1. Datenbank

Neue Tabelle `daily_usage` mit atomarem Upsert:

```text
daily_usage
+--------------+-------------+---------------------------+
| user_id      | UUID        | NOT NULL                  |
| date_key     | TEXT        | NOT NULL (YYYY-MM-DD)     |
| videos_started| INT        | DEFAULT 0                 |
| games_started | INT        | DEFAULT 0                 |
| updated_at   | TIMESTAMPTZ | DEFAULT now()             |
+--------------+-------------+---------------------------+
UNIQUE (user_id, date_key)
```

RLS-Policies:
- SELECT: Nutzer sieht nur eigene Zeilen (`auth.uid() = user_id`)
- INSERT: Nutzer kann nur eigene Zeilen anlegen
- UPDATE: Nutzer kann nur eigene Zeilen updaten
- Admins: ALL

Eine DB-Funktion `increment_daily_usage(p_user_id UUID, p_date_key TEXT, p_type TEXT)` wird erstellt, die atomar per `INSERT ... ON CONFLICT DO UPDATE` den Zahler um 1 erhoht und den neuen Wert zuruckgibt. Das verhindert Race Conditions bei Doppelklicks.

---

## 2. Custom Hook: `useDailyUsage`

Neuer Hook `src/hooks/useDailyUsage.tsx`:

- Ermittelt `dateKey` aus Browser-Zeitzone (`Intl.DateTimeFormat`)
- Ladt aktuellen Stand aus `daily_usage` fur den User + heutiges Datum
- Stellt bereit:
  - `videosUsed`, `gamesUsed` (aktuelle Zahler)
  - `canStartVideo()` / `canStartGame()` -- pruft Plan (FREE?) + Limit
  - `recordVideoStart()` / `recordGameStart()` -- ruft DB-Funktion auf, gibt `true/false` zuruck
  - `isLoading`
- Nutzt `useMembership()` intern: wenn `planKey !== 'FREE'`, immer `true`
- Debounce: 800ms Sperre nach erfolgreichem Start

---

## 3. Upgrade-Overlay (Limit erreicht)

Neue Komponente `src/components/premium/DailyLimitOverlay.tsx`:

- Dialog/Modal mit freundlichem, motivierendem Text
- Titel: "Fur heute ist dein Free-Kontingent aufgebraucht"
- Text abhaengig vom Typ (Video/Game)
- Buttons:
  - Primary: "Jetzt upgraden" -- navigiert zu `/pricing`
  - Secondary: "Morgen weitermachen" -- schliesst Dialog

---

## 4. Daily Pass Indicator

Neue Komponente `src/components/premium/DailyPassIndicator.tsx`:

- Kompaktes UI-Element: "Videos: X/3 | Game: Y/3"
- Nur fur FREE-User sichtbar
- Bei 2/3: zeigt Micro-Teaser ("Noch 1 Video frei heute!")
- Wird im Header (`src/components/layout/Header.tsx`) eingebunden, nur wenn `planKey === 'FREE'`

---

## 5. Integration: Video-Start

In `src/pages/LevelsPage.tsx`:

- Beim Klick auf eine VideoCard (Zeile ~448/500/532 wo `setSelectedVideo` aufgerufen wird):
  - Vorher `canStartVideo()` prufen
  - Wenn blockiert: `DailyLimitOverlay` anzeigen statt Video zu offnen
  - Wenn erlaubt: `recordVideoStart()` aufrufen, dann Video offnen

---

## 6. Integration: Game-Start

In `src/components/game/GameLanding.tsx`:

- Beim Klick auf "Spiel starten" (navigate zu `/game/play`):
  - `canStartGame()` prufen
  - Wenn blockiert: `DailyLimitOverlay` anzeigen
  - Wenn erlaubt: `recordGameStart()`, dann navigieren

In `src/pages/GamePlayPage.tsx`:

- Zusatzliche Absicherung beim `handleActivateMic` (der eigentliche Game-Start):
  - Falls irgendwie direkt auf `/game/play` navigiert wurde ohne Check

---

## 7. Edge Cases

- **Offline/DB-Fehler**: `canStartVideo()`/`canStartGame()` gibt `false` zuruck bei Fehler, zeigt "Bitte neu laden"
- **Geraetewechsel**: Serverseitig persistent, Limits gelten uberall
- **Doppelklick**: 800ms Debounce im Hook + atomare DB-Funktion
- **Mitternachts-Reset**: Automatisch durch neuen `date_key` am nachsten Tag

---

## Dateien die erstellt/geandert werden

| Aktion | Datei |
|--------|-------|
| Migration | `supabase/migrations/..._daily_usage.sql` |
| Neu | `src/hooks/useDailyUsage.tsx` |
| Neu | `src/components/premium/DailyLimitOverlay.tsx` |
| Neu | `src/components/premium/DailyPassIndicator.tsx` |
| Andern | `src/components/layout/Header.tsx` -- Daily Pass Indicator einbinden |
| Andern | `src/pages/LevelsPage.tsx` -- Video-Start Gate |
| Andern | `src/components/game/GameLanding.tsx` -- Game-Start Gate |
| Andern | `src/pages/GamePlayPage.tsx` -- Fallback Gate |
| Andern | `src/i18n/locales/de.json`, `en.json`, `es.json` -- Texte |
| Andern | `src/integrations/supabase/types.ts` -- wird automatisch aktualisiert |

