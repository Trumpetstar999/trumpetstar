

## Plan: Thumbnail-Vorschau bei Hover/Tap in "Alle Videos A–Z"

### Ansatz
Jeder Video-Button in der A–Z-Liste erhält ein Tooltip/Popover mit dem Thumbnail-Bild des Videos. Auf Desktop erscheint es beim Hover, auf Tablet beim Tap (Long-Press oder erstem Tap).

### Umsetzung

**Datei: `src/pages/LevelsPage.tsx`**

1. Die bestehenden `<button>`-Elemente (Zeilen 627–635) werden in eine `Tooltip`-Komponente von Radix UI gewrappt (bereits im Projekt vorhanden unter `@/components/ui/tooltip`).

2. Der `TooltipContent` zeigt das Video-Thumbnail als kleines Bild (~120×68px, 16:9 Aspect Ratio) mit abgerundeten Ecken.

3. Für Tablet-Kompatibilität: `delayDuration={0}` setzen und den Tooltip-Trigger auch auf `onTouchStart`/`onFocus` reagieren lassen – Radix Tooltip unterstützt Touch-Geräte über Focus-Events.

4. Ein `TooltipProvider` mit `delayDuration={200}` wird um den gesamten A–Z-Bereich gelegt.

### Struktur pro Video-Button (Pseudocode)
```text
<Tooltip>
  <TooltipTrigger asChild>
    <button>...</button>
  </TooltipTrigger>
  <TooltipContent side="top">
    <img src={video.thumbnail} className="w-30 h-auto rounded" />
  </TooltipContent>
</Tooltip>
```

Nur eine Datei wird geändert: `src/pages/LevelsPage.tsx`.

