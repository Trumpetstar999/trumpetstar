

## Ziel
Im Admin-Bereich → QR-Codes: Beim Verknüpfen eines QR-Codes mit Video/Audio ein **durchsuchbares Auswahlfeld** statt einer langen Dropdown-Liste anzeigen.

## Problem
`QRCodeManager.tsx` nutzt aktuell `<Select>` mit allen Videos/Audios als Liste. Bei 200+ Audios und vielen Videos ist das unbrauchbar — kein Filter, langes Scrollen.

## Lösung
Ersetze die zwei `<Select>`-Komponenten (Video / Audio) im **Add-Formular** und im **Edit-Formular** durch eine **Combobox mit Suchfeld** (Popover + Command-Pattern aus shadcn).

### Komponente: neue `SearchableSelect`
- Basiert auf bestehenden Primitives: `Popover` + `Command` + `CommandInput` + `CommandList` + `CommandItem` (alle bereits im Projekt vorhanden, siehe `src/components/ui/command.tsx`).
- Props: `value`, `onChange`, `options: { value, label }[]`, `placeholder`.
- Verhalten:
  - Trigger-Button zeigt aktuellen Wert oder Placeholder.
  - Klick → Popover öffnet mit Suchfeld + gefilterter Liste.
  - Tippen filtert live (cmdk macht das nativ).
  - Auswahl schließt Popover.

### Integration in `QRCodeManager.tsx`
4 Stellen ersetzen:
1. Add-Form Video-Select → `SearchableSelect`
2. Add-Form Audio-Select → `SearchableSelect`
3. Edit-Form Video-Select → `SearchableSelect`
4. Edit-Form Audio-Select → `SearchableSelect`

Audio-Optionen zusätzlich erweitern: aktuell wird nur `display_name` geladen — ergänze `audio_levels` (Level-Name) im Label, damit z.B. "01 Stille Nacht (X-Mas-Special)" angezeigt wird → bessere Unterscheidbarkeit bei doppelten Liedtiteln.

## Dateien
- **Neu:** `src/components/ui/searchable-select.tsx` (~50 Zeilen)
- **Edit:** `src/components/admin/QRCodeManager.tsx` (Selects ersetzen + Audio-Query mit Level-Join)

## Annahmen
- Keine neuen Dependencies (cmdk + Popover sind im Projekt).
- Design folgt bestehendem Admin-Stil (`admin.css`).
- Keine DB-Änderungen.

